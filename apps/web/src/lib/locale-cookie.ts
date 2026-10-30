export const LOCALE_COOKIE = 'locale';

/** Remembers an explicit language choice so the next visit to `/` lands in that language. */
export function rememberLocale(locale: string) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/** `/en/records/record-001` → `/ar/records/record-001`; keeps the user on the same page (I-1). */
export function switchLocalePath(pathname: string, target: string): string {
  const [, first = '', ...rest] = pathname.split('/');
  const tail = first === 'en' || first === 'ar' ? rest : [first, ...rest].filter(Boolean);
  return ['', target, ...tail].join('/');
}
