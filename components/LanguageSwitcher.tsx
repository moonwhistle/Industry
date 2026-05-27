'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LABELS: Record<string, string> = {
  ko: '한',
  en: 'EN',
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();

  return (
    <div className="flex items-center gap-1 text-xs font-semibold">
      {routing.locales.map((l) => (
        <Link
          key={l}
          // @ts-expect-error: dynamic params not statically typed
          href={{ pathname, params }}
          locale={l}
          className={`rounded-md px-2 py-1 transition-colors ${
            l === locale
              ? 'bg-white text-blue-900'
              : 'border border-white/40 text-white hover:bg-white/10'
          }`}
        >
          {LABELS[l] ?? l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
