-- ============================================================
-- public 스키마 테이블의 anon/authenticated 권한 보강
-- Supabase 기본 GRANT가 일부 누락된 경우 실행.
-- 안전: 권한 부여만 수행 (REVOKE 없음). 반복 실행해도 부작용 없음.
-- ============================================================

-- 익명 사용자가 읽기 가능한 테이블 (RLS가 row 단위 제한)
grant select on
  public.profiles,
  public.categories,
  public.posts,
  public.comments,
  public.likes,
  public.answers,
  public.answer_opinions
to anon;

-- 로그인 사용자
grant select on
  public.profiles,
  public.categories,
  public.posts,
  public.comments,
  public.likes,
  public.answers,
  public.answer_opinions,
  public.reports
to authenticated;

grant insert, update, delete on
  public.profiles,
  public.posts,
  public.comments,
  public.likes,
  public.answers,
  public.answer_opinions
to authenticated;

grant insert, update on
  public.reports
to authenticated;

-- bigint identity 컬럼이 사용하는 sequence 권한 (insert 시 자동 PK 생성)
grant usage, select on all sequences in schema public to authenticated;

-- 향후 만들 새 테이블/시퀀스에도 자동 적용 (Supabase 표준 패턴)
alter default privileges in schema public
  grant select on tables to anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant usage, select on sequences to authenticated;
