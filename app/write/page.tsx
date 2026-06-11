'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPost } from '@/app/actions/posts';
import CommunityPolicyNotice from '@/components/CommunityPolicyNotice';
import MultiFileDropUpload, { type UploadedFile } from '@/components/MultiFileDropUpload';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  { slug: 'notice', name: '공지사항' },
  { slug: 'free', name: '자유게시판' },
  { slug: 'resources', name: '안전보건 자료실' },
  { slug: 'law', name: '법령/규정' },
  { slug: 'news', name: '산업안전 뉴스' },
  { slug: 'accident', name: '사고사례 공유' },
  { slug: 'education', name: '교육자료' },
  { slug: 'checklist', name: '안전점검 체크리스트' },
  { slug: 'photos', name: '현장사진' },
  { slug: 'qna', name: 'Q&A' },
];

function WriteForm() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') ?? 'free');
  const [newsGroup, setNewsGroup] = useState('전체');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [canHideAuthor, setCanHideAuthor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: userData }) => {
      if (!userData.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('site_role, can_manage_site, is_admin')
        .eq('id', userData.user.id)
        .single();

      if (!active) return;

      setCanHideAuthor(
        Boolean(
          profile?.site_role === 'owner' ||
            profile?.site_role === 'staff' ||
            profile?.can_manage_site ||
            profile?.is_admin
        )
      );
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    fd.set('category_slug', category);
    fd.set('news_group', newsGroup);
    fd.set('attachments', JSON.stringify(attachments));

    const result = await createPost(fd);
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold text-blue-900">글쓰기</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <CommunityPolicyNotice />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            게시판
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {category === 'news' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              뉴스 분류
            </label>
            <select
              value={newsGroup}
              onChange={(e) => setNewsGroup(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="전체">전체</option>
              <option value="건설업">건설업</option>
              <option value="제조업">제조업</option>
              <option value="조선·운송업">조선·운송업</option>
              <option value="기타">기타</option>
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            제목
          </label>
          <input
            name="title"
            required
            placeholder="제목을 입력하세요"
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            내용
          </label>
          <textarea
            name="content"
            required
            rows={12}
            placeholder="내용을 입력하세요"
            className="w-full resize-y rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <MultiFileDropUpload onUploaded={setAttachments} />

        <input
          type="hidden"
          name="attachments"
          value={JSON.stringify(attachments)}
          readOnly
        />

        {canHideAuthor && (
          <label className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <input name="is_author_hidden" type="checkbox" />
            운영진 글 작성 시 작성자를 운영진으로 표시
          </label>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? '등록 중...' : '등록하기'}
          </button>
          <button
            type="button"
            onClick={() => history.back()}
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">불러오는 중...</div>}>
      <WriteForm />
    </Suspense>
  );
}
