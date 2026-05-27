'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

interface MenuItem {
  key: 'home' | 'notice' | 'free' | 'resources' | 'law' | 'news' | 'accident' | 'education' | 'checklist' | 'photos' | 'qna';
  href: string;
}

const menus: MenuItem[] = [
  { key: 'home', href: '/' },
  { key: 'notice', href: '/board/notice' },
  { key: 'free', href: '/board/free' },
  { key: 'resources', href: '/board/resources' },
  { key: 'law', href: '/board/law' },
  { key: 'news', href: '/board/news' },
  { key: 'accident', href: '/board/accident' },
  { key: 'education', href: '/board/education' },
  { key: 'checklist', href: '/board/checklist' },
  { key: 'photos', href: '/board/photos' },
  { key: 'qna', href: '/board/qna' },
];

export default function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <div className="sticky top-6 rounded-2xl bg-white p-4 shadow">
        <h2 className="mb-3 border-b border-gray-200 pb-3 text-base font-bold text-blue-900">
          {t('boardTitle')}
        </h2>

        <nav className="space-y-0.5">
          {menus.map((menu) => {
            const isActive =
              menu.href === '/'
                ? pathname === '/'
                : pathname.startsWith(menu.href);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-800'
                }`}
              >
                {t(menu.key)}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/admin"
          className="mt-3 block rounded-lg border border-blue-900 px-3 py-2.5 text-center text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-900 hover:text-white"
        >
          {t('adminMenu')}
        </Link>
        <Link
          href="/admin/users"
          className="mt-2 block rounded-lg border border-gray-300 px-3 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
        >
          {t('userManage')}
        </Link>
        <Link
          href="/admin/reports"
          className="mt-2 block rounded-lg border border-gray-300 px-3 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
        >
          {t('reportManage')}
        </Link>
      </div>
    </aside>
  );
}
