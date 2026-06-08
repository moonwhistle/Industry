-- Step 7 시나리오 헬퍼: 운영진 글 작성자 숨김(hide_author) 트리거 검증
--
-- 실행 위치: Supabase Dashboard → SQL Editor (postgres 권한)
-- 사전 조건: supabase/hide_author.sql 을 먼저 1회 실행해 둔다.
--
-- 검증 목표
--   1) 운영진(is_admin=true) 작성 글  → hide_author 가 true 로 강제된다.
--   2) 일반 회원(is_admin=false) 작성 글 → hide_author 가 false 로 강제된다.
--   3) 클라이언트가 보낸 hide_author 값(위조)은 무시되고 트리거가 재도출한다.
--
-- 사용 방법
--   1) 아래 RESOLVE 블록의 admin_key / normal_key 에 "닉네임 또는 이메일" 입력.
--   2) 스크립트 전체를 한 번에 실행(전체 선택 → Run). GUC 는 같은 세션 동안 유지된다.
--
-- 안전성: 테스트 글은 '[step7-test]' 접두 title 로 삽입 후 마지막 STEP 에서 전부 삭제.

-- ════════════════════════════════════════════════════════════════
-- RESOLVE: 닉네임/이메일 → UUID 자동 조회 (여기 두 값만 수정)
-- ════════════════════════════════════════════════════════════════
do $$
declare
  admin_key  text := '영군';             -- ← 운영진(is_admin=true) 닉네임 또는 이메일
  normal_key text := 'target@test.com';  -- ← 일반 회원(is_admin=false) 닉네임 또는 이메일
  v_admin  uuid;
  v_normal uuid;
  n int;
  b boolean;
begin
  -- admin 해석 + is_admin 확인
  select count(*) into n from profiles where nickname = admin_key or email = admin_key;
  if n = 0 then raise exception '운영진 키(%) 계정을 찾을 수 없습니다.', admin_key;
  elsif n > 1 then raise exception '운영진 키(%) 가 % 건 중복됩니다. 이메일을 쓰세요.', admin_key, n;
  end if;
  select id, is_admin into v_admin, b from profiles where nickname = admin_key or email = admin_key;
  if not coalesce(b, false) then
    raise exception '키(%) 는 운영진(is_admin=true)이 아닙니다. is_admin 계정을 지정하세요.', admin_key;
  end if;

  -- normal 해석 + is_admin=false 확인
  select count(*) into n from profiles where nickname = normal_key or email = normal_key;
  if n = 0 then raise exception '일반회원 키(%) 계정을 찾을 수 없습니다.', normal_key;
  elsif n > 1 then raise exception '일반회원 키(%) 가 % 건 중복됩니다. 이메일을 쓰세요.', normal_key, n;
  end if;
  select id, is_admin into v_normal, b from profiles where nickname = normal_key or email = normal_key;
  if coalesce(b, false) then
    raise exception '키(%) 는 운영진입니다. 일반 회원(is_admin=false)을 지정하세요.', normal_key;
  end if;

  perform set_config('app.admin_id',  v_admin::text,  false);
  perform set_config('app.normal_id', v_normal::text, false);
  raise notice '✅ 해석 완료 → admin=% / normal=%', v_admin, v_normal;
end $$;

-- ════════════════════════════════════════════════════════════════
-- STEP 1: 운영진 글 — 일부러 hide_author=false 로 넣어도 true 로 강제되는지
--   기대: hide_author = true
-- ════════════════════════════════════════════════════════════════
insert into posts (title, content, category_slug, author_id, hide_author)
values ('[step7-test] admin 작성', '본문', 'free',
        current_setting('app.admin_id')::uuid, false)
returning
  id,
  hide_author,
  case when hide_author then '✅ PASS (운영진 글 자동 숨김)'
       else '❌ FAIL (숨김 안 됨)' end as result;

-- ════════════════════════════════════════════════════════════════
-- STEP 2: 일반 회원 글 — 일부러 hide_author=true 로 위조해도 false 로 강제되는지
--   기대: hide_author = false (위조 무시)
-- ════════════════════════════════════════════════════════════════
insert into posts (title, content, category_slug, author_id, hide_author)
values ('[step7-test] normal 위조시도', '본문', 'free',
        current_setting('app.normal_id')::uuid, true)
returning
  id,
  hide_author,
  case when hide_author = false then '✅ PASS (위조 무시 — 일반 회원 노출)'
       else '❌ FAIL (위조 hide_author 가 통과됨)' end as result;

-- ════════════════════════════════════════════════════════════════
-- STEP 3: 삽입된 테스트 글 확인
-- ════════════════════════════════════════════════════════════════
select id, title, author_id, hide_author
from posts
where title like '[step7-test]%'
order by id;

-- ════════════════════════════════════════════════════════════════
-- 정리: 테스트 글 삭제 (검증 끝나면 실행)
-- ════════════════════════════════════════════════════════════════
delete from posts where title like '[step7-test]%';
