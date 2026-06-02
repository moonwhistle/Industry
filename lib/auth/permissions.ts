import { createClient } from '@/lib/supabase/server';

export type StaffProfile = {
  id: string;
  nickname: string;
  is_admin: boolean;
  is_super_admin: boolean;
};

/**
 * 현재 세션이 사이트 운영진(is_admin=true)인지 확인하고 프로필을 돌려줌.
 * 비로그인/일반 회원/조회 실패는 모두 null.
 * 산업안전보건법상의 'user_role=관리자' 는 운영진이 아니라 일반 회원이며,
 * 운영진 권한은 is_admin 컬럼으로만 판단한다.
 */
export async function getStaffProfile(): Promise<StaffProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nickname, is_admin, is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_admin) return null;
  return profile as StaffProfile;
}
