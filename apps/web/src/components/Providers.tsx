'use client';

import type { Locale } from '@commenting/core';
import { CommentingProvider, I18nProvider } from '@commenting/core/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getQueryClient, getServices } from '@/lib/services';
import { AnnouncerProvider } from './Announcer';

/**
 * Client-side context for the whole app. The query client and services are per-tab singletons, so the
 * cache, drafts and posted comments survive switching language (which re-renders the root layout).
 */
export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <CommentingProvider services={getServices()}>
        <I18nProvider locale={locale}>
          <AnnouncerProvider>{children}</AnnouncerProvider>
        </I18nProvider>
      </CommentingProvider>
    </QueryClientProvider>
  );
}
