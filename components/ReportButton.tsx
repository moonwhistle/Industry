'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ReportReason, ReportTargetType } from '@/types';

type ReportButtonProps = {
  targetType: ReportTargetType;
  targetId: number;
  reportedUserId: string;
};

const reportReasons: ReportReason[] = [
  '욕설/비방',
  '성희롱',
  '혐오/차별',
  '허위사실',
  '개인정보 노출',
  '회사명/현장명 언급',
  '스팸/광고',
  '기타',
];

export default function ReportButton({
  targetType,
  targetId,
  reportedUserId,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('욕설/비방');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert('로그인 후 신고할 수 있습니다.');
      setLoading(false);
      return;
    }

    if (userData.user.id === reportedUserId) {
      alert('본인이 작성한 항목은 신고할 수 없습니다.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('reports').insert({
      target_type: targetType,
      target_id: targetId,
      reported_user_id: reportedUserId,
      reporter_id: userData.user.id,
      reason,
      detail: detail.trim() || null,
    });

    setLoading(false);

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        alert('이미 신고한 항목입니다.');
      } else {
        alert(error.message);
      }
      return;
    }

    alert('신고가 접수되었습니다.');
    setOpen(false);
    setDetail('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-red-600 hover:underline"
      >
        신고
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">신고하기</h3>

            <p className="mb-4 text-sm leading-6 text-gray-600">
              부적절한 게시글, 댓글, 욕설, 성희롱, 비방, 개인정보 노출,
              회사명·현장명 언급 등은 신고할 수 있습니다.
            </p>

            <select
              className="mb-3 w-full rounded-lg border border-gray-300 p-3 text-sm"
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
            >
              {reportReasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <textarea
              className="min-h-28 w-full rounded-lg border border-gray-300 p-3 text-sm"
              placeholder="신고 사유를 자세히 입력해주세요."
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
            />

            <p className="mt-2 text-xs leading-5 text-gray-500">
              허위 신고는 제재 대상이 될 수 있습니다.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                취소
              </button>

              <button
                type="button"
                onClick={handleReport}
                disabled={loading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {loading ? '접수 중...' : '신고 접수'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
