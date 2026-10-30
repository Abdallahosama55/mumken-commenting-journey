import Link from 'next/link';
import { StatePanel } from '@/components/StatePanel';
import { getServerI18n } from '@/lib/server-i18n';

export default async function NotFound() {
  const { t, locale } = await getServerI18n();
  return (
    <div className="page">
      <StatePanel
        as="h1"
        title={t('state.pageNotFound.title')}
        body={t('state.pageNotFound.body')}
        action={
          <Link href={`/${locale}`} className="button button-primary">
            {t('state.unavailable.action')}
          </Link>
        }
      />
    </div>
  );
}
