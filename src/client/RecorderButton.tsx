import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { createWebSpeechRecognizer, isWebSpeechSupported, type SpeechRecognizer } from './webspeech.ts'
import { loadPrefs, subscribePrefs } from './prefs.ts'
import css from './RecorderButton.module.css'

/** Composer input action surface (injected by the standard kit). */
export interface VoiceInputActions {
  setDraft(text: string): void
  submit(): void
}

export type RecorderButtonProps = {
  inputActions: VoiceInputActions
  input?: { readonly draft: string }
} & PropsLocale<'voice.webspeech'>

type OverlayKind = 'recording' | 'error' | null

/** Fatal error codes: recognition cannot proceed (permission/capture/network). */
function isFatal(code: string): boolean {
  return code === 'not-allowed' || code === 'service-not-allowed'
    || code === 'audio-capture' || code === 'network' || code === 'unsupported'
}

export function RecorderButton({ inputActions, input, t }: RecorderButtonProps) {
  const prefs = useSyncExternalStore(subscribePrefs, loadPrefs)
  const [recording, setRecording] = useState(false)
  const [overlay, setOverlay] = useState<{ kind: OverlayKind; text: string }>({ kind: null, text: '' })
  const [supported] = useState(() => isWebSpeechSupported())

  // activeRef = "识别应当持续"：hold 模式=按住期间；toggle 模式=切换开启期间
  const activeRef = useRef(false)
  const fatalRef = useRef(false)
  // 跨识别会话累积（按住/切换开启期间每次短语结束都重启，文本在此累积）
  const accumulatedRef = useRef('')
  const recognizerRef = useRef<SpeechRecognizer | null>(null)
  const prefsRef = useRef(prefs); prefsRef.current = prefs
  const inputActionsRef = useRef(inputActions); inputActionsRef.current = inputActions
  const inputRef = useRef(input); inputRef.current = input
  const tRef = useRef(t); tRef.current = t

  useEffect(() => {
    const deliver = (text: string): void => {
      const trimmed = text.trim()
      if (trimmed === '') return
      const current = prefsRef.current
      if (current.autoSend) {
        inputActionsRef.current.setDraft(trimmed)
        inputActionsRef.current.submit()
        return
      }
      const existing = inputRef.current?.draft ?? ''
      if (current.append && existing.trim() !== '') {
        inputActionsRef.current.setDraft(existing + ' ' + trimmed)
      } else {
        inputActionsRef.current.setDraft(trimmed)
      }
    }

    const recognizer = createWebSpeechRecognizer(prefs.lang, {
      onStart: () => {
        setRecording(true)
        setOverlay({ kind: 'recording', text: tRef.current('listening') })
      },
      onInterim: (text) => {
        if (!prefsRef.current.showInterim) return
        const base = tRef.current('listening')
        setOverlay({ kind: 'recording', text: text !== '' ? `${base} ${text}` : base })
      },
      onResult: (text) => {
        const part = text.trim()
        if (part === '') return
        accumulatedRef.current = accumulatedRef.current === '' ? part : accumulatedRef.current + ' ' + part
      },
      onError: (error) => {
        if (error.code === 'no-speech' || error.code === 'aborted') return // 非致命：由 onEnd 重启
        if (isFatal(error.code)) {
          fatalRef.current = true
          setOverlay({ kind: 'error', text: messageOf(error.code, tRef.current) })
        }
      },
      onEnd: () => {
        if (fatalRef.current) {
          fatalRef.current = false
          setRecording(false)
          return
        }
        if (activeRef.current) {
          // 仍应持续：立即重启，继续下一段听写（跨短语累积）
          recognizer.start()
          return
        }
        // 已停止：交付累积文本
        const text = accumulatedRef.current
        accumulatedRef.current = ''
        setRecording(false)
        setOverlay({ kind: null, text: '' })
        deliver(text)
      },
    })
    recognizerRef.current = recognizer
    return () => {
      recognizer.dispose()
      recognizerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.lang])

  const startRecognition = (): void => {
    if (!supported) {
      setOverlay({ kind: 'error', text: t('unsupported') })
      return
    }
    activeRef.current = true
    fatalRef.current = false
    accumulatedRef.current = ''
    setOverlay({ kind: null, text: '' })
    recognizerRef.current?.start()
  }

  const stopRecognition = (): void => {
    activeRef.current = false
    recognizerRef.current?.stop()
  }

  // hold 模式：按住识别、松手停止
  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (prefsRef.current.mode !== 'hold') return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    if (!activeRef.current) startRecognition()
  }

  const handlePointerEnd = (): void => {
    if (prefsRef.current.mode !== 'hold') return
    if (activeRef.current) stopRecognition()
  }

  // toggle 模式：点击切换（点一下开始，再点一下停止）
  const handleClick = (): void => {
    if (prefsRef.current.mode !== 'toggle') return
    if (activeRef.current) stopRecognition()
    else startRecognition()
  }

  const title = supported
    ? (prefs.mode === 'hold' ? t('holdToTalk') : t('tapToTalk'))
    : t('unsupported')

  return (
    <div className={css.wrap}>
      {(overlay.kind !== null) && (
        <div
          className={overlay.kind === 'error' ? css.overlayError : css.overlay}
          role={overlay.kind === 'error' ? 'alert' : 'status'}
        >
          {overlay.text}
        </div>
      )}
      <button
        type="button"
        className={recording ? css.micActive : css.mic}
        aria-label={t('buttonLabel')}
        aria-pressed={recording}
        title={title}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={handleClick}
        onContextMenu={(event) => { event.preventDefault() }}
      >
        <svg className={css.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.94V22h2v-2.06A8 8 0 0 0 20 12h-2Z"
          />
        </svg>
      </button>
    </div>
  )
}

function messageOf(code: string, t: RecorderButtonProps['t']): string {
  switch (code) {
    case 'unsupported': return t('unsupported')
    case 'not-allowed':
    case 'service-not-allowed': return t('notAllowed')
    case 'network': return t('network')
    case 'no-speech': return t('noSpeech')
    case 'audio-capture': return t('audioCapture')
    default: return t('failure', { code })
  }
}
