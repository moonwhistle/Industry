'use client';

import { createClient } from '@/lib/supabase/client';
import type { ReportTargetType } from '@/types';

type AdminContentActionsProps = {
  targetType: ReportTargetType;
  targetId: number;
};

export default function AdminContentActions({
  targetType,
  targetId,
}: AdminContentActionsProps) {
  const getTableName = () => {
    if (targetType === 'post') return 'posts';
    if (targetType === 'comment') return 'comments';
    if (targetType === 'answer') return 'answers';
    return 'answer_opinions';
  };

  const hideContent = async () => {
    const reason = prompt('숨김 사유를 입력해주세요.');

    if (!reason) return;

    const supabase = createClient();
    const { error } = await supabase
      .from(getTableName())
      .update({
        is_hidden: true,
        hidden_reason: reason,
      })
      .eq('id', targetId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('숨김 처리되었습니다.');
    location.reload();
  };

  const restoreContent = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from(getTableName())
      .update({
        is_hidden: false,
        hidden_reason: null,
      })
      .eq('id', targetId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('복구되었습니다.');
    location.reload();
  };

  const deleteContent = async () => {
    const confirmed = confirm('정말 삭제하시겠습니까?');

    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from(getTableName()).delete().eq('id', targetId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('삭제되었습니다.');
    location.reload();
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={hideContent}
        className="rounded bg-yellow-500 px-2 py-1 text-xs font-bold text-white"
      >
        숨김
      </button>

      <button
        type="button"
        onClick={restoreContent}
        className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white"
      >
        복구
      </button>

      <button
        type="button"
        onClick={deleteContent}
        className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white"
      >
        삭제
      </button>
    </div>
  );
}
