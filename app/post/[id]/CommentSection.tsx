'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CommentWithAuthor } from '@/types';

export default function CommentSection({
  postId,
  comments,
}: {
  postId: number;
  comments: CommentWithAuthor[];
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
            <p className="text-sm font-semibold text-blue-900">
              {comment.profiles?.nickname ?? comment.profiles?.email ?? '알 수 없음'}
            </p>
            <p className="mt-1.5 text-sm text-gray-700">{comment.content}</p>
            <p className="mt-1.5 text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleString('ko-KR')}
            </p>
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
