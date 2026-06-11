-- Step 7 시나리오 헬퍼: 신고 5회 누적 → 자동 정지 트리거 검증
--
-- 실행 위치: Supabase Dashboard → SQL Editor (postgres 권한, RLS 우회)
--
-- 사전 준비 (UI에서 미리 만들어야 할 데이터)
--   1) 회원가입으로 다음 계정을 만들어 둔다 (이메일 인증 완료 상태):
--      - victim     : 신고당할 사용자 (예: victim@test.com)
--      - reporter1~5: 서로 다른 5명 (예: r1@test.com ... r5@test.com)
--   2) victim 계정으로 Q&A 카테고리에 글 1개 + 답변 1개 작성
--      (또는 다른 사용자의 Q&A에 victim 이 답변 작성)
--   3) 그 답변의 id 를 아래 :answer_id 자리에 채워 넣는다
--
-- 사용 방법
--   아래 PARAM 섹션의 <...UUID...>, <...ID...> 를 모두 실제 값으로 치환한 뒤
--   섹션 단위로 또는 전체를 실행. STEP 3 의 검증 쿼리 결과를 확인.
--
-- 안전성
--   재실행 가능 (STEP 1 cleanup 이 이전 상태를 초기화)
--   victim 외 다른 사용자에게는 부수 효과 없음

-- ════════════════════════════════════════════════════════════════
-- PARAM (실행 전 반드시 교체)
-- ════════════════════════════════════════════════════════════════
-- 임시로 아래 with 블록의 상수를 바꿔서 쓰면 됨. UUID 는 작은따옴표 안에 넣을 것.
-- 예: '11111111-1111-1111-1111-111111111111'

-- ════════════════════════════════════════════════════════════════
-- STEP 0: 사전 상태 스냅샷 (victim profile + 기존 신고 수)
-- ════════════════════════════════════════════════════════════════
select
  p.id,
  p.nickname,
  p.account_status,
  p.suspended_until,
  p.report_count,
  (select count(*) from reports r where r.reported_user_id = p.id) as existing_reports
from profiles p
where p.id = '<VICTIM_UUID>'::uuid;

-- ════════════════════════════════════════════════════════════════
-- STEP 1: 재실행을 위한 cleanup (idempotent)
--   - 같은 5명이 같은 타겟에 남긴 기존 신고 제거
--   - victim profile 을 active / 0건 상태로 리셋
-- ════════════════════════════════════════════════════════════════
delete from reports
where target_type = 'answer'
  and target_id = <ANSWER_ID>
  and reporter_id in (
    '<REPORTER1_UUID>'::uuid,
    '<REPORTER2_UUID>'::uuid,
    '<REPORTER3_UUID>'::uuid,
    '<REPORTER4_UUID>'::uuid,
    '<REPORTER5_UUID>'::uuid
  );

update profiles
set
  account_status = 'active',
  suspended_until = null,
  report_count = 0
where id = '<VICTIM_UUID>'::uuid
  and account_status <> 'banned'; -- banned 는 영구 정지라 자동 해제 금지

-- ════════════════════════════════════════════════════════════════
-- STEP 2: reports 5건 INSERT (각각 다른 reporter, 동일 target)
--   AFTER INSERT 트리거가 row-by-row 로 발화 → 5번째 행 직후 suspended 전환
-- ════════════════════════════════════════════════════════════════
insert into reports (target_type, target_id, reported_user_id, reporter_id, reason, detail, status)
values
  ('answer', <ANSWER_ID>, '<VICTIM_UUID>'::uuid, '<REPORTER1_UUID>'::uuid, '욕설/비방',         '시나리오 테스트 1', '접수'),
  ('answer', <ANSWER_ID>, '<VICTIM_UUID>'::uuid, '<REPORTER2_UUID>'::uuid, '스팸/광고',         '시나리오 테스트 2', '접수'),
  ('answer', <ANSWER_ID>, '<VICTIM_UUID>'::uuid, '<REPORTER3_UUID>'::uuid, '회사명/현장명 언급', '시나리오 테스트 3', '접수'),
  ('answer', <ANSWER_ID>, '<VICTIM_UUID>'::uuid, '<REPORTER4_UUID>'::uuid, '허위사실',           '시나리오 테스트 4', '접수'),
  ('answer', <ANSWER_ID>, '<VICTIM_UUID>'::uuid, '<REPORTER5_UUID>'::uuid, '혐오/차별',          '시나리오 테스트 5', '접수');

-- ════════════════════════════════════════════════════════════════
-- STEP 3: 트리거 결과 검증
--
-- 기대값:
--   account_status   = 'suspended'
--   report_count     = 5
--   suspended_until  ≈ now() + interval '7 days'
--   reports_count    = 5  (status in 접수/검토중/처리완료)
-- ════════════════════════════════════════════════════════════════
select
  p.id,
  p.nickname,
  p.account_status,
  p.suspended_until,
  p.report_count,
  (select count(*) from reports r
   where r.reported_user_id = p.id
     and r.status in ('접수', '검토중', '처리완료'))
    as reports_count,
  case
    when p.account_status = 'suspended'
     and p.report_count = 5
     and p.suspended_until is not null
     and p.suspended_until > now() + interval '6 days'
     and p.suspended_until < now() + interval '8 days'
    then '✅ PASS'
    else '❌ FAIL'
  end as result
from profiles p
where p.id = '<VICTIM_UUID>'::uuid;

-- ════════════════════════════════════════════════════════════════
-- STEP 4 (옵션): 반려 처리 시 카운트 감소 확인
--   한 건을 '반려' 로 변경하면 트리거가 다시 안 도므로, 수동으로 카운트만 재계산해 확인
-- ════════════════════════════════════════════════════════════════
-- update reports set status = '반려'
-- where target_type = 'answer'
--   and target_id = <ANSWER_ID>
--   and reporter_id = '<REPORTER1_UUID>'::uuid;
--
-- select count(*) from reports
-- where reported_user_id = '<VICTIM_UUID>'::uuid
--   and status in ('접수', '검토중', '처리완료');
-- -- 기대값: 4. (단, profiles.report_count 는 자동 갱신 안 됨 — 트리거는 INSERT 시에만 발화)

-- ════════════════════════════════════════════════════════════════
-- 정리 (테스트 후 환원하려면)
-- ════════════════════════════════════════════════════════════════
-- delete from reports
-- where target_type = 'answer'
--   and target_id = <ANSWER_ID>
--   and reporter_id in (
--     '<REPORTER1_UUID>'::uuid, '<REPORTER2_UUID>'::uuid,
--     '<REPORTER3_UUID>'::uuid, '<REPORTER4_UUID>'::uuid,
--     '<REPORTER5_UUID>'::uuid
--   );
--
-- update profiles
-- set account_status = 'active', suspended_until = null, report_count = 0
-- where id = '<VICTIM_UUID>'::uuid;
