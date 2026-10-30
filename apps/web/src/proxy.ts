import { NextResponse, type NextRequest } from 'next/server';
import { isLocale, negotiateLocale } from '@commenting/core/i18n';
import { LOCALE_COOKIE } from '@/lib/locale-cookie';

/**
 * Adds the locale prefix to any path that lacks one (I-1): an explicit earlier choice (cookie) wins,
 * then the browser's Accept-Language, then English.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isLocale(pathname.split('/')[1])) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : negotiateLocale(request.headers.get('accept-language'));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals and files with an extension (favicon, robots.txt, …).
  matcher: ['/((?!_next/|.*\\..*).*)'],
};
