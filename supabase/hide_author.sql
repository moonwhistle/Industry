-- ============================================================
-- hide_author.sql
-- Step 7: 운영진 글 작성자 숨김 ("운영진" 표시)
--
-- 정책 (사용자 결정)
--   - 운영진(is_admin) 이 쓴 글은 "항상 자동" 으로 작성자가 숨겨진다(체크박스 없음).
--   - 단, 판별을 "글 볼 때의 현재 is_admin" 으로 하면 임명/해임에 따라 과거 글의
--     실명이 노출되거나 소급 숨김되는 문제가 생기므로,
--     "작성 시점의 운영진 여부" 를 posts.hide_author 에 스냅샷으로 박는다.
--   - 값은 BEFORE INSERT 트리거가 작성자의 is_admin 에서 자동 도출한다.
--     클라이언트가 보낸 hide_author 값은 무시 → anon/authenticated 의 위조("운영진 행세") 차단.
--
-- idempotent: 여러 번 실행해도 안전.
-- 선행: schema.sql (posts/profiles), appoint_staff.sql (is_admin 권한 모델)
-- ============================================================

-- 1) 컬럼 추가
alter table posts
  add column if not exists hide_author boolean not null default false;

-- 2) 작성 시점 운영진 여부를 스냅샷으로 도출하는 함수
--    security definer: profiles.is_admin 을 RLS 와 무관하게 읽기 위함.
create or replace function set_post_hide_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.hide_author := coalesce(
    (select is_admin from profiles where id = new.author_id),
    false
  );
  return new;
end;
$$;

-- 3) BEFORE INSERT 트리거 (작성 시점에만 스냅샷 → 이후 임명/해임에 흔들리지 않음)
drop trigger if exists trg_set_post_hide_author on posts;
create trigger trg_set_post_hide_author
  before insert on posts
  for each row execute function set_post_hide_author();

-- 4) 결과 확인용 (대시보드 SQL Editor 가시화)
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_name = 'posts' and column_name = 'hide_author';

select tgname, tgenabled
from pg_trigger
where tgname = 'trg_set_post_hide_author';
