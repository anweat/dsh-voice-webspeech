/**
 * dsh-voice-webspeech — host half.
 *
 * Pure browser voice input for the DSH Web UI. Everything (microphone capture
 * + speech-to-text) happens in the browser through the Web Speech API:
 *   - Microsoft Edge  → Microsoft Azure speech service
 *   - Google Chrome   → Google/Chrome speech service
 * No server work, no API key, no model download, no Python.
 *
 * The host half only places the plugin in the host cordis tree so the
 * client-modules scanner discovers the `dsh.client` bundle; it registers no
 * tools and opens no channels.
 */
import type { Context } from '@deepseek-ai/cordis';
export declare const name = "dsh-voice-webspeech";
export declare function apply(ctx: Context): void;
