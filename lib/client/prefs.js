/**
 * Client preferences (localStorage, same pattern as other DSH web plugins).
 * NOTE: loadPrefs MUST return a stable reference — useSyncExternalStore
 * compares snapshots with Object.is; a freshly-built object per call would
 * trigger an infinite re-render ("Maximum update depth exceeded") and crash
 * the slot entry. current is replaced only on real updates.
 */
export const DEFAULT_PREFS = {
    lang: 'zh-CN',
    mode: 'toggle',
    autoSend: false,
    append: true,
    showInterim: true,
};
export const PREFS_KEY = 'dsh-voice-webspeech.prefs';
function mergePrefs(raw) {
    const input = (raw ?? {});
    return {
        lang: typeof input.lang === 'string' && input.lang !== '' ? input.lang : DEFAULT_PREFS.lang,
        mode: input.mode === 'hold' ? 'hold' : DEFAULT_PREFS.mode,
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
// Stable snapshot: initialized once from localStorage at module load, replaced
// only by updatePrefs. loadPrefs always returns this same reference.
let current = (() => {
    const store = storage();
    if (store !== undefined) {
        try {
            const raw = store.getItem(PREFS_KEY);
            if (raw !== null)
                return mergePrefs(JSON.parse(raw));
        }
        catch {
            // fall through to defaults
        }
    }
    return { ...DEFAULT_PREFS };
})();
export function loadPrefs() {
    return current;
}
export function updatePrefs(patch) {
    const next = mergePrefs({ ...current, ...patch });
    current = next;
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
