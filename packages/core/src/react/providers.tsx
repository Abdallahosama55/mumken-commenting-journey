import { createContext, use, useMemo, type ReactNode } from 'react';
import type { DraftStore } from '../data/draft-store';
import type { NetworkSimulator } from '../data/network-simulator';
import type { CommentingRepository } from '../data/repository';
import type { Locale } from '../domain/types';
import { createI18n, type I18n } from '../i18n';

export interface CommentingServices {
  readonly repository: CommentingRepository;
  readonly drafts: DraftStore;
  /** Present when the repository is simulated; drives the Reviewer tools (D-3). */
  readonly network?: NetworkSimulator;
}

const CommentingContext = createContext<CommentingServices | null>(null);
const I18nContext = createContext<I18n | null>(null);

/** Dependency injection for the data layer: tests and apps pass their own instances. */
export function CommentingProvider({ services, children }: { services: CommentingServices; children: ReactNode }) {
  return <CommentingContext value={services}>{children}</CommentingContext>;
}

export function useCommenting(): CommentingServices {
  const services = use(CommentingContext);
  if (!services) throw new Error('useCommenting must be used inside <CommentingProvider>');
  return services;
}

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const i18n = useMemo(() => createI18n(locale), [locale]);
  return <I18nContext value={i18n}>{children}</I18nContext>;
}

export function useI18n(): I18n {
  const i18n = use(I18nContext);
  if (!i18n) throw new Error('useI18n must be used inside <I18nProvider>');
  return i18n;
}
