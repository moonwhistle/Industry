-- Step 8 시나리오 헬퍼: post-images 버킷 설정 + RLS 정책 검증
--
-- 실행 위치: Supabase Dashboard → SQL Editor (postgres 권한)
-- 사전 조건: supabase/post_images_bucket.sql 을 먼저 1회 실행해 둔다.
--
-- 검증 목표
--   1) 버킷이 public + 5MB + 이미지 타입 제한으로 설정됐는지.
--   2) storage.objects 에 정책 4개(read/insert/update/delete)가 존재하는지.
--   (실제 업로드 권한은 브라우저에서 로그인/타계정 폴더 업로드로 수동 확인 — 하단 안내)

-- ════════════════════════════════════════════════════════════════
-- STEP 1: 버킷 설정 확인
--   기대: public=true, file_size_limit=5242880, mime 에 image/* 4종
-- ════════════════════════════════════════════════════════════════
select
  id,
  public,
  file_size_limit,
  allowed_mime_types,
  case
    when public
     and file_size_limit = 5242880
     and allowed_mime_types @> array['image/jpeg','image/png','image/webp','image/gif']
    then '✅ PASS (public + 5MB + 이미지 타입)'
    else '❌ FAIL (설정 불일치)'
  end as result
from storage.buckets
where id = 'post-images';

-- ════════════════════════════════════════════════════════════════
-- STEP 2: RLS 정책 4종 존재 확인
--   기대: select / insert / update / delete 4개
-- ════════════════════════════════════════════════════════════════
select
  count(*) as policy_count,
  case when count(*) = 4 then '✅ PASS (정책 4종 존재)'
       else '❌ FAIL (정책 누락)' end as result
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'post-images%';

select policyname, cmd, roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'post-images%'
order by policyname;

-- ════════════════════════════════════════════════════════════════
-- 수동 검증 (브라우저, RLS 는 auth.uid() 의존이라 SQL 로 흉내내기 어려움)
--   A. 로그인 후 글쓰기 → 본인 폴더 업로드 성공해야 함.
--   B. (개발자도구) 다른 uid 폴더 경로로 upload 시도 → insert 정책 위반으로 실패해야 함.
--   C. 6MB 이미지 또는 .pdf 업로드 시도 → 버킷 제한으로 실패해야 함.
-- ════════════════════════════════════════════════════════════════
