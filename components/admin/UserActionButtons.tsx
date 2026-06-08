'use client';

import { createClient } from '@/lib/supabase/client';
import { appointStaff, dismissStaff } from '@/app/actions/staff';

export default function UserActionButtons({
  userId,
  canManageStaff = false,
  targetIsAdmin = false,
  targetIsSuperAdmin = false,
}: {
  userId: string;
  /** 조회자가 최고 운영진일 때만 임명/해임 버튼 노출 */
  canManageStaff?: boolean;
  targetIsAdmin?: boolean;
  targetIsSuperAdmin?: boolean;
}) {
  const suspendUser = async () => {
    const confirmed = confirm('해당 사용자를 7일 정지하시겠습니까?');

    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        account_status: 'suspended',
        suspended_until: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq('id', userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('사용자가 7일 정지되었습니다.');
    location.reload();
  };

  const banUser = async () => {
    const confirmed = confirm('해당 사용자를 영구 정지하시겠습니까?');

    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: 'banned' })
      .eq('id', userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('사용자가 영구 정지되었습니다.');
    location.reload();
  };

  const activateUser = async () => {
    const confirmed = confirm('해당 사용자를 정상 상태로 복구하시겠습니까?');

    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        account_status: 'active',
        suspended_until: null,
      })
      .eq('id', userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('사용자가 정상 상태로 복구되었습니다.');
    location.reload();
  };

  const appoint = async () => {
    if (!confirm('이 사용자를 사이트 운영진으로 임명하시겠습니까?')) return;

    const res = await appointStaff(userId);
    if (res?.error) {
      alert(res.error);
      return;
    }

    alert('운영진으로 임명되었습니다.');
    location.reload();
  };

  const dismiss = async () => {
    if (!confirm('이 사용자의 운영진 권한을 해임하시겠습니까?')) return;

    const res = await dismissStaff(userId);
    if (res?.error) {
      alert(res.error);
      return;
    }

    alert('운영진에서 해임되었습니다.');
    location.reload();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={suspendUser}
        className="rounded bg-yellow-500 px-2 py-1 text-xs font-bold text-white"
      >
        7일 정지
      </button>

      <button
        type="button"
        onClick={banUser}
        className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white"
      >
        영구정지
      </button>

      <button
        type="button"
        onClick={activateUser}
        className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white"
      >
        복구
      </button>

      {canManageStaff && !targetIsSuperAdmin && (
        targetIsAdmin ? (
          <button
            type="button"
            onClick={dismiss}
            className="rounded bg-gray-700 px-2 py-1 text-xs font-bold text-white"
          >
            운영진 해임
          </button>
        ) : (
          <button
            type="button"
            onClick={appoint}
            className="rounded bg-indigo-600 px-2 py-1 text-xs font-bold text-white"
          >
            운영진 임명
          </button>
        )
      )}
    </div>
  );
}
