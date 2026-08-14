import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
/** Composer input action surface (injected by the standard kit). */
export interface VoiceInputActions {
    setDraft(text: string): void;
    submit(): void;
}
export type RecorderButtonProps = {
    inputActions: VoiceInputActions;
    input?: {
        readonly draft: string;
    };
} & PropsLocale<'voice.webspeech'>;
export declare function RecorderButton({ inputActions, input, t }: RecorderButtonProps): import("react").JSX.Element;
