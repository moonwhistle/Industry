import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import PostList from '@/components/PostList';
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
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categoryName = categoryNameMap[category as CategorySlug] ?? '통합게시판';

  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, created_at, view_count, like_count, profiles(nickname, email)')
    .eq('category_slug', category)
    .order('created_at', { ascending: false });

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

      <PostList posts={(posts ?? []) as unknown as PostListItem[]} />
    </div>
  );
}
