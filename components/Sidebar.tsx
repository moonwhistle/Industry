'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';

const menus = [
  { name: '홈', href: '/' },
  { name: '공지사항', href: '/board/notice' },
  { name: '자유게시판', href: '/board/free' },
  { name: '안전보건 자료실', href: '/board/resources' },
  { name: '법령/규정', href: '/board/law' },
  { name: '산업안전 뉴스', href: '/board/news' },
  { name: '사고사례 공유', href: '/board/accident' },
  { name: '교육자료', href: '/board/education' },
  { name: '안전점검 체크리스트', href: '/board/checklist' },
  { name: '현장사진', href: '/board/photos' },
  { name: 'Q&A', href: '/board/qna' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <div className="sticky top-6 rounded-2xl bg-white p-4 shadow">
        <h2 className="mb-3 border-b border-gray-200 pb-3 text-base font-bold text-blue-900">
          통합게시판
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
                {menu.name}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/admin"
          className="mt-3 block rounded-lg border border-blue-900 px-3 py-2.5 text-center text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-900 hover:text-white"
        >
          관리자 메뉴
        </Link>
        <Link
          href="/admin/users"
          className="mt-2 block rounded-lg border border-gray-300 px-3 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
        >
          회원 관리
        </Link>
        <Link
          href="/admin/reports"
          className="mt-2 block rounded-lg border border-gray-300 px-3 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
        >
          신고 관리
        </Link>
        {isLoggedIn ? (
          <form action={signOut}>
            <button
              type="submit"
              className="mt-4 w-full rounded-lg border border-red-300 px-3 py-2.5 text-center text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              로그아웃
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="mt-4 block rounded-lg bg-blue-900 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            로그인
          </Link>
        )}
      </div>
    </aside>
  );
}
