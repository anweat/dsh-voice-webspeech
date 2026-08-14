/**
 * Recognition backend factory: Web Speech (zero-download, cloud) or a local
 * WASM model (download once, offline). Chosen from prefs.backend.
 */
import type { SpeechRecognizer, RecognitionHooks } from './webspeech.ts'
import { createWebSpeechRecognizer } from './webspeech.ts'
import { createLocalRecognizer } from './local.ts'
import type { VoiceWebspeechPrefs } from './prefs.ts'

export function createBackendRecognizer(
  prefs: VoiceWebspeechPrefs,
  hooks: RecognitionHooks,
): SpeechRecognizer {
  if (prefs.backend === 'local') {
    return createLocalRecognizer(prefs.localModel, prefs.lang, hooks)
  }
  return createWebSpeechRecognizer(prefs.lang, hooks)
}
