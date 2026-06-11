'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { CategorySlug, NewsGroup } from '@/types';

type UploadedFileInput = {
  url: string;
  name: string;
  type: string;
  size: number;
  path: string;
};

export async function createPost(formData: FormData) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect('/login');
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
  const news_group = (formData.get('news_group') as NewsGroup) || '전체';
  const is_author_hidden = formData.get('is_author_hidden') === 'on';
  const image_url = (formData.get('image_url') as string) || null;
  const attachmentsRaw = (formData.get('attachments') as string) || '[]';

  if (!title || !content) {
    return { error: '제목과 내용을 입력해주세요.' };
  }

  const canHideAuthor = Boolean(
    profile?.site_role === 'owner' ||
      profile?.site_role === 'staff' ||
      profile?.can_manage_site ||
      profile?.is_admin
  );
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
      news_group: category_slug === 'news' ? news_group : '전체',
      is_author_hidden: canHideAuthor ? is_author_hidden : false,
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

  redirect(`/post/${post.id}`);
}
