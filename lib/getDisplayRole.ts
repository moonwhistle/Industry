type DisplayRoleProfile = {
  manager_type?: string | null;
  job_role?: string | null;
  user_role?: string | null;
};

export function getDisplayRole(profile: DisplayRoleProfile | null | undefined) {
  if (!profile) return '사용자';

  if (profile.manager_type) return profile.manager_type;
  if (profile.job_role) return profile.job_role;
  if (profile.user_role === '근로자') return '근로자';
  if (profile.user_role === '관리자') return '산업안전보건 관리자';

  return '사용자';
}
