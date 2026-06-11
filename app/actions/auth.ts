'use server';

import { headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole, Industry, ManagerType } from '@/types';
import { countries } from '@/lib/countries';

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const locale = await getLocale();

  const login_id = (formData.get('login_id') as string).trim();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nickname = (formData.get('nickname') as string).trim();
  const birth_date = formData.get('birth_date') as string;
  const nationality_code = formData.get('nationality_code') as string;
  const nationality = countries.find(
    (country) => country.code === nationality_code
  );
  const user_role = formData.get('user_role') as UserRole;
  const industry = formData.get('industry') as Industry;
  const manager_type = (formData.get('manager_type') as ManagerType) || null;
  const job_role = ((formData.get('job_role') as string) || '').trim() || null;

  if (!login_id || !email || !password || !nickname || !birth_date) {
    return { error: '아이디, 이메일, 비밀번호, 닉네임, 생년월일은 필수입니다.' };
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('login_id', login_id)
    .maybeSingle();

  if (existingProfile) {
    return { error: '이미 사용 중인 아이디입니다.' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        login_id,
        nickname,
        birth_date,
        nationality: nationality?.name ?? '기타',
        nationality_code,
        nationality_name: nationality?.name ?? '기타',
        user_role,
        industry,
        manager_type: user_role === '관리자' ? manager_type : null,
        job_role: user_role === '근로자' ? job_role : null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect({ href: '/login?signup=confirm', locale });
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const locale = await getLocale();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect({ href: '/', locale });
}

export async function signOut() {
  const supabase = await createClient();
  const locale = await getLocale();
  await supabase.auth.signOut();
  redirect({ href: '/', locale });
}

// ============================================================
// 비밀번호 재설정 / 이메일(아이디) 찾기
// 보안 원칙:
//   - 응답 형식을 입력 일치 여부와 무관하게 통일해 계정 열거(account
//     enumeration) 공격을 차단한다.
//   - service_role 키는 server action 내부에서만 사용되며 클라이언트에
//     절대 노출되지 않는다.
//   - rate limit 은 in-memory 토큰 버킷으로 봇/스크립트 자동화를 완화
//     (서버리스/멀티 인스턴스 환경에서는 완벽치 않으므로, 운영 환경에서는
//     Supabase 자체 rate limit 와 함께 사용한다).
// ============================================================

const RESET_REDIRECT_PATH = '/reset-password';

function inferSiteOrigin(forwardedHost: string | null, forwardedProto: string | null, host: string | null) {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (explicit) return explicit;
  const proto = forwardedProto ?? 'http';
  const finalHost = forwardedHost ?? host ?? 'localhost:3000';
  return `${proto}://${finalHost}`;
}

export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase();
  const locale = await getLocale();
  const hdrs = await headers();
  const origin = inferSiteOrigin(
    hdrs.get('x-forwarded-host'),
    hdrs.get('x-forwarded-proto'),
    hdrs.get('host')
  );

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // 입력 형식 자체가 잘못된 경우만 가시적 에러 (열거 위험 없음)
    return { error: 'INVALID_EMAIL' as const };
  }

  if (!checkResetRate(email)) {
    return { ok: true as const }; // rate limit 도 동일 응답으로 마스킹
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/${locale}${RESET_REDIRECT_PATH}`,
  });
  // 성공/실패 무관 동일 응답 — 등록되지 않은 이메일도 동일하게 반환
  return { ok: true as const };
}

export async function updatePassword(formData: FormData) {
  const password = (formData.get('password') as string) ?? '';
  if (password.length < 6) {
    return { error: 'PASSWORD_TOO_SHORT' as const };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }
  return { ok: true as const };
}

export async function findEmailByProfile(formData: FormData) {
  const nickname = ((formData.get('nickname') as string) ?? '').trim();
  const nationality = ((formData.get('nationality') as string) ?? '').trim();
  const industry = (formData.get('industry') as Industry) ?? null;

  if (!nickname || !nationality || !industry) {
    return { error: 'MISSING_FIELDS' as const };
  }
  if (!['건설업', '제조업', '기타'].includes(industry)) {
    return { error: 'INVALID_INDUSTRY' as const };
  }
  if (!checkFindRate(nickname)) {
    return { error: 'RATE_LIMITED' as const };
  }

  // service_role 로 RLS 우회 — Profile 의 email 컬럼에 직접 접근.
  // 클라이언트로는 마스킹된 값만 돌려준다.
  const admin = createAdminClient();
  const { data: matches } = await admin
    .from('profiles')
    .select('email')
    .eq('nickname', nickname)
    .eq('nationality', nationality)
    .eq('industry', industry);

  if (!matches || matches.length !== 1 || !matches[0].email) {
    // 0건/2건 이상 모두 동일 응답으로 마스킹
    return { ok: true as const, masked: null };
  }

  return { ok: true as const, masked: maskEmail(matches[0].email) };
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return null;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(4, local.length - 2))}@${domain}`;
}

// --- in-memory rate limiter ---
type Bucket = { count: number; resetAt: number };
const resetBuckets = new Map<string, Bucket>();
const findBuckets = new Map<string, Bucket>();
const RESET_WINDOW_MS = 10 * 60 * 1000;
const RESET_MAX = 5;
const FIND_WINDOW_MS = 10 * 60 * 1000;
const FIND_MAX = 5;

function bumpBucket(map: Map<string, Bucket>, key: string, windowMs: number, max: number) {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || entry.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

function checkResetRate(email: string) {
  return bumpBucket(resetBuckets, `reset:${email}`, RESET_WINDOW_MS, RESET_MAX);
}

function checkFindRate(nickname: string) {
  return bumpBucket(findBuckets, `find:${nickname}`, FIND_WINDOW_MS, FIND_MAX);
}
