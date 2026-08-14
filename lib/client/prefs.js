/**
 * Client preferences (localStorage, same pattern as other DSH web plugins).
 */
export const DEFAULT_PREFS = {
    lang: 'zh-CN',
    autoSend: false,
    append: true,
    showInterim: true,
};
export const PREFS_KEY = 'dsh-voice-webspeech.prefs';
function mergePrefs(raw) {
    const input = (raw ?? {});
    return {
        lang: typeof input.lang === 'string' && input.lang !== '' ? input.lang : DEFAULT_PREFS.lang,
        autoSend: typeof input.autoSend === 'boolean' ? input.autoSend : DEFAULT_PREFS.autoSend,
        append: typeof input.append === 'boolean' ? input.append : DEFAULT_PREFS.append,
        showInterim: typeof input.showInterim === 'boolean' ? input.showInterim : DEFAULT_PREFS.showInterim,
    };
}
function storage() {
    try {
        return typeof window !== 'undefined' ? window.localStorage : undefined;
    }
    catch {
        return undefined;
    }
}
let memoryCache = null;
export function loadPrefs() {
    const store = storage();
    if (store !== undefined) {
        try {
            const raw = store.getItem(PREFS_KEY);
            if (raw !== null)
                return mergePrefs(JSON.parse(raw));
        }
        catch {
            // fall through to cache/default
        }
    }
    return memoryCache ?? { ...DEFAULT_PREFS };
}
export function updatePrefs(patch) {
    const next = mergePrefs({ ...loadPrefs(), ...patch });
    memoryCache = next;
    const store = storage();
    if (store !== undefined) {
        try {
            store.setItem(PREFS_KEY, JSON.stringify(next));
        }
        catch {
            // storage full / private mode: keep in-memory only
        }
    }
    notifyPrefsChanged();
    return next;
}
const listeners = new Set();
export function subscribePrefs(callback) {
    listeners.add(callback);
    return () => { listeners.delete(callback); };
}
export function notifyPrefsChanged() {
    for (const listener of [...listeners])
        listener();
}
