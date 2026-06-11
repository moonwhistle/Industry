import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const categoryNameMap: Record<string, string> = {
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

type SearchPost = {
  id: number;
  title: string;
  content: string;
  category_slug: string;
  created_at: string;
  view_count: number;
  like_count: number;
  profiles: {
    nickname: string | null;
    user_code: string | null;
    public_id: string | null;
  } | null;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const keyword = (q ?? '').trim();
  const supabase = await createClient();

  const { data: posts } = keyword
    ? await supabase
        .from('posts')
        .select(
          `
          id,
          title,
          content,
          category_slug,
          created_at,
          view_count,
          like_count,
          profiles (
            nickname,
            user_code,
            public_id
          )
        `
        )
        .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] };

  const groupedPosts = ((posts ?? []) as unknown as SearchPost[]).reduce<
    Record<string, SearchPost[]>
  >((acc, post) => {
    const category = post.category_slug ?? 'etc';
    acc[category] = [...(acc[category] ?? []), post];
    return acc;
  }, {});

  const categories = Object.keys(groupedPosts);

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h1 className="mb-2 text-3xl font-bold text-blue-950">통합검색</h1>

      <p className="mb-6 text-gray-600">
        검색어: <strong>{keyword || '-'}</strong>
      </p>

      {!keyword && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          검색어를 입력해주세요.
        </div>
      )}

      {keyword && categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          검색 결과가 없습니다.
        </div>
      )}

      <div className="space-y-8">
        {categories.map((category) => (
          <section key={category}>
            <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
              <h2 className="text-xl font-bold text-blue-900">
                {categoryNameMap[category] ?? category}
              </h2>

              <Link
                href={`/board/${category}`}
                className="text-sm font-semibold text-blue-700 hover:underline"
              >
                게시판으로 이동
              </Link>
            </div>

            <div className="space-y-3">
              {groupedPosts[category].map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="block rounded-xl border border-gray-200 p-4 hover:bg-blue-50"
                >
                  <div className="mb-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <span>조회 {post.view_count}</span>
                    <span>좋아요 {post.like_count}</span>
                    <span>
                      작성자{' '}
                      {post.profiles?.nickname ??
                        post.profiles?.user_code ??
                        post.profiles?.public_id ??
                        '알 수 없음'}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900">{post.title}</h3>

                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {post.content}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
