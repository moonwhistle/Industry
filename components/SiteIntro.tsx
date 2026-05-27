import { getTranslations } from 'next-intl/server';

export default async function SiteIntro() {
  const t = await getTranslations('home');

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-3 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
        {t('introBadge')}
      </div>

      <h2 className="mb-4 text-2xl font-bold text-blue-950">
        {t('introHeading')}
      </h2>

      <p className="leading-8 text-gray-700">{t('introBody1')}</p>

      <p className="mt-4 leading-8 text-gray-700">{t('introBody2')}</p>
    </section>
  );
}
