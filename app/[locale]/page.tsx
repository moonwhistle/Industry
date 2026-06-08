import { getLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import SiteIntro from '@/components/SiteIntro';
import StatsCard from '@/components/StatsCard';
import PopularBanner from '@/components/PopularBanner';
import BoardPreviewCard from '@/components/BoardPreviewCard';
import DashboardPreview from '@/components/DashboardPreview';

export const revalidate = 60;

type PreviewPost = { id: number; title: string; created_at: string };
type PopularPost = { id: number; title: string; like_count: number };

// 게시판별 최신글 미리보기 대상 (Step 13)
const PREVIEW_BOARDS = [
  { slug: 'free', navKey: 'free' },
  { slug: 'resources', navKey: 'resources' },
  { slug: 'news', navKey: 'news' },
  { slug: 'accident', navKey: 'accident' },
] as const;

export default async function HomePage() {
  const supabase = await createClient();
  const t = await getTranslations('home');
  const tNav = await getTranslations('nav');
  const locale = await getLocale();

  // 최근 1개월 인기글 기준 시각 (Step 14)
  // 서버 컴포넌트라 요청 시점 기준 now() 사용이 의도된 동작 (revalidate=60 으로 캐시).
  // eslint-disable-next-line react-hooks/purity
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const previewQuery = (slug: string) =>
    supabase
      .from('posts')
      .select('id, title, created_at')
      .eq('category_slug', slug)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(5);

  const [
    { count: memberCount },
    { count: postCount },
    { count: commentCount },
    { data: popularPosts },
    { data: freePosts },
    { data: resourcePosts },
    { data: newsPosts },
    { data: accidentPosts },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase
      .from('posts')
      .select('id, title, like_count')
      .eq('is_hidden', false)
      .gte('created_at', oneMonthAgo)
      .order('like_count', { ascending: false })
      .limit(5),
    previewQuery('free'),
    previewQuery('resources'),
    previewQuery('news'),
    previewQuery('accident'),
  ]);

  const dateLocale = locale === 'ko' ? 'ko-KR' : 'en-US';

  const previewMap: Record<string, PreviewPost[]> = {
    free: (freePosts ?? []) as PreviewPost[],
    resources: (resourcePosts ?? []) as PreviewPost[],
    news: (newsPosts ?? []) as PreviewPost[],
    accident: (accidentPosts ?? []) as PreviewPost[],
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SiteIntro />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <StatsCard title={t('statsMembers')} value={memberCount ?? 0} icon="👷" />
          <StatsCard title={t('statsPosts')} value={postCount ?? 0} icon="📋" />
          <StatsCard title={t('statsComments')} value={commentCount ?? 0} icon="💬" />
        </div>
      </section>

      <PopularBanner
        title={t('popularTitle')}
        emptyLabel={t('popularEmpty')}
        posts={(popularPosts ?? []) as PopularPost[]}
      />

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {PREVIEW_BOARDS.map((board) => (
          <BoardPreviewCard
            key={board.slug}
            title={tNav(board.navKey)}
            href={`/board/${board.slug}`}
            seeAllLabel={t('recentSeeAll')}
            emptyLabel={t('previewEmpty')}
            posts={previewMap[board.slug]}
            dateLocale={dateLocale}
          />
        ))}
      </section>

      <DashboardPreview />
    </div>
  );
}
