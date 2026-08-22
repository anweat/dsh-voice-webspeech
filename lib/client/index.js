import { RecorderButton } from "./RecorderButton.js";
import { SettingsCard } from "./SettingsCard.js";
import { en, zh } from "./locales.js";
export const name = 'dsh-voice-webspeech-client';
export const inject = ['slots', 'locale'];
export const LOCALE_NS = 'voice.webspeech';
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), 'dsh-voice-webspeech: dictionaries');
    const t = ctx.locale.bind(LOCALE_NS);
    ctx.effect(() => {
        return ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
            name: 'conversation.input.left',
            id: 'voice-webspeech-recorder',
            order: 10,
            locale: LOCALE_NS,
            inject: () => ({}),
        }, RecorderButton));
    }, 'dsh-voice-webspeech: recorder slot');
    ctx.effect(() => {
        return ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
            name: 'settings.plugins.tab',
            id: 'voice-webspeech',
            order: 20,
            label: () => t('settingsTitle'),
            locale: LOCALE_NS,
            inject: () => ({}),
        }, SettingsCard));
    }, 'dsh-voice-webspeech: settings tab');
}
