'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { CategorySlug } from '@/types';

export async function createPost(formData: FormData) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
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

  redirect(`/post/${post.id}`);
}
