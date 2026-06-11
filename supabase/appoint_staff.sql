-- ============================================================
-- appoint_staff.sql
-- Step 6: 운영진 임명 기능 + 권한 모델 보안 강화
--
-- 목적
--   1) is_current_user_admin() 의 권한상승 구멍 제거
--      (user_role='관리자' 는 회원가입에서 누구나 self-select 하는 값이므로
--       운영진 판별에서 제외 → is_admin 단독 판별)
--   2) is_admin / is_super_admin (권한 컬럼) 은 service_role(서버 액션)에서만
--      변경 가능하도록 BEFORE UPDATE 트리거로 강제.
--      → profiles 의 "본인 update" / "관리자 제재 update" 정책이 컬럼 제한이
--        없어 자가 승격·타인 승격이 가능했던 구멍을 정책과 무관하게 차단.
--
-- idempotent: 여러 번 실행해도 안전.
-- 선행: migrate_roles_split.sql (is_super_admin 컬럼 + 최고 운영진 지정)
-- ============================================================

-- 1) 운영진 판별 함수 재정의 (user_role 의존 제거)
create or replace function is_current_user_admin()
returns boolean as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and is_admin = true
  );
$$ language sql security definer stable;

-- 2) 권한 컬럼 보호 트리거
--    SECURITY INVOKER(기본)여야 current_user 가 호출자(role)로 평가됨.
--    anon / authenticated (브라우저로 노출되는 키)만 차단하고,
--    service_role(서버 액션) 및 postgres/supabase_admin(마이그레이션·대시보드)은 허용.
create or replace function protect_privilege_columns()
returns trigger
language plpgsql
as $$
begin
  if (new.is_admin is distinct from old.is_admin)
     or (new.is_super_admin is distinct from old.is_super_admin) then
    if current_user in ('anon', 'authenticated') then
      raise exception
        'is_admin/is_super_admin 은 서버 액션(service_role)에서만 변경할 수 있습니다.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_privilege_columns on profiles;

create trigger trg_protect_privilege_columns
  before update on profiles
  for each row execute function protect_privilege_columns();

-- 3) service_role 테이블 권한
--    appointStaff/dismissStaff 서버 액션은 service_role 키로 profiles 를
--    SELECT/UPDATE 한다. Supabase 기본 GRANT 가 누락된 환경에서는
--    이 권한이 없어 "permission denied for table profiles" 로 실패하므로 명시 부여.
--    (RLS 는 service_role(BYPASSRLS)에 적용되지 않고, 권한 컬럼 보호는 위 트리거가 담당)
grant select, update on public.profiles to service_role;

-- 4) 결과 확인용 (대시보드 SQL Editor 가시화)
select
  proname,
  case when pg_get_functiondef(oid) ilike '%user_role%'
       then '❌ 아직 user_role 의존'
       else '✅ is_admin 단독' end as admin_fn_status
from pg_proc
where proname = 'is_current_user_admin';

select tgname, tgenabled
from pg_trigger
where tgname = 'trg_protect_privilege_columns';
