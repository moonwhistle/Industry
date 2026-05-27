'use server';

import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole, Industry, ManagerType } from '@/types';

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const locale = await getLocale();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nickname = (formData.get('nickname') as string)?.trim();
  const nationality = (formData.get('nationality') as string)?.trim();
  const ageRaw = formData.get('age') as string | null;
  const user_role = formData.get('user_role') as UserRole;
  const industry = formData.get('industry') as Industry;
  const manager_type =
    (formData.get('manager_type') as ManagerType) || null;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
        nationality: nationality || null,
        age: ageRaw && ageRaw.length > 0 ? ageRaw : null,
        user_role,
        industry,
        manager_type: user_role === '관리자' ? manager_type : null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect({ href: '/login?signup=confirm', locale });
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const locale = await getLocale();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect({ href: '/', locale });
}

export async function signOut() {
  const supabase = await createClient();
  const locale = await getLocale();
  await supabase.auth.signOut();
  redirect({ href: '/', locale });
}
