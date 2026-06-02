'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { signIn } from '@/app/actions/auth';

function ConfirmBanner() {
  const t = useTranslations();
  const params = useSearchParams();
  if (params.get('signup') !== 'confirm') return null;
  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
      <p className="font-semibold">{t('auth.confirmEmailSent')}</p>
      <p className="mt-1 text-xs text-blue-700">{t('auth.confirmEmailHint')}</p>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold text-blue-900">{t('auth.login')}</h1>

        <Suspense fallback={null}>
          <ConfirmBanner />
        </Suspense>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('auth.email')}
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="example@email.com"
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('auth.password')}
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder={t('auth.password')}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-900 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? t('auth.loggingIn') : t('auth.loginCta')}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-500">
          <Link
            href="/find-email"
            className="font-semibold text-gray-600 hover:text-blue-700 hover:underline"
          >
            {t('auth.findEmail.link')}
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/forgot-password"
            className="font-semibold text-gray-600 hover:text-blue-700 hover:underline"
          >
            {t('auth.forgot.link')}
          </Link>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          {t('auth.noAccount')}{' '}
          <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
            {t('auth.signup')}
          </Link>
        </p>
      </div>
    </div>
  );
}
