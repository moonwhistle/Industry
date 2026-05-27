'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { signUp } from '@/app/actions/auth';
import CommunityPolicyNotice from '@/components/CommunityPolicyNotice';
import type { ManagerType } from '@/types';

const MANAGER_TYPES: ManagerType[] = [
  '안전관리자',
  '보건관리자',
  '현장소장',
  '관리감독자',
  '안전보건총괄책임자',
  '안전보건관리책임자',
];

export default function SignupPage() {
  const t = useTranslations();
  const [userRole, setUserRole] = useState('근로자');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signUp(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold text-blue-900">{t('auth.signup')}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CommunityPolicyNotice />

          <Field label={t('auth.email')}>
            <input
              name="email"
              type="email"
              required
              placeholder="example@email.com"
              className={inputClass}
            />
          </Field>

          <Field label={t('auth.passwordHint')}>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder={t('auth.password')}
              className={inputClass}
            />
          </Field>

          <Field label={t('auth.nickname')}>
            <input
              name="nickname"
              required
              placeholder={t('auth.nicknamePlaceholder')}
              className={inputClass}
            />
          </Field>

          <Field label={t('auth.nationality')}>
            <input
              name="nationality"
              placeholder={t('auth.nationalityPlaceholder')}
              className={inputClass}
            />
          </Field>

          <Field label={t('auth.age')}>
            <input
              name="age"
              type="number"
              min={15}
              max={80}
              placeholder={t('auth.age')}
              className={inputClass}
            />
          </Field>

          <Field label={t('auth.role')}>
            <select
              name="user_role"
              required
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className={inputClass}
            >
              <option value="근로자">{t('auth.roleWorker')}</option>
              <option value="관리자">{t('auth.roleManager')}</option>
            </select>
          </Field>

          <Field label={t('auth.industry')}>
            <select name="industry" required className={inputClass}>
              <option value="건설업">{t('auth.industryConstruction')}</option>
              <option value="제조업">{t('auth.industryManufacturing')}</option>
              <option value="기타">{t('auth.industryEtc')}</option>
            </select>
          </Field>

          {userRole === '관리자' && (
            <Field label={t('auth.managerType')}>
              <select name="manager_type" required className={inputClass}>
                <option value="">{t('auth.managerTypeSelect')}</option>
                {MANAGER_TYPES.map((mt) => (
                  <option key={mt} value={mt}>{mt}</option>
                ))}
              </select>
            </Field>
          )}

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
            {loading ? t('auth.signingUp') : t('auth.signupCta')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {t('auth.hasAccount')}{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}
