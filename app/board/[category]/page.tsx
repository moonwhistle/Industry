import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PostList from '@/components/PostList';
import type { PostListItem, CategorySlug, NewsGroup } from '@/types';

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

const sortOptions = [
  { label: '최신순', value: 'latest' },
  { label: '오래된순', value: 'oldest' },
  { label: '좋아요순', value: 'likes' },
  { label: '조회수순', value: 'views' },
];

const newsGroups: NewsGroup[] = ['전체', '건설업', '제조업', '조선·운송업', '기타'];

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
  searchParams: Promise<{ sort?: string; group?: string }>;
}) {
  const { category } = await params;
  const { sort, group } = await searchParams;
  const categoryName = categoryNameMap[category as CategorySlug] ?? '통합게시판';
  const selectedSort = sort ?? 'latest';
  const selectedGroup = (group ?? '전체') as NewsGroup;

  const supabase = await createClient();

  let query = supabase
    .from('posts')
    .select(
      `
      id,
      title,
      created_at,
      view_count,
      like_count,
      comment_count,
      is_author_hidden,
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
    .eq('category_slug', category)
    .eq('is_hidden', false);

  if (category === 'news' && selectedGroup !== '전체') {
    query = query.eq('news_group', selectedGroup);
  }

  if (selectedSort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else if (selectedSort === 'likes') {
    query = query.order('like_count', { ascending: false });
  } else if (selectedSort === 'views') {
    query = query.order('view_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: posts } = await query;

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

      {category === 'news' && (
        <div className="mb-4 flex flex-wrap gap-2">
          {newsGroups.map((newsGroup) => (
            <Link
              key={newsGroup}
              href={`/board/news?group=${encodeURIComponent(newsGroup)}&sort=${selectedSort}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                selectedGroup === newsGroup
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-50'
              }`}
            >
              {newsGroup}
            </Link>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {sortOptions.map((option) => (
          <Link
            key={option.value}
            href={`/board/${category}?group=${encodeURIComponent(selectedGroup)}&sort=${option.value}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              selectedSort === option.value
                ? 'bg-blue-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-50'
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <PostList posts={(posts ?? []) as unknown as PostListItem[]} />
    </div>
  );
}
