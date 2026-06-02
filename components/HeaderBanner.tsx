import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import HeaderAuthArea from './HeaderAuthArea';
import LanguageSwitcher from './LanguageSwitcher';
import SearchBar from './SearchBar';

export default async function HeaderBanner() {
  const t = await getTranslations('header');

  return (
    <header className="relative h-64 bg-gradient-to-r from-blue-950 via-blue-800 to-blue-700 bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-6 text-white">
        <div className="flex items-center justify-end gap-2 pt-4">
          <LanguageSwitcher />
          <HeaderAuthArea />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <Link
            href="/"
            aria-label={t('title')}
            className="group inline-block self-start rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white"
          >
            <p className="mb-2 text-base font-medium tracking-wide opacity-90">
              {t('tagline')}
            </p>
            <h1 className="mb-5 text-4xl font-bold tracking-tight group-hover:underline">
              {t('title')}
            </h1>
          </Link>
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
