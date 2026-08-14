/**
 * Client preferences (localStorage). loadPrefs MUST return a stable reference
 * (useSyncExternalStore compares snapshots with Object.is).
 */
import type { LocalModelId } from './models.ts'

export type InteractionMode = 'toggle' | 'hold'
export type BackendId = 'webspeech' | 'local'

export interface VoiceWebspeechPrefs {
  /** BCP-47 recognition language (e.g. zh-CN, en-US). */
  lang: string
  /** Interaction: 'toggle' (tap to start/stop) or 'hold' (press-and-hold). */
  mode: InteractionMode
  /** Recognition backend: browser Web Speech (zero download) or a local WASM model. */
  backend: BackendId
  /** Which local model to use when backend === 'local'. */
  localModel: LocalModelId
  /** Auto-submit on stop; false = insert into draft for review. */
  autoSend: boolean
  /** When not auto-sending, append to the existing draft instead of replacing it. */
  append: boolean
  /** Show live interim text while listening (Web Speech backend only). */
  showInterim: boolean
}

export const DEFAULT_PREFS: VoiceWebspeechPrefs = {
  lang: 'zh-CN',
  mode: 'toggle',
  backend: 'webspeech',
  localModel: 'whisper-tiny',
  autoSend: false,
  append: true,
  showInterim: true,
}

export const PREFS_KEY = 'dsh-voice-webspeech.prefs'

function mergePrefs(raw: unknown): VoiceWebspeechPrefs {
  const input = (raw ?? {}) as Partial<VoiceWebspeechPrefs>
  return {
    lang: typeof input.lang === 'string' && input.lang !== '' ? input.lang : DEFAULT_PREFS.lang,
    mode: input.mode === 'hold' ? 'hold' : DEFAULT_PREFS.mode,
    backend: input.backend === 'local' ? 'local' : DEFAULT_PREFS.backend,
    localModel: input.localModel === 'whisper-base' || input.localModel === 'moonshine-tiny'
      ? input.localModel
      : DEFAULT_PREFS.localModel,
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
