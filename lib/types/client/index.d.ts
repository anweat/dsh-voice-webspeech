/**
 * dsh-voice-webspeech — client half.
 *
 * Registers the mic button in the composer tool row (conversation.input.left)
 * and a settings section. The recognizer is the browser's built-in Web Speech
 * API: Edge = Microsoft Azure speech, Chrome = Google/Chrome speech.
 */
import type { Context } from './context-types.ts';
export declare const name = "dsh-voice-webspeech-client";
export declare const inject: string[];
export declare const LOCALE_NS = "voice.webspeech";
export declare function apply(ctx: Context): void;
