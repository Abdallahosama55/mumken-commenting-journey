import { LOCALES, colors, tokensToCss } from '@commenting/core';
import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { ReviewerTools } from '@/components/ReviewerTools';
import { SiteHeader } from '@/components/SiteHeader';
import { getServerI18n } from '@/lib/server-i18n';
import '../globals.css';

// Cairo, as in the design, for both scripts. Self-hosted at build time by next/font (variable font, metric-
// matched fallback): no layout shift and no third-party request at runtime.
const cairo = Cairo({ subsets: ['latin', 'arabic'], variable: '--font-cairo', display: 'swap' });

const tokenStyles = tokensToCss();

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return {
    // Absolute base for canonical and hreflang URLs (search engines require absolute alternates).
    metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
    title: { default: `${t('records.title')} · ${t('app.name')}`, template: `%s · ${t('app.name')}` },
    description: t('records.subtitle'),
  };
}

export const viewport: Viewport = {
  themeColor: colors.ink,
  width: 'device-width',
  initialScale: 1,
};

/** The `[locale]` segment is the root layout, so `<html lang dir>` is correct from the first byte (I-2). */
export default async function RootLayout({ children }: LayoutProps<'/[locale]'>) {
  const i18n = await getServerI18n();
  return (
    <html lang={i18n.locale} dir={i18n.dir} className={cairo.variable}>
      <head>
        <style>{tokenStyles}</style>
      </head>
      <body>
        <a href="#main" className="skip-link">
          {i18n.t('a11y.skipToContent')}
        </a>
        <Providers locale={i18n.locale}>
          <SiteHeader i18n={i18n} />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <ReviewerTools />
        </Providers>
      </body>
    </html>
  );
}
