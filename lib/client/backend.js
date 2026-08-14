import { createWebSpeechRecognizer } from "./webspeech.js";
import { createLocalRecognizer } from "./local.js";
export function createBackendRecognizer(prefs, hooks) {
    if (prefs.backend === 'local') {
        return createLocalRecognizer(prefs.localModel, prefs.lang, hooks);
    }
    return createWebSpeechRecognizer(prefs.lang, hooks);
}
