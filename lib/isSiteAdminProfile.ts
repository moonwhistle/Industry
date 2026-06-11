type SiteAdminProfile = {
  site_role?: string | null;
  can_manage_site?: boolean | null;
  is_admin?: boolean | null;
};

export function isSiteAdminProfile(profile: SiteAdminProfile | null | undefined) {
  return Boolean(
    profile?.site_role === 'owner' ||
      profile?.site_role === 'staff' ||
      profile?.can_manage_site ||
      profile?.is_admin
  );
}
