/**
 * Local (in-browser WASM) ASR model registry. Models download from the
 * HuggingFace Hub on first use (free, no key) and cache in the browser.
 */
export type LocalModelId = 'whisper-tiny' | 'whisper-base' | 'moonshine-tiny';
export interface LocalModelSpec {
    id: LocalModelId;
    /** HuggingFace repo id. */
    repo: string;
    label: string;
    sizeHint: string;
    note: string;
    /** Whether the model accepts a Whisper-style language hint. */
    whisperLanguage: boolean;
}
export declare const LOCAL_MODELS: readonly LocalModelSpec[];
export declare function localModelSpec(id: LocalModelId): LocalModelSpec;
/** Map a BCP-47 lang to a Whisper language code (undefined = auto-detect). */
export declare function langToWhisper(lang: string): string | undefined;
