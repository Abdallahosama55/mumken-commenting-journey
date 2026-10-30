import Link from 'next/link';
import { StatePanel } from '@/components/StatePanel';
import { getServerI18n } from '@/lib/server-i18n';

/** S-2: an unknown or removed record — explained, with a way back. */
export default async function RecordNotFound() {
  const { t, locale } = await getServerI18n();
  return (
    <div className="page">
      <StatePanel
        as="h1"
        title={t('state.unavailable.title')}
        body={t('state.unavailable.body')}
        action={
          <Link href={`/${locale}`} className="button button-primary">
            {t('state.unavailable.action')}
          </Link>
        }
      />
    </div>
  );
}
