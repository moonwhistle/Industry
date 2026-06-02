import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import UserActionButtons from '@/components/admin/UserActionButtons';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/login', locale });
    return null;
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!currentProfile?.is_admin) {
    redirect({ href: '/admin', locale });
  }

  const { data: users } = await supabase
    .from('profiles')
    .select(
      `
      id,
      public_id,
      nickname,
      user_role,
      industry,
      manager_type,
      account_status,
      report_count,
      suspended_until,
      created_at
    `
    )
    .order('report_count', { ascending: false });

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h1 className="mb-6 text-3xl font-bold text-blue-950">회원 관리</h1>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] bg-gray-100 px-4 py-3 text-sm font-bold text-gray-600">
            <div className="col-span-2">공개 아이디</div>
            <div className="col-span-2">닉네임</div>
            <div className="col-span-1">유형</div>
            <div className="col-span-1">업종</div>
            <div className="col-span-2">직무</div>
            <div className="col-span-1">신고</div>
            <div className="col-span-1">상태</div>
            <div className="col-span-2">가입일</div>
            <div className="col-span-2">제재</div>
          </div>

          {users?.map((profile) => (
            <div
              key={profile.id}
              className="grid grid-cols-[repeat(14,minmax(0,1fr))] border-t border-gray-100 px-4 py-3 text-sm"
            >
              <div className="col-span-2 text-gray-700">
                {profile.public_id ?? `USER-${profile.id.slice(0, 8)}`}
              </div>
              <div className="col-span-2 font-semibold text-gray-900">
                {profile.nickname}
              </div>
              <div className="col-span-1">{profile.user_role}</div>
              <div className="col-span-1">{profile.industry}</div>
              <div className="col-span-2">{profile.manager_type ?? '-'}</div>
              <div className="col-span-1 font-bold text-red-600">
                {profile.report_count ?? 0}
              </div>
              <div className="col-span-1">{profile.account_status}</div>
              <div className="col-span-2 text-gray-500">
                {new Date(profile.created_at).toLocaleDateString('ko-KR')}
              </div>
              <div className="col-span-2">
                <UserActionButtons userId={profile.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
