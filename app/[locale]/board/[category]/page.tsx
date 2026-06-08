import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import PostList from '@/components/PostList';
import { NEWS_SUBCATEGORIES, isNewsSubcategory } from '@/lib/news';
import type { PostListItem, CategorySlug } from '@/types';

const categoryNameMap: Record<CategorySlug, string> = {
  notice: '공지사항',
  free: '자유게시판',
  resources: '안전보건 자료실',
  law: '법령/규정',
  news: '산업안전 뉴스',
  accident: '사고사례 공유',
  education: '교육자료',
  checklist: '안전점검 체크리스트',
  photos: '현장사진',
  qna: 'Q&A',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const name = categoryNameMap[category as CategorySlug] ?? '게시판';
  return { title: `${name} — 산업안전보건 커뮤니티` };
}

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { category } = await params;
  const { sub } = await searchParams;
  const categoryName = categoryNameMap[category as CategorySlug] ?? '통합게시판';

  // 뉴스 게시판에서만 하위 분류 필터를 적용. 유효하지 않은 sub 는 전체로 간주.
  const isNews = category === 'news';
  const activeSub = isNews && sub && isNewsSubcategory(sub) ? sub : null;

  const supabase = await createClient();

  let query = supabase
    .from('posts')
    .select(
      'id, title, created_at, view_count, like_count, hide_author, profiles(nickname, email)'
    )
    .eq('category_slug', category);

  if (activeSub) {
    query = query.eq('news_subcategory', activeSub);
  }

  const { data: posts } = await query.order('created_at', { ascending: false });

  // 운영진 작성 글은 작성자 정보를 응답에서 제거(네트워크 유출 방지). 표시는 PostList 가 '운영진' 라벨로 처리.
  const list = ((posts ?? []) as unknown as PostListItem[]).map((p) =>
    p.hide_author ? { ...p, profiles: null } : p
  );

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-900">{categoryName}</h1>
        <Link
          href={`/write?category=${category}`}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          글쓰기
        </Link>
      </div>

      {isNews && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/board/news"
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeSub === null
                ? 'bg-blue-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </Link>
          {NEWS_SUBCATEGORIES.map((s) => (
            <Link
              key={s.slug}
              href={`/board/news?sub=${s.slug}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeSub === s.slug
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      <PostList posts={list} />
    </div>
  );
}
