'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { updatePassword } from '@/app/actions/auth';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Supabase 가 URL 의 token 을 받아 세션을 구성할 때까지 대기.
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setAuthed(!!session);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const password = form.get('password') as string;
    const confirm = form.get('confirm') as string;
    if (password !== confirm) {
      setError(t('reset.mismatch'));
      setLoading(false);
      return;
    }
    const result = await updatePassword(form);
    setLoading(false);
    if ('error' in result && result.error) {
      setError(
        result.error === 'PASSWORD_TOO_SHORT' ? t('reset.tooShort') : result.error
      );
      return;
    }
    setDone(true);
    setTimeout(() => router.replace('/login'), 1500);
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow">
        <p className="text-sm text-gray-500">{t('reset.loading')}</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold text-blue-900">{t('reset.title')}</h1>
        <p className="text-sm text-red-600">{t('reset.invalidLink')}</p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
        >
          {t('reset.requestAgain')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold text-blue-900">{t('reset.title')}</h1>
        <p className="mb-6 text-sm text-gray-600">{t('reset.subtitle')}</p>

        {done ? (
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            {t('reset.successRedirect')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('reset.newPassword')}
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder={t('passwordHint')}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('reset.confirmPassword')}
              </label>
              <input
                name="confirm"
                type="password"
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-900 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? t('reset.submitting') : t('reset.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
