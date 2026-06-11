import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import PostList from '@/components/PostList';
import type { PostListItem } from '@/types';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations('search');
  const query = (q ?? '').trim();

  if (!query) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold text-blue-900">{t('title')}</h1>
        <p className="text-sm text-gray-500">{t('noQuery')}</p>
      </div>
    );
  }

  const supabase = await createClient();
  const pattern = `%${escapeIlike(query)}%`;

  const [titleHits, contentHits] = await Promise.all([
    supabase
      .from('posts')
      .select(
        `
        id,
        title,
        created_at,
        view_count,
        like_count,
        comment_count,
        hide_author,
        profiles (
          nickname,
          email,
          public_id,
          user_code,
          user_role,
          job_role,
          manager_type
        )
      `
      )
      .ilike('title', pattern)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('posts')
      .select(
        `
        id,
        title,
        created_at,
        view_count,
        like_count,
        comment_count,
        hide_author,
        profiles (
          nickname,
          email,
          public_id,
          user_code,
          user_role,
          job_role,
          manager_type
        )
      `
      )
      .ilike('content', pattern)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const error = titleHits.error ?? contentHits.error;
  if (error) {
    console.error('[search] supabase error:', error);
  }
  const seen = new Set<number>();
  const merged: PostListItem[] = [];
  for (const row of [...(titleHits.data ?? []), ...(contentHits.data ?? [])]) {
    const item = row as unknown as PostListItem;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    // 운영진 작성 글은 작성자 정보를 응답에서 제거(유출 방지). 표시는 '운영진' 라벨.
    merged.push(item.hide_author ? { ...item, profiles: null } : item);
  }
  merged.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const typed = merged;
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {t('queryLabel', { query })} &middot;{' '}
          <span className="text-gray-400">
            {t('resultsCount', { count: typed.length })}
          </span>
        </p>
      </div>

      {typed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">{t('empty')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('emptyHint')}</p>
          {error && isDev && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-left font-mono text-xs text-red-700">
              [dev] supabase: {error.message}
            </p>
          )}
        </div>
      ) : (
        <PostList posts={typed} />
      )}
    </div>
  );
}

function escapeIlike(input: string): string {
  return input.replace(/[\\%_,()]/g, (m) => `\\${m}`);
}
