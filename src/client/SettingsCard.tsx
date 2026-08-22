import { useState, useSyncExternalStore } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { loadPrefs, subscribePrefs, updatePrefs, type VoiceWebspeechPrefs } from './prefs.ts'
import { detectBrowserSpeech } from './detect.ts'
import { downloadLocalModel, isLocalModelReady } from './local.ts'
import { LOCAL_MODELS, localModelSpec, type LocalModelId } from './models.ts'
import css from './SettingsCard.module.css'

export type SettingsCardProps = PropsLocale<'voice.webspeech'>

const LANG_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
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
]

export function SettingsCard({ t }: SettingsCardProps) {
  const [open, setOpen] = useState(false)
  const prefs = useSyncExternalStore(subscribePrefs, loadPrefs)
  const [info] = useState(() => detectBrowserSpeech())
  const [downloading, setDownloading] = useState<{ model: LocalModelId; percent: number } | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [readyTick, setReadyTick] = useState(0)
  const set = (patch: Partial<VoiceWebspeechPrefs>): void => { updatePrefs(patch) }

  const modelReady = isLocalModelReady(prefs.localModel)

  const handleDownload = async (id: LocalModelId): Promise<void> => {
    setDownloading({ model: id, percent: 0 })
    setDownloadError(null)
    try {
      await downloadLocalModel(id, (p) => { setDownloading({ model: id, percent: p.percent }) })
      setDownloading(null)
      setReadyTick(v => v + 1)
    } catch (error) {
      setDownloading(null)
      setDownloadError(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <div className={open ? css.card + ' ' + css.cardOpen : css.card}>
      <button type="button" className={css.header} aria-expanded={open} onClick={() => { setOpen(!open) }}>
        <span className={css.headText}>
          <span className={css.name}>{t('settingsTitle')}</span>
          <span className={css.description}>{t('settingsDesc')}</span>
        </span>
        <svg className={open ? css.chevron + ' ' + css.chevronOpen : css.chevron} viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
          <path d="M3.5 5.5 7 9l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className={css.body}>
          <div className={css.field}>
            <label className={css.label} htmlFor="voice-webspeech-mode">{t('modeTitle')}</label>
            <select id="voice-webspeech-mode" className={css.select} value={prefs.mode} onChange={event => { set({ mode: event.currentTarget.value === 'hold' ? 'hold' : 'toggle' }) }}>
              <option value="toggle">{t('modeToggle')}</option>
              <option value="hold">{t('modeHold')}</option>
            </select>
          </div>

          <div className={css.field}>
            <label className={css.label} htmlFor="voice-webspeech-lang">{t('langTitle')}</label>
            <select id="voice-webspeech-lang" className={css.select} value={prefs.lang} onChange={event => { set({ lang: event.currentTarget.value }) }}>
              {LANG_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className={css.field}>
            <label className={css.label} htmlFor="voice-webspeech-backend">{t('backendTitle')}</label>
            <select id="voice-webspeech-backend" className={css.select} value={prefs.backend} onChange={event => { set({ backend: event.currentTarget.value === 'local' ? 'local' : 'webspeech' }) }}>
              <option value="webspeech">{t('backendWebSpeech')}</option>
              <option value="local">{t('backendLocal')}</option>
            </select>
          </div>

          {prefs.backend === 'local' && (
            <div className={css.field}>
              <label className={css.label} htmlFor="voice-webspeech-model">{t('modelTitle')}</label>
              <select id="voice-webspeech-model" className={css.select} value={prefs.localModel} onChange={event => { set({ localModel: event.currentTarget.value as LocalModelId }) }}>
                {LOCAL_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}（{m.sizeHint}）</option>
                ))}
              </select>
              <p className={css.hint}>{localModelSpec(prefs.localModel).note}</p>
            </div>
          )}

          {prefs.backend === 'local' && (
            <div className={css.field}>
              <span className={css.label}>{t('downloadModel')}</span>
              {modelReady ? (
                <p className={css.hint}>{t('modelReady')}</p>
              ) : (
                <>
                  <button type="button" className={css.button} disabled={downloading !== null} onClick={() => { void handleDownload(prefs.localModel) }}>
                    {downloading !== null ? t('downloading', { percent: downloading.percent }) : t('downloadModel')}
                  </button>
                  {downloading !== null && <p className={css.hint}>{t('downloading', { percent: downloading.percent })}</p>}
                </>
              )}
              {downloadError !== null && <p className={css.hint}>{t('downloadFailed', { error: downloadError })}</p>}
            </div>
          )}

          <label className={css.toggleRow}>
            <span className={css.toggleText}>
              <span className={css.label}>{t('autoSendTitle')}</span>
              <span className={css.hint}>{t('autoSendDesc')}</span>
            </span>
            <input type="checkbox" className={css.toggle} checked={prefs.autoSend} onChange={event => { set({ autoSend: event.currentTarget.checked }) }} />
          </label>

          <label className={css.toggleRow}>
            <span className={css.toggleText}>
              <span className={css.label}>{t('appendTitle')}</span>
              <span className={css.hint}>{t('appendDesc')}</span>
            </span>
            <input type="checkbox" className={css.toggle} checked={prefs.append} onChange={event => { set({ append: event.currentTarget.checked }) }} />
          </label>

          <label className={css.toggleRow}>
            <span className={css.toggleText}>
              <span className={css.label}>{t('interimTitle')}</span>
              <span className={css.hint}>{t('interimDesc')}</span>
            </span>
            <input type="checkbox" className={css.toggle} checked={prefs.showInterim} onChange={event => { set({ showInterim: event.currentTarget.checked }) }} />
          </label>

          <div className={css.field}>
            <span className={css.label}>{t('browserGroupTitle')}</span>
            <p className={css.hint}>{info.supported ? t('browserSupported') : t('browserUnsupported')}</p>
            {info.supported && <p className={css.hint}>{t('browserBackend', { backend: info.backend })}</p>}
          </div>

          <div className={css.field}>
            <span className={css.label}>{t('privacyTitle')}</span>
            <p className={css.hint}>{t('privacyDesc')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
