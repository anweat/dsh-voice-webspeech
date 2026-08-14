import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createWebSpeechRecognizer, isWebSpeechSupported } from "./webspeech.js";
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
    const [overlay, setOverlay] = useState({ kind: null, text: '' });
    const [supported] = useState(() => isWebSpeechSupported());
    // activeRef = "识别应当持续"：hold 模式=按住期间；toggle 模式=切换开启期间
    const activeRef = useRef(false);
    const fatalRef = useRef(false);
    // 跨识别会话累积（按住/切换开启期间每次短语结束都重启，文本在此累积）
    const accumulatedRef = useRef('');
    const recognizerRef = useRef(null);
    // 错误提示自动消失的定时器
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
                const part = text.trim();
                if (part === '')
                    return;
                accumulatedRef.current = accumulatedRef.current === '' ? part : accumulatedRef.current + ' ' + part;
            },
            onError: (error) => {
                if (error.code === 'no-speech' || error.code === 'aborted')
                    return; // 非致命：由 onEnd 重启
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
                    return;
                }
                if (activeRef.current) {
                    // 仍应持续：立即重启，继续下一段听写（跨短语累积）
                    recognizer.start();
                    return;
                }
                // 已停止：交付累积文本
                const text = accumulatedRef.current;
                accumulatedRef.current = '';
                setRecording(false);
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
    }, [prefs.lang]);
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
    // hold 模式：按住识别、松手停止
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
    // toggle 模式：点击切换（点一下开始，再点一下停止）
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
    return (_jsxs("div", { className: css.wrap, children: [(overlay.kind !== null) && (_jsx("div", { className: overlay.kind === 'error' ? css.overlayError : css.overlay, role: overlay.kind === 'error' ? 'alert' : 'status', children: overlay.text })), _jsx("button", { type: "button", className: recording ? css.micActive : css.mic, "aria-label": t('buttonLabel'), "aria-pressed": recording, title: title, onPointerDown: handlePointerDown, onPointerUp: handlePointerEnd, onPointerCancel: handlePointerEnd, onClick: handleClick, onContextMenu: (event) => { event.preventDefault(); }, children: _jsx("svg", { className: css.icon, viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { fill: "currentColor", d: "M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.94V22h2v-2.06A8 8 0 0 0 20 12h-2Z" }) }) })] }));
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
