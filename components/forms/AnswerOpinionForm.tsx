'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AnswerOpinionType } from '@/types';

const opinionTypes: AnswerOpinionType[] = [
  '추가의견',
  '이의제기',
  '근거보완',
  '오류수정요청',
];

export default function AnswerOpinionForm({ answerId }: { answerId: number }) {
  const [opinionType, setOpinionType] =
    useState<AnswerOpinionType>('추가의견');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert('로그인 후 의견을 작성할 수 있습니다.');
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

    if (!content.trim()) {
      alert('의견 내용을 입력해주세요.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('answer_opinions').insert({
      answer_id: answerId,
      author_id: userData.user.id,
      opinion_type: opinionType,
      content: content.trim(),
      source: source.trim() || null,
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
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h4 className="mb-2 text-sm font-bold text-gray-700">
        이 답변에 의견 추가
      </h4>

      <select
        className="mb-2 w-full rounded-lg border border-gray-300 p-2 text-sm"
        value={opinionType}
        onChange={(event) =>
          setOpinionType(event.target.value as AnswerOpinionType)
        }
      >
        {opinionTypes.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <textarea
        className="min-h-24 w-full rounded-lg border border-gray-300 p-3 text-sm"
        placeholder="답변에 대한 이의제기, 추가근거, 보완의견을 작성해주세요."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />

      <input
        className="mt-2 w-full rounded-lg border border-gray-300 p-2 text-sm"
        placeholder="근거 또는 출처가 있다면 입력해주세요."
        value={source}
        onChange={(event) => setSource(event.target.value)}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="mt-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? '등록 중...' : '의견 등록'}
      </button>
    </div>
  );
}
