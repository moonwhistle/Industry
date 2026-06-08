-- Step 6 시나리오 헬퍼: 운영진 임명/해임 + 권한 컬럼 보호 트리거 검증
--
-- 실행 위치: Supabase Dashboard → SQL Editor (postgres 권한)
-- 사전 조건: supabase/appoint_staff.sql 을 먼저 1회 실행해 둔다.
--
-- ✅ 개선판: UUID 를 손으로 치환할 필요 없음.
--    아래 RESOLVE 블록의 super_key / target_key 에 "닉네임 또는 이메일" 만 넣으면
--    profiles 에서 UUID 를 자동 조회해 세션 변수(GUC)에 담는다.
--    이후 모든 STEP 은 current_setting(...)::uuid 로 그 값을 재사용한다.
--
-- 사용 방법
--   1) 아래 RESOLVE 블록의 두 값만 수정한다.
--   2) 스크립트 전체를 한 번에 실행한다(전체 선택 → Run). GUC 는 같은 세션 동안 유지된다.
--
-- 안전성: 재실행 가능. target 외 사용자에게 부수효과 없음.

-- ════════════════════════════════════════════════════════════════
-- RESOLVE: 닉네임/이메일 → UUID 자동 조회 (여기 두 값만 수정)
-- ════════════════════════════════════════════════════════════════
do $$
declare
  super_key  text := '영군';             -- ← 최고 운영진 닉네임 또는 이메일
  target_key text := 'target@test.com';  -- ← 임명 대상 닉네임 또는 이메일
  v_super  uuid;
  v_target uuid;
  n int;
begin
  -- super 해석
  select count(*) into n from profiles where nickname = super_key or email = super_key;
  if n = 0 then
    raise exception '최고운영진 키(%) 에 해당하는 계정을 찾을 수 없습니다.', super_key;
  elsif n > 1 then
    raise exception '최고운영진 키(%) 가 % 건 중복됩니다. 이메일 등 더 고유한 값을 쓰세요.', super_key, n;
  end if;
  select id into v_super from profiles where nickname = super_key or email = super_key;

  -- target 해석
  select count(*) into n from profiles where nickname = target_key or email = target_key;
  if n = 0 then
    raise exception '임명대상 키(%) 에 해당하는 계정을 찾을 수 없습니다.', target_key;
  elsif n > 1 then
    raise exception '임명대상 키(%) 가 % 건 중복됩니다. 이메일 등 더 고유한 값을 쓰세요.', target_key, n;
  end if;
  select id into v_target from profiles where nickname = target_key or email = target_key;

  if v_super = v_target then
    raise exception 'super 와 target 이 동일 계정(%) 입니다. 서로 다른 계정을 지정하세요.', v_super;
  end if;

  -- 세션 변수에 저장 (is_local=false → 같은 세션의 이후 모든 statement 에서 사용 가능)
  perform set_config('app.super_id',  v_super::text,  false);
  perform set_config('app.target_id', v_target::text, false);
  raise notice '✅ 해석 완료 → super=% / target=%', v_super, v_target;
end $$;

-- ════════════════════════════════════════════════════════════════
-- STEP 0: 사전 상태 스냅샷
-- ════════════════════════════════════════════════════════════════
select id, nickname, user_role, is_admin, is_super_admin
from profiles
where id in (current_setting('app.super_id')::uuid,
             current_setting('app.target_id')::uuid);

-- ════════════════════════════════════════════════════════════════
-- STEP 1: is_current_user_admin() 가 user_role='관리자' 를 더이상
--         운영진으로 인정하지 않는지 (정의만) 확인
--   기대: 함수 본문에 "user_role" 문자열이 없어야 함 → has_hole = false
-- ════════════════════════════════════════════════════════════════
select
  proname,
  pg_get_functiondef(oid) ilike '%user_role%' as has_hole,
  case when pg_get_functiondef(oid) ilike '%user_role%'
       then '❌ FAIL (아직 user_role 의존)'
       else '✅ PASS (is_admin 단독 판별)'
  end as result
from pg_proc
where proname = 'is_current_user_admin';

-- ════════════════════════════════════════════════════════════════
-- STEP 2: 권한 컬럼 보호 트리거 — 웹 역할(authenticated)은 차단되는지
--   authenticated 역할로 가장해 target 의 is_admin 을 직접 켜본다.
--   기대: raise exception 으로 실패해야 함.
-- ════════════════════════════════════════════════════════════════
do $$
begin
  set local role authenticated;
  begin
    update profiles set is_admin = true where id = current_setting('app.target_id')::uuid;
    raise notice '❌ FAIL: authenticated 가 is_admin 을 변경함 (트리거 미작동)';
  exception when others then
    raise notice '✅ PASS: authenticated 차단됨 → %', sqlerrm;
  end;
  reset role;
end $$;

-- 차단되었으므로 target 은 여전히 일반 회원이어야 함
select id, nickname, is_admin
from profiles where id = current_setting('app.target_id')::uuid;

-- ════════════════════════════════════════════════════════════════
-- STEP 3: service_role(서버 액션 경로)은 허용되는지
--   서버 액션 appointStaff 가 내부적으로 하는 update 를 흉내낸다.
--   기대: 성공 → target.is_admin = true
-- ════════════════════════════════════════════════════════════════
do $$
begin
  set local role service_role;
  update profiles set is_admin = true where id = current_setting('app.target_id')::uuid;
  reset role;
end $$;

select
  id, nickname, is_admin,
  case when is_admin then '✅ PASS (service_role 임명 성공)'
       else '❌ FAIL' end as result
from profiles where id = current_setting('app.target_id')::uuid;

-- ════════════════════════════════════════════════════════════════
-- STEP 4: 최고 운영진은 권한 컬럼도 service_role 외엔 못 바꾸는지(자가 승격 차단)
--   authenticated 가 본인(super) is_super_admin 을 끄거나 켜려는 시도
-- ════════════════════════════════════════════════════════════════
do $$
begin
  set local role authenticated;
  begin
    update profiles set is_super_admin = false where id = current_setting('app.super_id')::uuid;
    raise notice '❌ FAIL: authenticated 가 is_super_admin 변경함';
  exception when others then
    raise notice '✅ PASS: 자가 권한변경 차단됨 → %', sqlerrm;
  end;
  reset role;
end $$;

-- ════════════════════════════════════════════════════════════════
-- 정리 (테스트 후 환원)
-- ════════════════════════════════════════════════════════════════
-- do $$ begin
--   set local role service_role;
--   update profiles set is_admin = false where id = current_setting('app.target_id')::uuid;
--   reset role;
-- end $$;
