'use server';

import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { isNewsSubcategory } from '@/lib/news';
import type { CategorySlug } from '@/types';

type UploadedFileInput = {
  url: string;
  name: string;
  type: string;
  size: number;
  path: string;
};

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
    .select('account_status, site_role, can_manage_site, is_admin')
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
  const attachmentsRaw = (formData.get('attachments') as string) || '[]';

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

  let attachments: UploadedFileInput[] = [];

  try {
    attachments = JSON.parse(attachmentsRaw) as UploadedFileInput[];
  } catch {
    return { error: '첨부파일 정보를 읽을 수 없습니다.' };
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

  if (attachments.length > 0) {
    const { error: attachmentError } = await supabase
      .from('post_attachments')
      .insert(
        attachments.map((file) => ({
          post_id: post.id,
          file_url: file.url,
          file_name: file.name,
          file_type: file.type || null,
          file_size: file.size,
          storage_path: file.path,
        }))
      );

    if (attachmentError) {
      return { error: attachmentError.message };
    }
  }

  redirect({ href: `/post/${post.id}`, locale });
}
