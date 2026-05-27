'use server';

import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import type { CategorySlug } from '@/types';

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const locale = await getLocale();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect({ href: '/login', locale });
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', userData.user.id)
    .single();

  if (profile?.account_status === 'suspended') {
    return { error: '신고 누적으로 인해 사용이 정지된 계정입니다.' };
  }

  if (profile?.account_status === 'banned') {
    return { error: '영구 정지된 계정입니다.' };
  }

  const title = (formData.get('title') as string).trim();
  const content = (formData.get('content') as string).trim();
  const category_slug = formData.get('category_slug') as CategorySlug;
  const image_url = (formData.get('image_url') as string) || null;

  if (!title || !content) {
    return { error: '제목과 내용을 입력해주세요.' };
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title,
      content,
      category_slug,
      author_id: userData.user.id,
      image_url,
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect({ href: `/post/${post.id}`, locale });
}
