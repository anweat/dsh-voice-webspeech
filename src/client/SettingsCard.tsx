import { useState, useSyncExternalStore } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { loadPrefs, subscribePrefs, updatePrefs, type VoiceWebspeechPrefs } from './prefs.ts'
import { detectBrowserSpeech } from './detect.ts'
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
  const set = (patch: Partial<VoiceWebspeechPrefs>): void => { updatePrefs(patch) }

  return (
    <li className={open ? css.card + ' ' + css.cardOpen : css.card}>
      <button
        type="button"
        className={css.header}
        aria-expanded={open}
        onClick={() => { setOpen(!open) }}
      >
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
            <select
              id="voice-webspeech-mode"
              className={css.select}
              value={prefs.mode}
              onChange={event => { set({ mode: event.currentTarget.value === 'hold' ? 'hold' : 'toggle' }) }}
            >
              <option value="toggle">{t('modeToggle')}</option>
              <option value="hold">{t('modeHold')}</option>
            </select>
          </div>

          <div className={css.field}>
            <label className={css.label} htmlFor="voice-webspeech-lang">{t('langTitle')}</label>
            <select
              id="voice-webspeech-lang"
              className={css.select}
              value={prefs.lang}
              onChange={event => { set({ lang: event.currentTarget.value }) }}
            >
              {LANG_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <label className={css.toggleRow}>
            <span className={css.toggleText}>
              <span className={css.label}>{t('autoSendTitle')}</span>
              <span className={css.hint}>{t('autoSendDesc')}</span>
            </span>
            <input
              type="checkbox"
              className={css.toggle}
              checked={prefs.autoSend}
              onChange={event => { set({ autoSend: event.currentTarget.checked }) }}
            />
          </label>

          <label className={css.toggleRow}>
            <span className={css.toggleText}>
              <span className={css.label}>{t('appendTitle')}</span>
              <span className={css.hint}>{t('appendDesc')}</span>
            </span>
            <input
              type="checkbox"
              className={css.toggle}
              checked={prefs.append}
              onChange={event => { set({ append: event.currentTarget.checked }) }}
            />
          </label>

          <label className={css.toggleRow}>
            <span className={css.toggleText}>
              <span className={css.label}>{t('interimTitle')}</span>
              <span className={css.hint}>{t('interimDesc')}</span>
            </span>
            <input
              type="checkbox"
              className={css.toggle}
              checked={prefs.showInterim}
              onChange={event => { set({ showInterim: event.currentTarget.checked }) }}
            />
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
    </li>
  )
}
