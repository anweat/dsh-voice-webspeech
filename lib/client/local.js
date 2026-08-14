/**
 * Local ASR backend: transformers.js + a small Whisper/Moonshine ONNX model
 * running in the browser via WebAssembly (onnxruntime-web). No server, no key.
 * Audio is captured with MediaRecorder, decoded + resampled to 16kHz, then fed
 * to the pipeline. Models download once from the HuggingFace Hub and cache in
 * the browser.
 */
import { pipeline, env } from '@huggingface/transformers';
import { localModelSpec, langToWhisper } from "./models.js";
// onnxruntime-web loads its WASM from a CDN. jsdelivr works widely; mainland
// users can swap this to a China mirror (e.g. registry.npmmirror.com) before
// first use. Single-threaded to avoid bundling a web-worker in the CJS closure.
env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends.onnx.wasm !== undefined) {
    env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/';
    env.backends.onnx.wasm.numThreads = 1;
}
const pipelineCache = new Map();
/** Load (and download) a local model. Idempotent once cached. */
export async function downloadLocalModel(id, onProgress) {
    if (pipelineCache.has(id))
        return;
    const spec = localModelSpec(id);
    const pipe = await pipeline('automatic-speech-recognition', spec.repo, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: (progress) => {
            if (progress.status !== 'progress')
                return;
            const loaded = Number(progress.loaded ?? 0);
            const total = Number(progress.total ?? 0);
            const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
            onProgress?.({ loaded, total, percent, file: typeof progress.file === 'string' ? progress.file : undefined });
        },
    });
    pipelineCache.set(id, pipe);
}
export function isLocalModelReady(id) {
    return pipelineCache.has(id);
}
/** Release a loaded model from memory (keeps the browser cache on disk). */
export function unloadLocalModel(id) {
    pipelineCache.delete(id);
}
/** Create the local (batch) recognizer: record → transcribe → onResult. */
export function createLocalRecognizer(modelId, lang, hooks) {
    let phase = 'idle';
    let stream = null;
    let recorder = null;
    let chunks = [];
    const cleanupStream = () => {
        stream?.getTracks().forEach(track => { track.stop(); });
        stream = null;
        recorder = null;
        chunks = [];
    };
    const transcribe = async () => {
        try {
            phase = 'processing';
            hooks.onProcessing?.();
            const pipe = pipelineCache.get(modelId);
            if (pipe === undefined) {
                throw new Error('local model not loaded — download it first in settings');
            }
            const mime = recorder?.mimeType ?? 'audio/webm';
            const blob = new Blob(chunks, { type: mime });
            const pcm = await decodeToPcm16k(blob);
            const result = await pipe(pcm, {
                ...(localModelSpec(modelId).whisperLanguage ? { language: langToWhisper(lang) ?? 'chinese' } : {}),
                task: 'transcribe',
            });
            const text = typeof result.text === 'string'
                ? result.text
                : '';
            phase = 'idle';
            hooks.onResult?.(text);
            hooks.onEnd?.();
        }
        catch (error) {
            phase = 'idle';
            hooks.onError?.({ code: 'local-error', message: error instanceof Error ? error.message : String(error) });
            hooks.onEnd?.();
        }
        finally {
            cleanupStream();
        }
    };
    const start = () => {
        if (phase !== 'idle')
            return;
        void (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            catch {
                phase = 'idle';
                hooks.onError?.({ code: 'audio-capture', message: 'microphone unavailable' });
                hooks.onEnd?.();
                return;
            }
            if (phase !== 'idle')
                return;
            chunks = [];
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0)
                    chunks.push(event.data);
            };
            recorder.onstop = () => { void transcribe(); };
            recorder.start();
            phase = 'recording';
            hooks.onStart?.();
        })();
    };
    const stop = () => {
        if (phase !== 'recording')
            return;
        try {
            recorder?.stop();
        }
        catch {
            void transcribe();
        }
    };
    const abort = () => {
        cleanupStream();
        phase = 'idle';
        hooks.onEnd?.();
    };
    const dispose = () => {
        cleanupStream();
        phase = 'idle';
    };
    return {
        get phase() { return phase; },
        start,
        stop,
        abort,
        dispose,
    };
}
/** Decode a compressed audio blob and resample to 16kHz mono Float32. */
async function decodeToPcm16k(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const targetRate = 16000;
        const length = Math.max(1, Math.ceil(audioBuffer.duration * targetRate));
        const offline = new OfflineAudioContext(1, length, targetRate);
        const source = offline.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offline.destination);
        source.start();
        const rendered = await offline.startRendering();
        return rendered.getChannelData(0);
    }
    finally {
        void audioContext.close();
    }
}
