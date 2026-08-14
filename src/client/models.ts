/**
 * Local (in-browser WASM) ASR model registry. Models download from the
 * HuggingFace Hub on first use (free, no key) and cache in the browser.
 */

export type LocalModelId = 'whisper-tiny' | 'whisper-base' | 'moonshine-tiny'

export interface LocalModelSpec {
  id: LocalModelId
  /** HuggingFace repo id. */
  repo: string
  label: string
  sizeHint: string
  note: string
  /** Whether the model accepts a Whisper-style language hint. */
  whisperLanguage: boolean
}

export const LOCAL_MODELS: readonly LocalModelSpec[] = [
  { id: 'whisper-tiny', repo: 'onnx-community/whisper-tiny', label: 'Whisper Tiny（多语言）', sizeHint: '~40MB', note: '中文可用，轻量', whisperLanguage: true },
  { id: 'whisper-base', repo: 'onnx-community/whisper-base', label: 'Whisper Base（多语言）', sizeHint: '~74MB', note: '中文更准', whisperLanguage: true },
  { id: 'moonshine-tiny', repo: 'onnx-community/moonshine-tiny-ONNX', label: 'Moonshine Tiny（英文）', sizeHint: '~27MB', note: '仅英文，极轻量', whisperLanguage: false },
]

export function localModelSpec(id: LocalModelId): LocalModelSpec {
  return LOCAL_MODELS.find(m => m.id === id) ?? LOCAL_MODELS[0]!
}

/** Map a BCP-47 lang to a Whisper language code (undefined = auto-detect). */
export function langToWhisper(lang: string): string | undefined {
  if (lang.startsWith('zh')) return 'chinese'
  if (lang.startsWith('en')) return 'english'
  if (lang.startsWith('ja')) return 'japanese'
  if (lang.startsWith('ko')) return 'korean'
  if (lang.startsWith('fr')) return 'french'
  if (lang.startsWith('de')) return 'german'
  if (lang.startsWith('es')) return 'spanish'
  if (lang.startsWith('ru')) return 'russian'
  return undefined
}
