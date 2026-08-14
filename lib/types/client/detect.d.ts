/**
 * Browser speech-capability diagnostics (runs in the user's browser).
 * Detects which SpeechRecognition constructor is exposed and reports the
 * likely backend so the settings card can surface what will actually happen.
 */
export type SpeechConstructorName = 'standard' | 'webkit' | 'none';
export interface BrowserSpeechInfo {
    supported: boolean;
    constructorName: SpeechConstructorName;
    backend: string;
    userAgent: string;
}
export declare function detectBrowserSpeech(): BrowserSpeechInfo;
