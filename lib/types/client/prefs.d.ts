/**
 * Client preferences (localStorage). loadPrefs MUST return a stable reference
 * (useSyncExternalStore compares snapshots with Object.is).
 */
import type { LocalModelId } from './models.ts';
export type InteractionMode = 'toggle' | 'hold';
export type BackendId = 'webspeech' | 'local';
export interface VoiceWebspeechPrefs {
    /** BCP-47 recognition language (e.g. zh-CN, en-US). */
    lang: string;
    /** Interaction: 'toggle' (tap to start/stop) or 'hold' (press-and-hold). */
    mode: InteractionMode;
    /** Recognition backend: browser Web Speech (zero download) or a local WASM model. */
    backend: BackendId;
    /** Which local model to use when backend === 'local'. */
    localModel: LocalModelId;
    /** Auto-submit on stop; false = insert into draft for review. */
    autoSend: boolean;
    /** When not auto-sending, append to the existing draft instead of replacing it. */
    append: boolean;
    /** Show live interim text while listening (Web Speech backend only). */
    showInterim: boolean;
}
export declare const DEFAULT_PREFS: VoiceWebspeechPrefs;
export declare const PREFS_KEY = "dsh-voice-webspeech.prefs";
export declare function loadPrefs(): VoiceWebspeechPrefs;
export declare function updatePrefs(patch: Partial<VoiceWebspeechPrefs>): VoiceWebspeechPrefs;
export declare function subscribePrefs(callback: () => void): () => void;
export declare function notifyPrefsChanged(): void;
