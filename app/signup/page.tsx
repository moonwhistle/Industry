'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signUp } from '@/app/actions/auth';
import CommunityPolicyNotice from '@/components/CommunityPolicyNotice';
import { countries } from '@/lib/countries';

const MANAGER_TYPES = [
  '안전관리자',
  '보건관리자',
  '현장소장',
  '관리감독자',
  '안전보건총괄책임자',
  '안전보건관리책임자',
  '기타 관리자',
];

export default function SignupPage() {
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
        <h1 className="mb-6 text-2xl font-bold text-blue-900">회원가입</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CommunityPolicyNotice />

          <Field label="로그인 아이디">
            <input
              name="login_id"
              required
              placeholder="로그인에 사용할 아이디"
              className={inputClass}
            />
          </Field>

          <Field label="이메일">
            <input
              name="email"
              type="email"
              required
              placeholder="example@email.com"
              className={inputClass}
            />
          </Field>

          <Field label="비밀번호 (6자 이상)">
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="비밀번호"
              className={inputClass}
            />
          </Field>

          <Field label="닉네임">
            <input
              name="nickname"
              required
              placeholder="표시될 닉네임"
              className={inputClass}
            />
          </Field>

          <Field label="생년월일">
            <input
              name="birth_date"
              type="date"
              required
              className={inputClass}
            />
          </Field>

          <Field label="국적">
            <select name="nationality_code" required defaultValue="KR" className={inputClass}>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="구분">
            <select
              name="user_role"
              required
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className={inputClass}
            >
              <option value="근로자">근로자</option>
              <option value="관리자">산업안전보건 관리자</option>
            </select>
          </Field>

          <Field label="업종">
            <select name="industry" required className={inputClass}>
              <option value="건설업">건설업</option>
              <option value="제조업">제조업</option>
              <option value="기타">기타</option>
            </select>
          </Field>

          {userRole === '관리자' && (
            <Field label="관리자 직무">
              <select name="manager_type" required className={inputClass}>
                <option value="">선택하세요</option>
                {MANAGER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          )}

          {userRole === '근로자' && (
            <Field label="작업 분야">
              <input
                name="job_role"
                placeholder="예: 형틀, 철근, 설비, 생산, 물류 등"
                className={inputClass}
              />
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
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            로그인
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
