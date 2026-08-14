/**
 * Web Speech recognizer — the sole backend. Wraps the browser's built-in
 * SpeechRecognition (webkitSpeechRecognition): Edge routes to Microsoft Azure,
 * Chrome routes to Google/Chrome speech. Interim results, final accumulation,
 * abort semantics, and a safe no-op recognizer for unsupported browsers.
 */
export type RecognitionPhase = 'idle' | 'recording' | 'stopping';
export interface RecognitionError {
    readonly code: string;
    readonly message: string;
}
export interface RecognitionHooks {
    onStart?: () => void;
    onInterim?: (text: string) => void;
    onResult?: (text: string) => void;
    onError?: (error: RecognitionError) => void;
    onEnd?: () => void;
}
export interface SpeechRecognizer {
    readonly phase: RecognitionPhase;
    start(): void;
    stop(): void;
    abort(): void;
    dispose(): void;
}
export declare function isWebSpeechSupported(): boolean;
export declare function createWebSpeechRecognizer(lang: string, hooks: RecognitionHooks): SpeechRecognizer;
