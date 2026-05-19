import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { PostWithAuthor, CommentWithAuthor } from '@/types';
import CommentSection from './CommentSection';

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);

  if (isNaN(postId)) notFound();

  const supabase = await createClient();

  await supabase.rpc('increment_view_count', { post_id_input: postId });

  const [{ data: post }, { data: comments }] = await Promise.all([
    supabase
      .from('posts')
      .select('*, profiles(nickname, email)')
      .eq('id', postId)
      .single(),
    supabase
      .from('comments')
      .select('*, profiles(nickname, email)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
  ]);

  if (!post) notFound();

  const typedPost = post as PostWithAuthor;
  const typedComments = (comments ?? []) as CommentWithAuthor[];

  return (
    <article className="rounded-2xl bg-white p-8 shadow">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">{typedPost.title}</h1>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
          <span>
            작성자:{' '}
            <strong className="text-gray-600">
              {typedPost.profiles?.nickname ?? typedPost.profiles?.email ?? '알 수 없음'}
            </strong>
          </span>
          <span>
            작성일: {new Date(typedPost.created_at).toLocaleString('ko-KR')}
          </span>
          <span>조회 {typedPost.view_count}</span>
          <span>좋아요 {typedPost.like_count}</span>
        </div>
      </div>

      {typedPost.image_url && (
        <div className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={typedPost.image_url}
            alt={typedPost.title}
            className="max-h-[500px] rounded-xl object-cover"
          />
        </div>
      )}

      <div className="mt-6 whitespace-pre-wrap text-gray-700 leading-relaxed">
        {typedPost.content}
      </div>

      {typedPost.file_url && (
        <a
          href={typedPost.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-2 text-sm text-blue-700 hover:bg-gray-200"
        >
          📎 첨부파일 다운로드
        </a>
      )}

      <CommentSection postId={postId} comments={typedComments} />
    </article>
  );
}
