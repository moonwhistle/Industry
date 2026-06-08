'use client';

import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPost } from '@/app/actions/posts';
import { createClient } from '@/lib/supabase/client';
import { NEWS_SUBCATEGORIES } from '@/lib/news';
import CommunityPolicyNotice from '@/components/CommunityPolicyNotice';

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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function WriteForm() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') ?? 'free');
  const [newsSub, setNewsSub] = useState<string>('etc');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미지 업로드 상태
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    setUploadError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('이미지 파일(JPG/PNG/WEBP/GIF)만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError('이미지 용량은 최대 5MB까지 가능합니다.');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUploadError('로그인이 필요합니다.');
        return;
      }

      const ext = file.type.split('/')[1] ?? 'png';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('post-images')
        .upload(path, file, { contentType: file.type });

      if (uploadErr) {
        setUploadError(`업로드 실패: ${uploadErr.message}`);
        return;
      }

      const { data } = supabase.storage.from('post-images').getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  };

  const removeImage = () => {
    setImageUrl(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    fd.set('category_slug', category);
    fd.set('image_url', imageUrl ?? '');
    fd.set('news_subcategory', category === 'news' ? newsSub : '');

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
              value={newsSub}
              onChange={(e) => setNewsSub(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              {NEWS_SUBCATEGORIES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
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

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            이미지 (선택, 최대 5MB)
          </label>

          {imageUrl ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="첨부 이미지 미리보기"
                className="max-h-64 rounded-lg border border-gray-200 object-contain"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white hover:bg-black/80"
              >
                제거
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-300 text-gray-400 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              {uploading ? (
                <span>업로드 중...</span>
              ) : (
                <>
                  <span className="font-medium">
                    이미지를 끌어다 놓거나 클릭해서 선택하세요
                  </span>
                  <span className="mt-1 text-xs">JPG / PNG / WEBP / GIF · 최대 5MB</span>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />

          {uploadError && (
            <p className="mt-2 text-sm text-red-600">{uploadError}</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || uploading}
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
