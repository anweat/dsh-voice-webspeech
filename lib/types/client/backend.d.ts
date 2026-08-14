/**
 * Recognition backend factory: Web Speech (zero-download, cloud) or a local
 * WASM model (download once, offline). Chosen from prefs.backend.
 */
import type { SpeechRecognizer, RecognitionHooks } from './webspeech.ts';
import type { VoiceWebspeechPrefs } from './prefs.ts';
export declare function createBackendRecognizer(prefs: VoiceWebspeechPrefs, hooks: RecognitionHooks): SpeechRecognizer;
