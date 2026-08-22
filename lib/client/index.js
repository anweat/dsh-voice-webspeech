import { RecorderButton } from "./RecorderButton.js";
import { SettingsCard } from "./SettingsCard.js";
import { en, zh } from "./locales.js";
export const name = 'dsh-voice-webspeech-client';
export const inject = ['slots', 'locale'];
export const LOCALE_NS = 'voice.webspeech';
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), 'dsh-voice-webspeech: dictionaries');
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
        return ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
            name: 'settings.plugin.item',
            key: 'voice-webspeech',
            locale: LOCALE_NS,
            inject: () => ({}),
        }, SettingsCard));
    }, 'dsh-voice-webspeech: plugin config card');
}
