/**
 * dsh-voice-webspeech — client half.
 *
 * Registers the mic button in the composer tool row (conversation.input.left)
 * and a settings section. The recognizer is the browser's built-in Web Speech
 * API: Edge = Microsoft Azure speech, Chrome = Google/Chrome speech.
 */
import type { Context } from './context-types.ts'
import { RecorderButton } from './RecorderButton.tsx'
import { SettingsPanel } from './SettingsPanel.tsx'
import { en, zh } from './locales.ts'

export const name = 'dsh-voice-webspeech-client'

export const inject = ['slots', 'locale']

export const LOCALE_NS = 'voice.webspeech'

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), 'dsh-voice-webspeech: dictionaries')

  const t = ctx.locale.bind(LOCALE_NS)

  ctx.effect(() => {
    return ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
      name: 'conversation.input.left',
      id: 'voice-webspeech-recorder',
      order: 10,
      locale: LOCALE_NS,
      inject: () => ({}),
    }, RecorderButton))
  }, 'dsh-voice-webspeech: recorder slot')

  ctx.effect(() => {
    return ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: 'voice-webspeech-settings',
      order: 115,
      label: () => t('settingsTitle'),
      locale: LOCALE_NS,
      inject: () => ({}),
    }, SettingsPanel))
  }, 'dsh-voice-webspeech: settings slot')
}
