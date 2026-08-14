/**
 * Browser speech-capability diagnostics (runs in the user's browser).
 * Detects which SpeechRecognition constructor is exposed and reports the
 * likely backend so the settings card can surface what will actually happen.
 */

export type SpeechConstructorName = 'standard' | 'webkit' | 'none'

export interface BrowserSpeechInfo {
  supported: boolean
  constructorName: SpeechConstructorName
  backend: string
  userAgent: string
}

export function detectBrowserSpeech(): BrowserSpeechInfo {
  const win = typeof window !== 'undefined' ? window : undefined
  const standard = win?.SpeechRecognition
  const webkit = win?.webkitSpeechRecognition
  const ctor = standard ?? webkit
  const ua = win?.navigator?.userAgent ?? ''
  let backend = 'unknown'
  if (ctor !== undefined) {
    if (/Edg\//.test(ua)) backend = 'Microsoft Azure (Edge)'
    else if (/Chrome\//.test(ua)) backend = 'Google (Chrome/Chromium)'
    else backend = 'Web Speech (unknown)'
  } else {
    backend = 'none'
  }
  return {
    supported: ctor !== undefined,
    constructorName: standard !== undefined ? 'standard' : (webkit !== undefined ? 'webkit' : 'none'),
    backend,
    userAgent: ua,
  }
}
