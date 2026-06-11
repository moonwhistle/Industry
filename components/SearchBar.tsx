'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export default function SearchBar() {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const [q, setQ] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(
      { pathname: '/search', query: { q: trimmed } },
      { locale }
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-full bg-white/95 px-2 py-1.5 shadow-md backdrop-blur-sm"
    >
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('placeholder')}
        aria-label={t('placeholder')}
        className="min-w-0 flex-1 rounded-full bg-transparent px-4 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-blue-900 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        {t('submit')}
      </button>
    </form>
  );
}
