/**
 * Web Speech recognizer — the sole backend. Wraps the browser's built-in
 * SpeechRecognition (webkitSpeechRecognition): Edge routes to Microsoft Azure,
 * Chrome routes to Google/Chrome speech. Interim results, final accumulation,
 * abort semantics, and a safe no-op recognizer for unsupported browsers.
 */
export function isWebSpeechSupported() {
    return typeof window !== 'undefined'
        && (window.webkitSpeechRecognition !== undefined || window.SpeechRecognition !== undefined);
}
export function createWebSpeechRecognizer(lang, hooks) {
    const ctor = typeof window !== 'undefined'
        ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
        : undefined;
    if (ctor === undefined) {
        let phase = 'idle';
        return {
            get phase() { return phase; },
            start() {
                phase = 'idle';
                hooks.onError?.({ code: 'unsupported', message: 'This browser does not support the Web Speech API' });
                hooks.onEnd?.();
            },
            stop() { },
            abort() { phase = 'idle'; },
            dispose() { phase = 'idle'; },
        };
    }
    let phase = 'idle';
    let recognition;
    let finalText = '';
    let aborting = false;
    const onEnd = () => {
        if (phase === 'idle')
            return;
        phase = 'idle';
        hooks.onEnd?.();
    };
    const ensure = () => {
        if (recognition === undefined) {
            recognition = new ctor();
            recognition.lang = lang;
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            recognition.onstart = () => { hooks.onStart?.(); };
            recognition.onresult = (event) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i += 1) {
                    const result = event.results[i];
                    if (result === undefined)
                        continue;
                    const transcript = result[0]?.transcript ?? '';
                    if (result.isFinal) {
                        if (transcript !== '')
                            finalText += transcript;
                    }
                    else {
                        interim += transcript;
                    }
                }
                if (interim !== '')
                    hooks.onInterim?.(interim);
            };
            recognition.onerror = (event) => {
                if (event.error === 'aborted' || event.error === 'no-speech')
                    return;
                hooks.onError?.({ code: event.error, message: event.message });
            };
            recognition.onend = () => {
                recognition = undefined;
                if (aborting) {
                    aborting = false;
                    finalText = '';
                    onEnd();
                    return;
                }
                const text = finalText;
                finalText = '';
                hooks.onResult?.(text);
                onEnd();
            };
        }
        return recognition;
    };
    return {
        get phase() { return phase; },
        start() {
            if (phase === 'recording')
                return;
            finalText = '';
            aborting = false;
            phase = 'recording';
            try {
                ensure().start();
            }
            catch {
                phase = 'idle';
                hooks.onError?.({ code: 'audio-capture', message: 'Failed to start recognition' });
                hooks.onEnd?.();
            }
        },
        stop() {
            if (phase !== 'recording')
                return;
            phase = 'stopping';
            try {
                recognition?.stop();
            }
            catch {
                onEnd();
            }
        },
        abort() {
            if (phase === 'idle')
                return;
            phase = 'idle';
            aborting = true;
            try {
                recognition?.abort();
            }
            catch {
                aborting = false;
                onEnd();
            }
        },
        dispose() {
            if (recognition !== undefined) {
                recognition.onstart = null;
                recognition.onresult = null;
                recognition.onerror = null;
                recognition.onend = null;
                try {
                    if (phase !== 'idle')
                        recognition.abort();
                }
                catch {
                    // ignore
                }
                recognition = undefined;
            }
            phase = 'idle';
        },
    };
}
