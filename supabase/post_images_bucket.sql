-- ============================================================
-- post_images_bucket.sql
-- Step 8: 게시글 이미지 드래그앤드롭 업로드용 Storage 버킷
--
-- 정책 (사용자 결정)
--   - public 버킷 (게시판은 anon 도 읽으므로 이미지도 공개 URL 로 <img> 표시)
--   - 이미지 타입만, 최대 5MB → 버킷 레벨에서 강제(클라 검증 우회해도 차단)
--   - 업로드는 로그인 사용자만, 본인 uid 폴더(post-images/{auth.uid}/...)에만 허용
--
-- idempotent: 여러 번 실행해도 안전.
-- 실행 위치: Supabase Dashboard → SQL Editor (postgres 권한)
-- ============================================================

-- 1) 버킷 생성/갱신
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) storage.objects RLS 정책 (create policy 는 idempotent 아님 → drop 선행)

-- 2-1) 공개 읽기
drop policy if exists "post-images public read" on storage.objects;
create policy "post-images public read"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- 2-2) 업로드: 로그인 사용자, 본인 uid 폴더에만
--   경로 규칙: post-images/{auth.uid()}/{uuid}.{ext}
--   → 첫 폴더 세그먼트가 본인 uid 여야 함.
drop policy if exists "post-images authenticated insert" on storage.objects;
create policy "post-images authenticated insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2-3) 본인 파일 수정 (정리/교체용)
drop policy if exists "post-images owner update" on storage.objects;
create policy "post-images owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2-4) 본인 파일 삭제
drop policy if exists "post-images owner delete" on storage.objects;
create policy "post-images owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) 결과 확인용
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'post-images';

select policyname, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'post-images%'
order by policyname;
