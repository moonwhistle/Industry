'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole, Industry, ManagerType } from '@/types';

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nickname = formData.get('nickname') as string;
  const nationality = formData.get('nationality') as string;
  const age = Number(formData.get('age'));
  const user_role = formData.get('user_role') as UserRole;
  const industry = formData.get('industry') as Industry;
  const manager_type = (formData.get('manager_type') as ManagerType) || null;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: '회원가입 중 문제가 발생했습니다.' };
  }

  const adminSupabase = createAdminClient();
  const { error: profileError } = await adminSupabase.from('profiles').insert({
    id: userId,
    email,
    nickname,
    nationality: nationality || null,
    age: age || null,
    user_role,
    industry,
    manager_type: user_role === '관리자' ? manager_type : null,
    public_id: `USER-${userId.slice(0, 8)}`,
    is_admin: user_role === '관리자',
  });

  if (profileError) {
    return { error: profileError.message };
  }

  redirect('/login?signup=success');
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
