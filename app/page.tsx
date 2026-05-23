import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SiteIntro from '@/components/SiteIntro';
import StatsCard from '@/components/StatsCard';
import DashboardPreview from '@/components/DashboardPreview';
import type { RecentPostItem } from '@/types';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { count: memberCount },
    { count: postCount },
    { count: commentCount },
    { data: recentPosts },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase
      .from('posts')
      .select('id, title, category_slug, created_at, profiles(nickname, email)')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  return (
    <div className="space-y-6">
      <SiteIntro />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="가입 회원 수" value={memberCount ?? 0} icon="👷" />
        <StatsCard title="전체 게시물" value={postCount ?? 0} icon="📋" />
        <StatsCard title="전체 댓글" value={commentCount ?? 0} icon="💬" />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">최근 게시글</h2>
          <Link href="/board/free" className="text-sm text-blue-600 hover:underline">
            전체 보기
          </Link>
        </div>

        {recentPosts && recentPosts.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {(recentPosts as unknown as RecentPostItem[]).map((post) => (
              <li key={post.id} className="py-3">
                <Link
                  href={`/post/${post.id}`}
                  className="flex items-center justify-between gap-4 text-sm hover:text-blue-700"
                >
                  <span className="truncate font-medium text-gray-800">
                    {post.title}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">아직 게시글이 없습니다.</p>
        )}
      </section>

      <DashboardPreview />
    </div>
  );
}
