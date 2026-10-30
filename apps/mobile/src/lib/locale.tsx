import { directionOf, negotiateLocale, type Direction, type Locale } from '@commenting/core';
import { I18nProvider } from '@commenting/core/react';
import { getLocales } from 'expo-localization';
import { LocaleProvider } from 'expo-router';
import { createContext, use, useState, type ReactNode } from 'react';
import { View } from 'react-native';

interface LocaleState {
  readonly locale: Locale;
  readonly dir: Direction;
  readonly isRTL: boolean;
  readonly setLocale: (locale: Locale) => void;
}

const LocaleStateContext = createContext<LocaleState | null>(null);

/** The device's preferred languages, best supported match first (I-1). */
export function deviceLocale(): Locale {
  try {
    return negotiateLocale(getLocales().map((locale) => locale.languageTag));
  } catch {
    return 'en';
  }
}

/**
 * Language and direction for the whole app, switchable at runtime without a reload (design §4):
 * - Expo Router's `LocaleProvider` flips navigation (push animation, swipe-back edge).
 * - A root `direction` style flips Yoga layout, so `row`, `start` and `end` mirror everywhere.
 * `I18nManager` is deliberately not used (`supportsRTL: false` in app.json): forcing it needs an app
 * restart, which would lose the in-memory session, and it does not work in Expo Go.
 */
export function AppLocaleProvider({ initialLocale, children }: { initialLocale?: Locale; children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => initialLocale ?? deviceLocale());
  const dir = directionOf(locale);
  const value: LocaleState = { locale, dir, isRTL: dir === 'rtl', setLocale };

  return (
    <LocaleStateContext value={value}>
      <I18nProvider locale={locale}>
        <LocaleProvider direction={dir}>
          <View style={{ flex: 1, direction: dir }}>{children}</View>
        </LocaleProvider>
      </I18nProvider>
    </LocaleStateContext>
  );
}

export function useLocaleState(): LocaleState {
  const state = use(LocaleStateContext);
  if (!state) throw new Error('useLocaleState must be used inside <AppLocaleProvider>');
  return state;
}
