import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminReportStatusControl from '@/components/AdminReportStatusControl';
import type { ReportStatus } from '@/app/actions/reports';

type ReportProfile = {
  public_id: string | null;
  nickname: string | null;
  user_role?: string | null;
  industry?: string | null;
  account_status?: string | null;
  report_count?: number | null;
};

type AdminReport = {
  id: number;
  target_type: 'post' | 'comment' | 'answer' | 'answer_opinion';
  target_id: number;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  created_at: string;
  reported_user: ReportProfile | null;
  reporter: ReportProfile | null;
};

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations('admin.reports');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/login', locale });
    return null;
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('is_admin, user_role')
    .eq('id', user.id)
    .single();

  if (!currentProfile?.is_admin && currentProfile?.user_role !== '관리자') {
    redirect({ href: '/admin', locale });
    return null;
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
        nickname,
        user_role,
        industry,
        account_status,
        report_count
      ),
      reporter:profiles!reports_reporter_id_fkey (
        public_id,
        nickname
      )
    `
    )
    .order('created_at', { ascending: false });

  const typedReports = (reports ?? []) as unknown as AdminReport[];
  const dateLocale = locale === 'en' ? 'en-US' : 'ko-KR';

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h1 className="mb-6 text-3xl font-bold text-blue-950">{t('title')}</h1>

      <div className="space-y-4">
        {typedReports.map((report) => (
          <div key={report.id} className="rounded-xl border border-gray-200 p-4">
            <div className="mb-2 flex flex-wrap gap-3 text-sm text-gray-600">
              <span>{t('reasonLabel', { reason: report.reason })}</span>
              <span>
                {t('targetTypeLabel', {
                  targetType: t(`targetType_${report.target_type}`),
                })}
              </span>
              <span>
                {t('targetIdLabel', { targetId: report.target_id })}
              </span>
              <span>
                {t('createdAtLabel', {
                  createdAt: new Date(report.created_at).toLocaleString(
                    dateLocale
                  ),
                })}
              </span>
            </div>

            <div className="mb-3">
              <AdminReportStatusControl
                reportId={report.id}
                currentStatus={report.status}
              />
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p>
                <strong>{t('reportedUser')}:</strong>{' '}
                {report.reported_user?.nickname} /{' '}
                {report.reported_user?.public_id}
              </p>
              <p>
                <strong>{t('reportedUserType')}:</strong>{' '}
                {report.reported_user?.user_role} /{' '}
                {report.reported_user?.industry}
              </p>
              <p>
                <strong>{t('accountStatus')}:</strong>{' '}
                {report.reported_user?.account_status}
              </p>
              <p>
                <strong>{t('reportCount')}:</strong>{' '}
                {report.reported_user?.report_count}
              </p>
              <p>
                <strong>{t('reporter')}:</strong>{' '}
                {report.reporter?.nickname} / {report.reporter?.public_id}
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
            {t('empty')}
          </div>
        )}
      </div>
    </div>
  );
}
