import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createWebSpeechRecognizer, isWebSpeechSupported } from "./webspeech.js";
import { loadPrefs, subscribePrefs } from "./prefs.js";
import css from './RecorderButton.module.css';
export function RecorderButton({ inputActions, input, t }) {
    const prefs = useSyncExternalStore(subscribePrefs, loadPrefs);
    const [recording, setRecording] = useState(false);
    const [overlay, setOverlay] = useState({ kind: null, text: '' });
    const [supported] = useState(() => isWebSpeechSupported());
    const pressedRef = useRef(false);
    const recognizerRef = useRef(null);
    const prefsRef = useRef(prefs);
    prefsRef.current = prefs;
    const inputActionsRef = useRef(inputActions);
    inputActionsRef.current = inputActions;
    const inputRef = useRef(input);
    inputRef.current = input;
    const tRef = useRef(t);
    tRef.current = t;
    // (re)build the recognizer when the language changes
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
        const recognizer = createWebSpeechRecognizer(prefs.lang, {
            onStart: () => {
                setRecording(true);
                setOverlay({ kind: 'recording', text: tRef.current('listening') });
            },
            onInterim: (text) => {
                if (!prefsRef.current.showInterim)
                    return;
                const base = tRef.current('listening');
                setOverlay({ kind: 'recording', text: text !== '' ? `${base} ${text}` : base });
            },
            onResult: (text) => {
                setOverlay({ kind: null, text: '' });
                deliver(text);
            },
            onError: (error) => {
                setOverlay({ kind: 'error', text: messageOf(error.code, tRef.current) });
            },
            onEnd: () => {
                setRecording(false);
            },
        });
        recognizerRef.current = recognizer;
        return () => {
            recognizer.dispose();
            recognizerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefs.lang]);
    const handlePointerDown = (event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        if (!supported) {
            setOverlay({ kind: 'error', text: t('unsupported') });
            return;
        }
        pressedRef.current = true;
        setOverlay({ kind: null, text: '' });
        recognizerRef.current?.start();
    };
    const handlePointerEnd = () => {
        if (!pressedRef.current)
            return;
        pressedRef.current = false;
        recognizerRef.current?.stop();
    };
    return (_jsxs("div", { className: css.wrap, children: [(overlay.kind !== null) && (_jsx("div", { className: overlay.kind === 'error' ? css.overlayError : css.overlay, role: overlay.kind === 'error' ? 'alert' : 'status', children: overlay.text })), _jsx("button", { type: "button", className: recording ? css.micActive : css.mic, "aria-label": t('buttonLabel'), "aria-pressed": recording, title: supported ? t('holdToTalk') : t('unsupported'), onPointerDown: handlePointerDown, onPointerUp: handlePointerEnd, onPointerCancel: handlePointerEnd, children: _jsx("svg", { className: css.icon, viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { fill: "currentColor", d: "M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.94V22h2v-2.06A8 8 0 0 0 20 12h-2Z" }) }) })] }));
}
function messageOf(code, t) {
    switch (code) {
        case 'unsupported': return t('unsupported');
        case 'not-allowed':
        case 'service-not-allowed': return t('notAllowed');
        case 'network': return t('network');
        case 'no-speech': return t('noSpeech');
        case 'audio-capture': return t('audioCapture');
        default: return t('failure', { code });
    }
}
