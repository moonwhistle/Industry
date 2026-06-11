import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UserActionButtons from '@/components/admin/UserActionButtons';
import { getDisplayRole } from '@/lib/getDisplayRole';
import { isSiteAdminProfile } from '@/lib/isSiteAdminProfile';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('site_role, can_manage_site, is_admin')
    .eq('id', user.id)
    .single();

  if (!isSiteAdminProfile(currentProfile)) {
    redirect('/admin');
  }

  const { data: users } = await supabase
    .from('profiles')
    .select(
      `
      id,
      user_code,
      public_id,
      nickname,
      user_role,
      industry,
      job_role,
      manager_type,
      site_role,
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
            <div className="col-span-2">유저코드</div>
            <div className="col-span-2">닉네임</div>
            <div className="col-span-1">유형</div>
            <div className="col-span-1">업종</div>
            <div className="col-span-2">직무</div>
            <div className="col-span-1">신고</div>
            <div className="col-span-1">상태</div>
            <div className="col-span-1">권한</div>
            <div className="col-span-1">가입일</div>
            <div className="col-span-2">제재</div>
          </div>

          {users?.map((profile) => (
            <div
              key={profile.id}
              className="grid grid-cols-[repeat(14,minmax(0,1fr))] border-t border-gray-100 px-4 py-3 text-sm"
            >
              <div className="col-span-2 text-gray-700">
                {profile.user_code ?? profile.public_id ?? `USER-${profile.id.slice(0, 8)}`}
              </div>
              <div className="col-span-2 font-semibold text-gray-900">
                {profile.nickname}
              </div>
              <div className="col-span-1">{profile.user_role}</div>
              <div className="col-span-1">{profile.industry}</div>
              <div className="col-span-2">{getDisplayRole(profile)}</div>
              <div className="col-span-1 font-bold text-red-600">
                {profile.report_count ?? 0}
              </div>
              <div className="col-span-1">{profile.account_status}</div>
              <div className="col-span-1">{profile.site_role}</div>
              <div className="col-span-1 text-gray-500">
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
