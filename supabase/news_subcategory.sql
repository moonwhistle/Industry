-- ============================================================
-- news_subcategory.sql
-- Step 9: 산업안전 뉴스 하위 분류 (건설업/제조업/조선·운송업/기타)
--
-- 정책
--   - news 게시판 글에만 해당하는 하위 분류. slug 로 저장하고 UI 에서 한글 라벨 매핑.
--   - "전체" 는 저장값이 아니라 필터 미적용 뷰.
--   - news 외 글은 null.
--
-- idempotent: 여러 번 실행해도 안전.
-- ============================================================

alter table posts
  add column if not exists news_subcategory text;

alter table posts
  drop constraint if exists posts_news_subcategory_check;

alter table posts
  add constraint posts_news_subcategory_check
  check (
    news_subcategory is null
    or news_subcategory in ('construction', 'manufacturing', 'shipping', 'etc')
  );

-- 결과 확인용
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'posts' and column_name = 'news_subcategory';

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conname = 'posts_news_subcategory_check';
