'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function toggleAnswerSelection(answerId: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'UNAUTHENTICATED' as const };
  }

  const { data: answer, error: answerErr } = await supabase
    .from('answers')
    .select('id, post_id, is_selected')
    .eq('id', answerId)
    .single();

  if (answerErr || !answer) {
    return { error: 'ANSWER_NOT_FOUND' as const };
  }

  const { data: post, error: postErr } = await supabase
    .from('posts')
    .select('id, author_id, category_slug')
    .eq('id', answer.post_id)
    .single();

  if (postErr || !post) {
    return { error: 'POST_NOT_FOUND' as const };
  }

  if (post.category_slug !== 'qna') {
    return { error: 'NOT_QNA_POST' as const };
  }

  if (post.author_id !== user.id) {
    return { error: 'NOT_QUESTION_AUTHOR' as const };
  }

  const admin = createAdminClient();

  if (answer.is_selected) {
    const { error } = await admin
      .from('answers')
      .update({ is_selected: false })
      .eq('id', answerId);

    if (error) return { error: error.message };
  } else {
    const { error: clearErr } = await admin
      .from('answers')
      .update({ is_selected: false })
      .eq('post_id', answer.post_id)
      .eq('is_selected', true);

    if (clearErr) return { error: clearErr.message };

    const { error: setErr } = await admin
      .from('answers')
      .update({ is_selected: true })
      .eq('id', answerId);

    if (setErr) return { error: setErr.message };
  }

  revalidatePath(`/post/${answer.post_id}`, 'page');
  return { success: true as const };
}
