import { getBundledDataset } from '@commenting/core';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RecordArticle } from '@/components/RecordArticle';
import { Discussion } from '@/components/discussion/Discussion';
import { getServerI18n } from '@/lib/server-i18n';

type Props = PageProps<'/[locale]/records/[recordId]'>;

const findRecord = (recordId: string) => getBundledDataset().records.find((record) => record.id === recordId);

/** Every known record is prerendered; unknown ids render on request and resolve to S-2 (not found). */
export function generateStaticParams() {
  return getBundledDataset().records.map((record) => ({ recordId: record.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ recordId }, i18n] = await Promise.all([params, getServerI18n()]);
  const record = findRecord(recordId);
  if (!record) return { title: i18n.t('state.unavailable.title') };
  return { title: record.title[i18n.locale], description: record.summary[i18n.locale] };
}

export default function RecordPage({ params }: Props) {
  // Params are awaited inside the boundary so even unlisted ids get an instant static shell.
  return (
    <div className="page">
      <Suspense fallback={null}>
        <RecordView params={params} />
      </Suspense>
    </div>
  );
}

async function RecordView({ params }: Pick<Props, 'params'>) {
  const [{ recordId }, i18n] = await Promise.all([params, getServerI18n()]);
  const record = findRecord(recordId);
  if (!record) notFound();

  return (
    <>
      <Breadcrumbs i18n={i18n} current={record.title[i18n.locale]} />
      <RecordArticle record={record} i18n={i18n} />
      <Discussion recordId={record.id} />
    </>
  );
}
