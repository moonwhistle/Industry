'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Industry, ManagerType, UserRole } from '@/types';

export interface UpdateProfileInput {
  nickname: string;
  nationality: string | null;
  age: number | null;
  industry: Industry;
  user_role: UserRole;
  manager_type: ManagerType | null;
}

export async function updateProfile(input: UpdateProfileInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  const nickname = input.nickname.trim();
  if (!nickname) {
    return { error: '닉네임을 입력해 주세요.' };
  }

  const manager_type = input.user_role === '관리자' ? input.manager_type : null;

  const { error } = await supabase
    .from('profiles')
    .update({
      nickname,
      nationality: input.nationality?.trim() || null,
      age: input.age ?? null,
      industry: input.industry,
      user_role: input.user_role,
      manager_type,
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/mypage');
  return { success: true as const };
}
