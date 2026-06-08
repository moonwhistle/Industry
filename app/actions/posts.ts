'use server';

import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { isNewsSubcategory } from '@/lib/news';
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

  // 이미지는 post-images 버킷의 public URL 만 허용 (임의 외부 URL 주입 차단).
  const rawImageUrl = (formData.get('image_url') as string) || '';
  const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/`;
  const image_url = rawImageUrl.startsWith(allowedPrefix) ? rawImageUrl : null;

  // 뉴스 하위 분류는 news 게시판 + 유효 slug 일 때만 저장.
  const rawSub = (formData.get('news_subcategory') as string) || '';
  const news_subcategory =
    category_slug === 'news' && isNewsSubcategory(rawSub) ? rawSub : null;

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
      news_subcategory,
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect({ href: `/post/${post.id}`, locale });
}
