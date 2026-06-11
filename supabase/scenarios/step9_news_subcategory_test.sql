-- Step 9 시나리오 헬퍼: 뉴스 하위 분류(news_subcategory) 컬럼/제약 검증
--
-- 실행 위치: Supabase Dashboard → SQL Editor (postgres 권한)
-- 사전 조건: supabase/news_subcategory.sql 을 먼저 1회 실행해 둔다.
--
-- 안전성: 테스트 글은 '[step9-test]' 접두 title 로 삽입 후 마지막에 삭제.

-- ════════════════════════════════════════════════════════════════
-- STEP 1: 컬럼 + check 제약 존재 확인
-- ════════════════════════════════════════════════════════════════
select
  (select count(*) from information_schema.columns
     where table_name='posts' and column_name='news_subcategory') as col,
  (select count(*) from pg_constraint
     where conname='posts_news_subcategory_check') as chk,
  case when
    (select count(*) from information_schema.columns
       where table_name='posts' and column_name='news_subcategory') = 1
    and (select count(*) from pg_constraint
       where conname='posts_news_subcategory_check') = 1
  then '✅ PASS (컬럼+제약 존재)' else '❌ FAIL' end as result;

-- ════════════════════════════════════════════════════════════════
-- STEP 2: 유효한 slug 는 허용되는지 (author_id 없이 삽입 — author_id nullable)
--   기대: 성공
-- ════════════════════════════════════════════════════════════════
insert into posts (title, content, category_slug, news_subcategory)
values ('[step9-test] 유효값', '본문', 'news', 'construction')
returning id, news_subcategory, '✅ PASS (유효 slug 허용)' as result;

-- ════════════════════════════════════════════════════════════════
-- STEP 3: 잘못된 값은 제약으로 거부되는지
--   기대: check 제약 위반으로 ERROR (의도된 실패)
-- ════════════════════════════════════════════════════════════════
do $$
begin
  begin
    insert into posts (title, content, category_slug, news_subcategory)
    values ('[step9-test] 잘못된값', '본문', 'news', 'invalid_slug');
    raise notice '❌ FAIL: 잘못된 값이 삽입됨 (제약 미작동)';
  exception when check_violation then
    raise notice '✅ PASS: 잘못된 값 거부됨 (check 제약 작동)';
  end;
end $$;

-- ════════════════════════════════════════════════════════════════
-- 정리
-- ════════════════════════════════════════════════════════════════
delete from posts where title like '[step9-test]%';
