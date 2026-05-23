import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role, nickname, is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && profile?.user_role !== '관리자') {
    return (
      <div className="rounded-2xl bg-white p-8 shadow text-center">
        <p className="text-lg font-semibold text-red-600">접근 권한이 없습니다.</p>
        <p className="mt-2 text-sm text-gray-500">관리자 계정으로 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow">
      <h1 className="mb-4 text-2xl font-bold text-blue-900">관리자 메뉴</h1>
      <p className="text-gray-600">
        안녕하세요, <strong>{profile.nickname}</strong> 관리자님.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/users"
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          회원 관리
        </Link>
        <Link
          href="/admin/reports"
          className="rounded-lg border border-blue-900 px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
        >
          신고 관리
        </Link>
      </div>
    </div>
  );
}
