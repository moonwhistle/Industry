'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AnswerForm({ postId }: { postId: number }) {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert('로그인 후 답변을 작성할 수 있습니다.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status, user_role')
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

    if (!content.trim()) {
      alert('답변 내용을 입력해주세요.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('answers').insert({
      post_id: postId,
      author_id: userData.user.id,
      content: content.trim(),
      source: source.trim() || null,
      is_admin_answer: profile?.user_role === '관리자',
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setContent('');
    setSource('');
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <h3 className="mb-3 text-lg font-bold text-gray-900">답변 작성</h3>

      <textarea
        className="min-h-32 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
        placeholder="답변 내용을 작성해주세요. 가능한 경우 법령, KOSHA Guide, 현장 경험 등 근거를 함께 작성해주세요."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />

      <input
        className="mt-3 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
        placeholder="근거 또는 출처 예: 산업안전보건법, KOSHA Guide, 현장 경험 등"
        value={source}
        onChange={(event) => setSource(event.target.value)}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="mt-3 rounded-lg bg-blue-900 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? '등록 중...' : '답변 등록'}
      </button>
    </div>
  );
}
