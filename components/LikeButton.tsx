'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LikeButton({
  postId,
  initialCount,
}: {
  postId: number;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: userData }) => {
      if (!userData.user) return;

      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (active) setLiked(Boolean(data));
    });

    return () => {
      active = false;
    };
  }, [postId]);

  const handleLike = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert('로그인 후 좋아요를 누를 수 있습니다.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc('toggle_post_like', {
      post_id_input: postId,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCount(data ?? 0);
    setLiked((value) => !value);
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={loading}
      className={`rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50 ${
        liked
          ? 'bg-red-50 text-red-600'
          : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
      }`}
    >
      {liked ? '♥ 좋아요' : '♡ 좋아요'} {count}
    </button>
  );
}
