/**
 * Local ASR backend: transformers.js + a small Whisper/Moonshine ONNX model
 * running in the browser via WebAssembly (onnxruntime-web). No server, no key.
 * Audio is captured with MediaRecorder, decoded + resampled to 16kHz, then fed
 * to the pipeline. Models download once from the HuggingFace Hub and cache in
 * the browser.
 */
import type { RecognitionHooks, SpeechRecognizer } from './webspeech.ts';
import { type LocalModelId } from './models.ts';
export type DownloadProgress = {
    loaded: number;
    total: number;
    percent: number;
    file?: string;
};
/** Load (and download) a local model. Idempotent once cached. */
export declare function downloadLocalModel(id: LocalModelId, onProgress?: (p: DownloadProgress) => void): Promise<void>;
export declare function isLocalModelReady(id: LocalModelId): boolean;
/** Release a loaded model from memory (keeps the browser cache on disk). */
export declare function unloadLocalModel(id: LocalModelId): void;
/** Create the local (batch) recognizer: record → transcribe → onResult. */
export declare function createLocalRecognizer(modelId: LocalModelId, lang: string, hooks: RecognitionHooks): SpeechRecognizer;
