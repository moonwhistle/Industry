'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ReportStatus = '접수' | '검토중' | '처리완료' | '반려';

const ALLOWED_STATUSES: ReportStatus[] = ['접수', '검토중', '처리완료', '반려'];

export async function updateReportStatus(
  reportId: number,
  newStatus: ReportStatus
) {
  if (!ALLOWED_STATUSES.includes(newStatus)) {
    return { error: 'INVALID_STATUS' as const };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'UNAUTHENTICATED' as const };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, user_role')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && profile?.user_role !== '관리자') {
    return { error: 'FORBIDDEN' as const };
  }

  const { error } = await supabase
    .from('reports')
    .update({ status: newStatus })
    .eq('id', reportId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/reports', 'page');
  return { success: true as const };
}
