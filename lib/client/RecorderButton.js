import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { isWebSpeechSupported } from "./webspeech.js";
import { createBackendRecognizer } from "./backend.js";
import { loadPrefs, subscribePrefs } from "./prefs.js";
import css from './RecorderButton.module.css';
/** Fatal error codes: recognition cannot proceed (permission/capture/network). */
function isFatal(code) {
    return code === 'not-allowed' || code === 'service-not-allowed'
        || code === 'audio-capture' || code === 'network' || code === 'unsupported';
}
export function RecorderButton({ inputActions, input, t }) {
    const prefs = useSyncExternalStore(subscribePrefs, loadPrefs);
    const [recording, setRecording] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [overlay, setOverlay] = useState({ kind: null, text: '' });
    const supported = prefs.backend === 'local' || isWebSpeechSupported();
    const activeRef = useRef(false);
    const fatalRef = useRef(false);
    const accumulatedRef = useRef('');
    const recognizerRef = useRef(null);
    const errorTimerRef = useRef(null);
    const prefsRef = useRef(prefs);
    prefsRef.current = prefs;
    const inputActionsRef = useRef(inputActions);
    inputActionsRef.current = inputActions;
    const inputRef = useRef(input);
    inputRef.current = input;
    const tRef = useRef(t);
    tRef.current = t;
    useEffect(() => {
        const deliver = (text) => {
            const trimmed = text.trim();
            if (trimmed === '')
                return;
            const current = prefsRef.current;
            if (current.autoSend) {
                inputActionsRef.current.setDraft(trimmed);
                inputActionsRef.current.submit();
                return;
            }
            const existing = inputRef.current?.draft ?? '';
            if (current.append && existing.trim() !== '') {
                inputActionsRef.current.setDraft(existing + ' ' + trimmed);
            }
            else {
                inputActionsRef.current.setDraft(trimmed);
            }
        };
        const recognizer = createBackendRecognizer(prefs, {
            onStart: () => {
                setProcessing(false);
                setRecording(true);
                setOverlay({ kind: 'recording', text: tRef.current('listening') });
            },
            onInterim: (text) => {
                if (!prefsRef.current.showInterim)
                    return;
                const base = tRef.current('listening');
                setOverlay({ kind: 'recording', text: text !== '' ? `${base} ${text}` : base });
            },
            onProcessing: () => {
                setProcessing(true);
                setOverlay({ kind: 'processing', text: tRef.current('transcribing') });
            },
            onResult: (text) => {
                const part = text.trim();
                if (part === '')
                    return;
                accumulatedRef.current = accumulatedRef.current === '' ? part : accumulatedRef.current + ' ' + part;
            },
            onError: (error) => {
                if (error.code === 'no-speech' || error.code === 'aborted')
                    return;
                if (isFatal(error.code)) {
                    fatalRef.current = true;
                    setOverlay({ kind: 'error', text: messageOf(error.code, tRef.current) });
                    if (errorTimerRef.current !== null)
                        clearTimeout(errorTimerRef.current);
                    errorTimerRef.current = setTimeout(() => {
                        setOverlay({ kind: null, text: '' });
                        errorTimerRef.current = null;
                    }, 4000);
                }
            },
            onEnd: () => {
                if (fatalRef.current) {
                    fatalRef.current = false;
                    setRecording(false);
                    setProcessing(false);
                    return;
                }
                if (activeRef.current) {
                    recognizer.start();
                    return;
                }
                const text = accumulatedRef.current;
                accumulatedRef.current = '';
                setRecording(false);
                setProcessing(false);
                setOverlay({ kind: null, text: '' });
                deliver(text);
            },
        });
        recognizerRef.current = recognizer;
        return () => {
            if (errorTimerRef.current !== null)
                clearTimeout(errorTimerRef.current);
            recognizer.dispose();
            recognizerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefs.lang, prefs.backend, prefs.localModel]);
    const startRecognition = () => {
        if (errorTimerRef.current !== null) {
            clearTimeout(errorTimerRef.current);
            errorTimerRef.current = null;
        }
        if (!supported) {
            setOverlay({ kind: 'error', text: t('unsupported') });
            errorTimerRef.current = setTimeout(() => {
                setOverlay({ kind: null, text: '' });
                errorTimerRef.current = null;
            }, 4000);
            return;
        }
        activeRef.current = true;
        fatalRef.current = false;
        accumulatedRef.current = '';
        setOverlay({ kind: null, text: '' });
        recognizerRef.current?.start();
    };
    const stopRecognition = () => {
        activeRef.current = false;
        recognizerRef.current?.stop();
    };
    const handlePointerDown = (event) => {
        if (prefsRef.current.mode !== 'hold')
            return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        if (!activeRef.current)
            startRecognition();
    };
    const handlePointerEnd = () => {
        if (prefsRef.current.mode !== 'hold')
            return;
        if (activeRef.current)
            stopRecognition();
    };
    const handleClick = () => {
        if (prefsRef.current.mode !== 'toggle')
            return;
        if (activeRef.current)
            stopRecognition();
        else
            startRecognition();
    };
    const title = supported
        ? (prefs.mode === 'hold' ? t('holdToTalk') : t('tapToTalk'))
        : t('unsupported');
    const busy = recording || processing;
    return (_jsxs("div", { className: css.wrap, children: [(overlay.kind !== null) && (_jsx("div", { className: overlay.kind === 'error' ? css.overlayError : overlay.kind === 'processing' ? css.overlayProcessing : css.overlay, role: overlay.kind === 'error' ? 'alert' : 'status', children: overlay.text })), _jsx("button", { type: "button", className: busy ? css.micActive : css.mic, "aria-label": t('buttonLabel'), "aria-pressed": busy, title: title, onPointerDown: handlePointerDown, onPointerUp: handlePointerEnd, onPointerCancel: handlePointerEnd, onClick: handleClick, onContextMenu: (event) => { event.preventDefault(); }, children: _jsx("svg", { className: css.icon, viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { fill: "currentColor", d: "M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.94V22h2v-2.06A8 8 0 0 0 20 12h-2Z" }) }) })] }));
}
function messageOf(code, t) {
    switch (code) {
        case 'unsupported': return t('unsupported');
        case 'not-allowed':
        case 'service-not-allowed': return t('notAllowed');
        case 'network': return t('network');
        case 'no-speech': return t('noSpeech');
        case 'audio-capture': return t('audioCapture');
        case 'local-error': return t('failure', { code: 'local' });
        default: return t('failure', { code });
    }
}
