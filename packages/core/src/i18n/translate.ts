import type { Locale } from '../domain/types';
import type { en } from './messages/en';
import { pluralCategory, type PluralCategory } from './plural';

export type PluralMessage = Readonly<Partial<Record<PluralCategory, string>> & { other: string }>;
export type Message = string | PluralMessage;
export type MessageKey = keyof typeof en;
/** Every locale must define every key — a missing translation is a compile error (I-1). */
export type Messages = Readonly<Record<MessageKey, Message>>;
export type MessageParams = Readonly<Record<string, string | number>>;

export type Translate = (key: MessageKey, params?: MessageParams) => string;

const PLACEHOLDER = /\{(\w+)\}/g;

export function createTranslator(
  locale: Locale,
  messages: Messages,
  formatNumber: (value: number) => string,
): Translate {
  return (key, params) => {
    const message = messages[key];
    const template =
      typeof message === 'string'
        ? message
        : (message[pluralCategory(locale, Number(params?.count ?? 0))] ?? message.other);
    if (!params) return template;
    return template.replace(PLACEHOLDER, (match, name: string) => {
      const value = params[name];
      if (value === undefined) return match;
      return typeof value === 'number' ? formatNumber(value) : value;
    });
  };
}

/** Placeholder names in a message, across all plural forms. Used by the dictionary parity test. */
export function placeholdersOf(message: Message): string[] {
  const templates = typeof message === 'string' ? [message] : Object.values(message);
  const names = new Set<string>();
  for (const template of templates) {
    for (const match of template.matchAll(PLACEHOLDER)) names.add(match[1]!);
  }
  return [...names].sort();
}
