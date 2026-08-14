import { useSyncExternalStore } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { loadPrefs, subscribePrefs, updatePrefs, type VoiceWebspeechPrefs } from './prefs.ts'
import css from './SettingsPanel.module.css'

export type SettingsPanelProps = PropsLocale<'voice.webspeech'>

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

export function SettingsPanel({ t }: SettingsPanelProps) {
  const prefs = useSyncExternalStore(subscribePrefs, loadPrefs)
  const set = (patch: Partial<VoiceWebspeechPrefs>): void => { updatePrefs(patch) }

  return (
    <div className={css.section}>
      <div className={css.group}>
        <span className={css.groupTitle}>{t('inputGroupTitle')}</span>

        <div className={css.row}>
          <span className={css.rowText}>
            <span className={css.title}>{t('langTitle')}</span>
          </span>
          <select
            className={css.select}
            value={prefs.lang}
            onChange={event => { set({ lang: event.currentTarget.value }) }}
          >
            {LANG_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <label className={css.row}>
          <span className={css.rowText}>
            <span className={css.title}>{t('autoSendTitle')}</span>
            <span className={css.desc}>{t('autoSendDesc')}</span>
          </span>
          <input
            type="checkbox"
            className={css.toggle}
            checked={prefs.autoSend}
            onChange={event => { set({ autoSend: event.currentTarget.checked }) }}
          />
        </label>

        <label className={css.row}>
          <span className={css.rowText}>
            <span className={css.title}>{t('appendTitle')}</span>
            <span className={css.desc}>{t('appendDesc')}</span>
          </span>
          <input
            type="checkbox"
            className={css.toggle}
            checked={prefs.append}
            onChange={event => { set({ append: event.currentTarget.checked }) }}
          />
        </label>

        <label className={css.row}>
          <span className={css.rowText}>
            <span className={css.title}>{t('interimTitle')}</span>
            <span className={css.desc}>{t('interimDesc')}</span>
          </span>
          <input
            type="checkbox"
            className={css.toggle}
            checked={prefs.showInterim}
            onChange={event => { set({ showInterim: event.currentTarget.checked }) }}
          />
        </label>
      </div>

      <div className={css.group}>
        <span className={css.groupTitle}>{t('privacyTitle')}</span>
        <div className={css.row}>
          <span className={css.rowText}>
            <span className={css.desc}>{t('privacyDesc')}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
