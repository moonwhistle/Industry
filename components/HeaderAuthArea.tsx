'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { signOut } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';

export default function HeaderAuthArea() {
  const t = useTranslations('auth');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isLoggedIn === null) {
    return <div className="h-9 w-48" aria-hidden />;
  }

  if (!isLoggedIn) {
    return (
      <nav className="flex items-center gap-2 text-sm font-semibold">
        <Link
          href="/login"
          className="rounded-lg bg-white/95 px-3 py-1.5 text-blue-900 transition-colors hover:bg-white"
        >
          {t('login')}
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-white/70 px-3 py-1.5 text-white transition-colors hover:bg-white/10"
        >
          {t('signup')}
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2 text-sm font-semibold">
      <Link
        href="/mypage"
        className="rounded-lg bg-white/95 px-3 py-1.5 text-blue-900 transition-colors hover:bg-white"
      >
        {t('mypage')}
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border border-white/70 px-3 py-1.5 text-white transition-colors hover:bg-white/10"
        >
          {t('logout')}
        </button>
      </form>
    </nav>
  );
}
