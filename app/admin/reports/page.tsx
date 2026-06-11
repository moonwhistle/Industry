import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSiteAdminProfile } from '@/lib/isSiteAdminProfile';

type ReportProfile = {
  public_id: string | null;
  user_code?: string | null;
  nickname: string | null;
  user_role?: string | null;
  industry?: string | null;
  job_role?: string | null;
  manager_type?: string | null;
  site_role?: string | null;
  account_status?: string | null;
  report_count?: number | null;
};

type AdminReport = {
  id: number;
  target_type: string;
  target_id: number;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
  reported_user: ReportProfile | null;
  reporter: ReportProfile | null;
};

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('site_role, can_manage_site, is_admin')
    .eq('id', user.id)
    .single();

  if (!isSiteAdminProfile(currentProfile)) {
    redirect('/admin');
  }

  const { data: reports } = await supabase
    .from('reports')
    .select(
      `
      id,
      target_type,
      target_id,
      reason,
      detail,
      status,
      created_at,
      reported_user:profiles!reports_reported_user_id_fkey (
        public_id,
        user_code,
        nickname,
        user_role,
        industry,
        job_role,
        manager_type,
        site_role,
        account_status,
        report_count
      ),
      reporter:profiles!reports_reporter_id_fkey (
        public_id,
        user_code,
        nickname
      )
    `
    )
    .order('created_at', { ascending: false });

  const typedReports = (reports ?? []) as unknown as AdminReport[];

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h1 className="mb-6 text-3xl font-bold text-blue-950">신고 관리</h1>

      <div className="space-y-4">
        {typedReports.map((report) => (
          <div key={report.id} className="rounded-xl border border-gray-200 p-4">
            <div className="mb-2 flex flex-wrap gap-3 text-sm text-gray-600">
              <span>신고 유형: {report.reason}</span>
              <span>대상: {report.target_type}</span>
              <span>대상 ID: {report.target_id}</span>
              <span>상태: {report.status}</span>
              <span>
                접수일: {new Date(report.created_at).toLocaleString('ko-KR')}
              </span>
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p>
                <strong>신고 대상 사용자:</strong>{' '}
                {report.reported_user?.nickname} /{' '}
                {report.reported_user?.user_code ??
                  report.reported_user?.public_id}
              </p>
              <p>
                <strong>사용자 유형:</strong>{' '}
                {report.reported_user?.user_role} /{' '}
                {report.reported_user?.industry}
              </p>
              <p>
                <strong>계정 상태:</strong>{' '}
                {report.reported_user?.account_status}
              </p>
              <p>
                <strong>사이트 권한:</strong>{' '}
                {report.reported_user?.site_role}
              </p>
              <p>
                <strong>누적 신고 수:</strong>{' '}
                {report.reported_user?.report_count}
              </p>
              <p>
                <strong>신고자:</strong> {report.reporter?.nickname} /{' '}
                {report.reporter?.user_code ?? report.reporter?.public_id}
              </p>
            </div>

            {report.detail && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                {report.detail}
              </p>
            )}
          </div>
        ))}

        {typedReports.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            접수된 신고가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
