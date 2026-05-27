import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { PostWithAuthor, CommentWithAuthor } from '@/types';
import AdminContentActions from '@/components/admin/AdminContentActions';
import QnaAnswerSection from '@/components/QnaAnswerSection';
import ReportButton from '@/components/ReportButton';
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

  const [{ data: post }, { data: comments }, { data: userData }] = await Promise.all([
    supabase
      .from('posts')
      .select('*, profiles(nickname, email, public_id, user_role, industry)')
      .eq('id', postId)
      .single(),
    supabase
      .from('comments')
      .select('*, profiles(nickname, email, public_id, user_role)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ]);

  if (!post) notFound();

  const { data: currentProfile } = userData.user
    ? await supabase
        .from('profiles')
        .select('is_admin, user_role')
        .eq('id', userData.user.id)
        .single()
    : { data: null };

  const typedPost = post as PostWithAuthor;
  const typedComments = (comments ?? []) as CommentWithAuthor[];
  const isAdmin = Boolean(
    currentProfile?.is_admin || currentProfile?.user_role === '관리자'
  );
  const isQnaPost = typedPost.category_slug === 'qna';

  return (
    <article className="rounded-2xl bg-white p-8 shadow">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">{typedPost.title}</h1>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
          <span>
            작성자:{' '}
            <strong className="text-gray-600">
              {typedPost.profiles?.nickname ??
                typedPost.profiles?.public_id ??
                typedPost.profiles?.email ??
                '알 수 없음'}
            </strong>
          </span>
          <span>유형 {typedPost.profiles?.user_role ?? '-'}</span>
          <span>업종 {typedPost.profiles?.industry ?? '-'}</span>
          <span>
            작성일: {new Date(typedPost.created_at).toLocaleString('ko-KR')}
          </span>
          <span>조회 {typedPost.view_count}</span>
          <span>좋아요 {typedPost.like_count}</span>
          {typedPost.author_id && (
            <ReportButton
              targetType="post"
              targetId={typedPost.id}
              reportedUserId={typedPost.author_id}
            />
          )}
        </div>

        {typedPost.is_hidden && (
          <p className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            관리자에 의해 숨김 처리된 게시글입니다.
          </p>
        )}
      </div>

      {typedPost.image_url && !typedPost.is_hidden && (
        <div className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={typedPost.image_url}
            alt={typedPost.title}
            className="max-h-[500px] rounded-xl object-cover"
          />
        </div>
      )}

      {typedPost.is_hidden ? (
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-gray-400">
          숨김 처리된 게시글입니다.
        </div>
      ) : (
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-gray-700">
          {typedPost.content}
        </div>
      )}

      {typedPost.file_url && !typedPost.is_hidden && (
        <a
          href={typedPost.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-2 text-sm text-blue-700 hover:bg-gray-200"
        >
          📎 첨부파일 다운로드
        </a>
      )}

      {isAdmin && <AdminContentActions targetType="post" targetId={typedPost.id} />}

      {isQnaPost ? (
        <QnaAnswerSection
          postId={typedPost.id}
          questionAuthorId={typedPost.author_id}
        />
      ) : (
        <CommentSection
          postId={postId}
          comments={typedComments}
          isAdmin={isAdmin}
        />
      )}
    </article>
  );
}
