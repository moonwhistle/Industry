import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role, nickname')
    .eq('id', user.id)
    .single();

  if (profile?.user_role !== '관리자') {
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
      <p className="mt-4 text-sm text-gray-400">관리 기능은 추후 추가 예정입니다.</p>
    </div>
  );
}
