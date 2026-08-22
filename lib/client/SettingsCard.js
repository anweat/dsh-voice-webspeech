import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useSyncExternalStore } from 'react';
import { loadPrefs, subscribePrefs, updatePrefs } from "./prefs.js";
import { detectBrowserSpeech } from "./detect.js";
import { downloadLocalModel, isLocalModelReady } from "./local.js";
import { LOCAL_MODELS, localModelSpec } from "./models.js";
import css from './SettingsCard.module.css';
const LANG_OPTIONS = [
    { value: 'zh-CN', label: '中文（普通话）' },
    { value: 'zh-TW', label: '中文（繁體）' },
    { value: 'zh-HK', label: '中文（粤语）' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'ja-JP', label: '日本語' },
    { value: 'ko-KR', label: '한국어' },
    { value: 'fr-FR', label: 'Français' },
    { value: 'de-DE', label: 'Deutsch' },
    { value: 'es-ES', label: 'Español' },
    { value: 'ru-RU', label: 'Русский' },
];
export function SettingsCard({ t }) {
    const [open, setOpen] = useState(false);
    const prefs = useSyncExternalStore(subscribePrefs, loadPrefs);
    const [info] = useState(() => detectBrowserSpeech());
    const [downloading, setDownloading] = useState(null);
    const [downloadError, setDownloadError] = useState(null);
    const [readyTick, setReadyTick] = useState(0);
    const set = (patch) => { updatePrefs(patch); };
    const modelReady = isLocalModelReady(prefs.localModel);
    const handleDownload = async (id) => {
        setDownloading({ model: id, percent: 0 });
        setDownloadError(null);
        try {
            await downloadLocalModel(id, (p) => { setDownloading({ model: id, percent: p.percent }); });
            setDownloading(null);
            setReadyTick(v => v + 1);
        }
        catch (error) {
            setDownloading(null);
            setDownloadError(error instanceof Error ? error.message : String(error));
        }
    };
    return (_jsxs("div", { className: open ? css.card + ' ' + css.cardOpen : css.card, children: [_jsxs("button", { type: "button", className: css.header, "aria-expanded": open, onClick: () => { setOpen(!open); }, children: [_jsxs("span", { className: css.headText, children: [_jsx("span", { className: css.name, children: t('settingsTitle') }), _jsx("span", { className: css.description, children: t('settingsDesc') })] }), _jsx("svg", { className: open ? css.chevron + ' ' + css.chevronOpen : css.chevron, viewBox: "0 0 14 14", width: "14", height: "14", "aria-hidden": "true", children: _jsx("path", { d: "M3.5 5.5 7 9l3.5-3.5", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), open && (_jsxs("div", { className: css.body, children: [_jsxs("div", { className: css.field, children: [_jsx("label", { className: css.label, htmlFor: "voice-webspeech-mode", children: t('modeTitle') }), _jsxs("select", { id: "voice-webspeech-mode", className: css.select, value: prefs.mode, onChange: event => { set({ mode: event.currentTarget.value === 'hold' ? 'hold' : 'toggle' }); }, children: [_jsx("option", { value: "toggle", children: t('modeToggle') }), _jsx("option", { value: "hold", children: t('modeHold') })] })] }), _jsxs("div", { className: css.field, children: [_jsx("label", { className: css.label, htmlFor: "voice-webspeech-lang", children: t('langTitle') }), _jsx("select", { id: "voice-webspeech-lang", className: css.select, value: prefs.lang, onChange: event => { set({ lang: event.currentTarget.value }); }, children: LANG_OPTIONS.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { className: css.field, children: [_jsx("label", { className: css.label, htmlFor: "voice-webspeech-backend", children: t('backendTitle') }), _jsxs("select", { id: "voice-webspeech-backend", className: css.select, value: prefs.backend, onChange: event => { set({ backend: event.currentTarget.value === 'local' ? 'local' : 'webspeech' }); }, children: [_jsx("option", { value: "webspeech", children: t('backendWebSpeech') }), _jsx("option", { value: "local", children: t('backendLocal') })] })] }), prefs.backend === 'local' && (_jsxs("div", { className: css.field, children: [_jsx("label", { className: css.label, htmlFor: "voice-webspeech-model", children: t('modelTitle') }), _jsx("select", { id: "voice-webspeech-model", className: css.select, value: prefs.localModel, onChange: event => { set({ localModel: event.currentTarget.value }); }, children: LOCAL_MODELS.map(m => (_jsxs("option", { value: m.id, children: [m.label, "\uFF08", m.sizeHint, "\uFF09"] }, m.id))) }), _jsx("p", { className: css.hint, children: localModelSpec(prefs.localModel).note })] })), prefs.backend === 'local' && (_jsxs("div", { className: css.field, children: [_jsx("span", { className: css.label, children: t('downloadModel') }), modelReady ? (_jsx("p", { className: css.hint, children: t('modelReady') })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: css.button, disabled: downloading !== null, onClick: () => { void handleDownload(prefs.localModel); }, children: downloading !== null ? t('downloading', { percent: downloading.percent }) : t('downloadModel') }), downloading !== null && _jsx("p", { className: css.hint, children: t('downloading', { percent: downloading.percent }) })] })), downloadError !== null && _jsx("p", { className: css.hint, children: t('downloadFailed', { error: downloadError }) })] })), _jsxs("label", { className: css.toggleRow, children: [_jsxs("span", { className: css.toggleText, children: [_jsx("span", { className: css.label, children: t('autoSendTitle') }), _jsx("span", { className: css.hint, children: t('autoSendDesc') })] }), _jsx("input", { type: "checkbox", className: css.toggle, checked: prefs.autoSend, onChange: event => { set({ autoSend: event.currentTarget.checked }); } })] }), _jsxs("label", { className: css.toggleRow, children: [_jsxs("span", { className: css.toggleText, children: [_jsx("span", { className: css.label, children: t('appendTitle') }), _jsx("span", { className: css.hint, children: t('appendDesc') })] }), _jsx("input", { type: "checkbox", className: css.toggle, checked: prefs.append, onChange: event => { set({ append: event.currentTarget.checked }); } })] }), _jsxs("label", { className: css.toggleRow, children: [_jsxs("span", { className: css.toggleText, children: [_jsx("span", { className: css.label, children: t('interimTitle') }), _jsx("span", { className: css.hint, children: t('interimDesc') })] }), _jsx("input", { type: "checkbox", className: css.toggle, checked: prefs.showInterim, onChange: event => { set({ showInterim: event.currentTarget.checked }); } })] }), _jsxs("div", { className: css.field, children: [_jsx("span", { className: css.label, children: t('browserGroupTitle') }), _jsx("p", { className: css.hint, children: info.supported ? t('browserSupported') : t('browserUnsupported') }), info.supported && _jsx("p", { className: css.hint, children: t('browserBackend', { backend: info.backend }) })] }), _jsxs("div", { className: css.field, children: [_jsx("span", { className: css.label, children: t('privacyTitle') }), _jsx("p", { className: css.hint, children: t('privacyDesc') })] })] }))] }));
}
