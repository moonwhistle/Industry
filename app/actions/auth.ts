'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole, Industry, ManagerType } from '@/types';
import { countries } from '@/lib/countries';

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const login_id = (formData.get('login_id') as string).trim();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nickname = (formData.get('nickname') as string).trim();
  const birth_date = formData.get('birth_date') as string;
  const nationality_code = formData.get('nationality_code') as string;
  const nationality = countries.find(
    (country) => country.code === nationality_code
  );
  const user_role = formData.get('user_role') as UserRole;
  const industry = formData.get('industry') as Industry;
  const manager_type = (formData.get('manager_type') as ManagerType) || null;
  const job_role = ((formData.get('job_role') as string) || '').trim() || null;

  if (!login_id || !email || !password || !nickname || !birth_date) {
    return { error: '아이디, 이메일, 비밀번호, 닉네임, 생년월일은 필수입니다.' };
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('login_id', login_id)
    .maybeSingle();

  if (existingProfile) {
    return { error: '이미 사용 중인 아이디입니다.' };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: '회원가입 중 문제가 발생했습니다.' };
  }

  const isOwner = nickname === '이영군';
  const userCode = `USER-${userId.slice(0, 8)}`;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    login_id,
    email,
    user_code: userCode,
    public_id: userCode,
    nickname,
    nationality: nationality?.name ?? '기타',
    birth_date,
    nationality_code,
    nationality_name: nationality?.name ?? '기타',
    user_role,
    industry,
    manager_type: user_role === '관리자' ? manager_type : null,
    job_role: user_role === '근로자' ? job_role : null,
    site_role: isOwner ? 'owner' : 'member',
    can_manage_site: isOwner,
    can_grant_admin: isOwner,
    account_status: 'active',
    is_admin: isOwner,
    is_online: false,
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
