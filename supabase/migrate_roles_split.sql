-- ============================================================
-- migrate_roles_split.sql
-- 권한 모델 재정의: 산업안전보건법상 '관리자'(user_role)와
-- 사이트 '운영진'(is_admin) 분리.
--
-- Critical 보안 fix:
--   기존 handle_new_user 트리거가 user_role='관리자' 선택만으로
--   is_admin=true 를 부여하여 누구나 회원가입 폼에서 관리자 권한을
--   획득할 수 있었음. 본 마이그레이션이 그 자동 부여를 차단하고
--   기존에 잘못 부여된 is_admin 도 모두 해제함.
--
-- idempotent: 여러 번 실행해도 안전.
-- ============================================================

-- 1) 최고 운영진 컬럼 추가
alter table profiles
  add column if not exists is_super_admin boolean not null default false;

-- 2) 기존에 자동 부여된 운영진 권한 전부 해제
update profiles
   set is_admin = false,
       is_super_admin = false;

-- 3) 닉네임 '영군' 을 최고 운영진(=운영진 + 슈퍼관리자) 으로 지정
--    동일 닉네임이 여럿이면 가장 먼저 가입한 1명만 승격 (보안적 보수성).
with target as (
  select id
  from profiles
  where nickname = '영군'
  order by created_at asc
  limit 1
)
update profiles p
   set is_admin = true,
       is_super_admin = true
  from target
 where p.id = target.id;

-- 4) 결과 확인용 (dashboard SQL Editor 에서 실행 시 가시화)
select id, nickname, user_role, is_admin, is_super_admin, created_at
  from profiles
 where is_admin = true or is_super_admin = true
 order by created_at asc;
