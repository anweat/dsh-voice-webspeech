/**
 * Client preferences (localStorage, same pattern as other DSH web plugins).
 * NOTE: loadPrefs MUST return a stable reference — useSyncExternalStore
 * compares snapshots with Object.is; a freshly-built object per call would
 * trigger an infinite re-render ("Maximum update depth exceeded") and crash
 * the slot entry. current is replaced only on real updates.
 */

export interface VoiceWebspeechPrefs {
  /** BCP-47 recognition language (e.g. zh-CN, en-US). */
  lang: string
  /** Auto-submit on release (hold-to-talk → send); false = insert into draft for review. */
  autoSend: boolean
  /** When not auto-sending, append to the existing draft instead of replacing it. */
  append: boolean
  /** Show live interim text in the overlay while listening. */
  showInterim: boolean
}

export const DEFAULT_PREFS: VoiceWebspeechPrefs = {
  lang: 'zh-CN',
  autoSend: false,
  append: true,
  showInterim: true,
}

export const PREFS_KEY = 'dsh-voice-webspeech.prefs'

function mergePrefs(raw: unknown): VoiceWebspeechPrefs {
  const input = (raw ?? {}) as Partial<VoiceWebspeechPrefs>
  return {
    lang: typeof input.lang === 'string' && input.lang !== '' ? input.lang : DEFAULT_PREFS.lang,
    autoSend: typeof input.autoSend === 'boolean' ? input.autoSend : DEFAULT_PREFS.autoSend,
    append: typeof input.append === 'boolean' ? input.append : DEFAULT_PREFS.append,
    showInterim: typeof input.showInterim === 'boolean' ? input.showInterim : DEFAULT_PREFS.showInterim,
  }
}

function storage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined
  } catch {
    return undefined
  }
}

// Stable snapshot: initialized once from localStorage at module load, replaced
// only by updatePrefs. loadPrefs always returns this same reference.
let current: VoiceWebspeechPrefs = (() => {
  const store = storage()
  if (store !== undefined) {
    try {
      const raw = store.getItem(PREFS_KEY)
      if (raw !== null) return mergePrefs(JSON.parse(raw) as unknown)
    } catch {
      // fall through to defaults
    }
  }
  return { ...DEFAULT_PREFS }
})()

export function loadPrefs(): VoiceWebspeechPrefs {
  return current
}

export function updatePrefs(patch: Partial<VoiceWebspeechPrefs>): VoiceWebspeechPrefs {
  const next = mergePrefs({ ...current, ...patch })
  current = next
  const store = storage()
  if (store !== undefined) {
    try {
      store.setItem(PREFS_KEY, JSON.stringify(next))
    } catch {
      // storage full / private mode: keep in-memory only
    }
  }
  notifyPrefsChanged()
  return next
}

const listeners = new Set<() => void>()

export function subscribePrefs(callback: () => void): () => void {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

export function notifyPrefsChanged(): void {
  for (const listener of [...listeners]) listener()
}
