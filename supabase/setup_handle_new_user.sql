-- ============================================================
-- handle_new_user 트리거 (방어적 버전)
-- auth.users insert 시 profiles 행을 raw_user_meta_data 기반으로 자동 생성.
-- 모든 필드를 검증하고 캐스트/CHECK 실패 시 안전한 default로 대체.
-- 전체 트리거를 EXCEPTION 으로 감싸서 어떤 에러가 발생해도 auth.users insert 자체는 통과.
-- 안전: drop trigger if exists + create or replace function (재실행 OK).
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  v_user_role text;
  v_industry text;
  v_manager_type text;
  v_age int;
  v_nickname text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  -- user_role: '근로자' / '관리자' 중 하나, 아니면 '근로자' 기본
  v_user_role := nullif(meta->>'user_role', '');
  if v_user_role is null or v_user_role not in ('근로자', '관리자') then
    v_user_role := '근로자';
  end if;

  -- industry: 허용 목록 외엔 '기타' 기본
  v_industry := nullif(meta->>'industry', '');
  if v_industry is null or v_industry not in ('건설업', '제조업', '기타') then
    v_industry := '기타';
  end if;

  -- manager_type: 관리자만 사용, 허용 목록 외엔 null
  v_manager_type := nullif(meta->>'manager_type', '');
  if v_user_role <> '관리자' then
    v_manager_type := null;
  elsif v_manager_type is not null and v_manager_type not in (
    '안전관리자', '보건관리자', '현장소장', '관리감독자',
    '안전보건총괄책임자', '안전보건관리책임자'
  ) then
    v_manager_type := null;
  end if;

  -- age: 캐스트 실패 시 null
  begin
    v_age := nullif(meta->>'age', '')::int;
  exception when others then
    v_age := null;
  end;

  -- nickname: 비어있으면 email local-part 기본
  v_nickname := nullif(meta->>'nickname', '');
  if v_nickname is null then
    v_nickname := split_part(coalesce(new.email, 'user@local'), '@', 1);
  end if;

  -- 보안: is_admin 은 신규 가입 시 항상 false.
  -- 사이트 운영진 권한은 별도 마이그레이션 또는 super admin 콘솔로만 부여.
  -- (예전엔 user_role='관리자' 선택 시 자동 부여되어 권한 상승 취약점이 있었음)
  insert into profiles (
    id,
    email,
    nickname,
    nationality,
    age,
    user_role,
    industry,
    manager_type,
    public_id,
    is_admin,
    is_super_admin
  )
  values (
    new.id,
    new.email,
    v_nickname,
    nullif(meta->>'nationality', ''),
    v_age,
    v_user_role,
    v_industry,
    v_manager_type,
    'USER-' || left(new.id::text, 8),
    false,
    false
  )
  on conflict (id) do nothing;

  return new;
exception when others then
  -- 트리거 실패가 auth.users insert 까지 막지 않도록 swallow.
  -- 자세한 원인은 Postgres Logs 의 WARNING 으로 확인.
  raise warning 'handle_new_user trigger failed for user %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
