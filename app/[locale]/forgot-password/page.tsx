'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { requestPasswordReset } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await requestPasswordReset(new FormData(e.currentTarget));
    setLoading(false);
    if ('error' in result && result.error === 'INVALID_EMAIL') {
      setError(t('forgot.invalidEmail'));
      return;
    }
    setDone(true);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold text-blue-900">{t('forgot.title')}</h1>
        <p className="mb-6 text-sm text-gray-600">{t('forgot.subtitle')}</p>

        {done ? (
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">{t('forgot.sentTitle')}</p>
            <p className="mt-1 text-xs text-blue-700">{t('forgot.sentHint')}</p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              {t('forgot.backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('email')}
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="example@email.com"
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
              {loading ? t('forgot.sending') : t('forgot.submit')}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                {t('forgot.backToLogin')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
