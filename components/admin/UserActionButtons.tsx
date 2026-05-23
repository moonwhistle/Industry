'use client';

import { createClient } from '@/lib/supabase/client';

export default function UserActionButtons({ userId }: { userId: string }) {
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
    </div>
  );
}
