import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSyncExternalStore } from 'react';
import { loadPrefs, subscribePrefs, updatePrefs } from "./prefs.js";
import css from './SettingsPanel.module.css';
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
export function SettingsPanel({ t }) {
    const prefs = useSyncExternalStore(subscribePrefs, loadPrefs);
    const set = (patch) => { updatePrefs(patch); };
    return (_jsxs("div", { className: css.section, children: [_jsxs("div", { className: css.group, children: [_jsx("span", { className: css.groupTitle, children: t('inputGroupTitle') }), _jsxs("div", { className: css.row, children: [_jsx("span", { className: css.rowText, children: _jsx("span", { className: css.title, children: t('langTitle') }) }), _jsx("select", { className: css.select, value: prefs.lang, onChange: event => { set({ lang: event.currentTarget.value }); }, children: LANG_OPTIONS.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: css.row, children: [_jsxs("span", { className: css.rowText, children: [_jsx("span", { className: css.title, children: t('autoSendTitle') }), _jsx("span", { className: css.desc, children: t('autoSendDesc') })] }), _jsx("input", { type: "checkbox", className: css.toggle, checked: prefs.autoSend, onChange: event => { set({ autoSend: event.currentTarget.checked }); } })] }), _jsxs("label", { className: css.row, children: [_jsxs("span", { className: css.rowText, children: [_jsx("span", { className: css.title, children: t('appendTitle') }), _jsx("span", { className: css.desc, children: t('appendDesc') })] }), _jsx("input", { type: "checkbox", className: css.toggle, checked: prefs.append, onChange: event => { set({ append: event.currentTarget.checked }); } })] }), _jsxs("label", { className: css.row, children: [_jsxs("span", { className: css.rowText, children: [_jsx("span", { className: css.title, children: t('interimTitle') }), _jsx("span", { className: css.desc, children: t('interimDesc') })] }), _jsx("input", { type: "checkbox", className: css.toggle, checked: prefs.showInterim, onChange: event => { set({ showInterim: event.currentTarget.checked }); } })] })] }), _jsxs("div", { className: css.group, children: [_jsx("span", { className: css.groupTitle, children: t('privacyTitle') }), _jsx("div", { className: css.row, children: _jsx("span", { className: css.rowText, children: _jsx("span", { className: css.desc, children: t('privacyDesc') }) }) })] })] }));
}
