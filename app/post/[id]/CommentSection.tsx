'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CommentWithAuthor } from '@/types';
import AdminContentActions from '@/components/admin/AdminContentActions';
import ReportButton from '@/components/ReportButton';

export default function CommentSection({
  postId,
  comments,
  isAdmin = false,
}: {
  postId: number;
  comments: CommentWithAuthor[];
  isAdmin?: boolean;
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status')
      .eq('id', userData.user.id)
      .single();

    if (profile?.account_status === 'suspended') {
      alert('신고 누적으로 인해 사용이 정지된 계정입니다.');
      setLoading(false);
      return;
    }

    if (profile?.account_status === 'banned') {
      alert('영구 정지된 계정입니다.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: userData.user.id,
      content: content.trim(),
    });

    if (error) {
      alert(error.message);
    } else {
      setContent('');
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <section className="mt-10 border-t border-gray-200 pt-6">
      <h2 className="mb-4 text-lg font-bold text-gray-900">
        댓글 {comments.length > 0 && <span className="text-blue-700">{comments.length}</span>}
      </h2>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl bg-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-blue-900">
                  {comment.profiles?.nickname ??
                    comment.profiles?.public_id ??
                    comment.profiles?.email ??
                    '알 수 없음'}
                </p>
                <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-600">
                  {comment.profiles?.user_role ?? '사용자'}
                </span>
                {comment.is_hidden && (
                  <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                    숨김
                  </span>
                )}
              </div>

              {comment.author_id && (
                <ReportButton
                  targetType="comment"
                  targetId={comment.id}
                  reportedUserId={comment.author_id}
                />
              )}
            </div>

            {comment.is_hidden ? (
              <p className="mt-1.5 text-sm text-gray-400">
                관리자에 의해 숨김 처리된 댓글입니다.
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-gray-700">{comment.content}</p>
            )}
            <p className="mt-1.5 text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleString('ko-KR')}
            </p>
            {isAdmin && (
              <AdminContentActions targetType="comment" targetId={comment.id} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요"
          rows={3}
          className="flex-1 resize-none rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="self-end rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? '등록 중...' : '등록'}
        </button>
      </form>
    </section>
  );
}
