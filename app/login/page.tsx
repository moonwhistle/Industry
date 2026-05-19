'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from '@/app/actions/auth';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ signup?: string }>;
}) {
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
        <h1 className="mb-6 text-2xl font-bold text-blue-900">로그인</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              이메일
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
              비밀번호
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="비밀번호"
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
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
