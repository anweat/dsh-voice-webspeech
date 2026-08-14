/**
 * Client preferences (localStorage, same pattern as other DSH web plugins).
 * NOTE: loadPrefs MUST return a stable reference — useSyncExternalStore
 * compares snapshots with Object.is; a freshly-built object per call would
 * trigger an infinite re-render ("Maximum update depth exceeded") and crash
 * the slot entry. current is replaced only on real updates.
 */
export interface VoiceWebspeechPrefs {
    /** BCP-47 recognition language (e.g. zh-CN, en-US). */
    lang: string;
    /** Auto-submit on release (hold-to-talk → send); false = insert into draft for review. */
    autoSend: boolean;
    /** When not auto-sending, append to the existing draft instead of replacing it. */
    append: boolean;
    /** Show live interim text in the overlay while listening. */
    showInterim: boolean;
}
export declare const DEFAULT_PREFS: VoiceWebspeechPrefs;
export declare const PREFS_KEY = "dsh-voice-webspeech.prefs";
export declare function loadPrefs(): VoiceWebspeechPrefs;
export declare function updatePrefs(patch: Partial<VoiceWebspeechPrefs>): VoiceWebspeechPrefs;
export declare function subscribePrefs(callback: () => void): () => void;
export declare function notifyPrefsChanged(): void;
