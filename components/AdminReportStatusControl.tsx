'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  updateReportStatus,
  type ReportStatus,
} from '@/app/actions/reports';

const STATUSES: ReportStatus[] = ['접수', '검토중', '처리완료', '반려'];

const STATUS_STYLES: Record<ReportStatus, string> = {
  접수: 'bg-amber-100 text-amber-900 border-amber-300',
  검토중: 'bg-blue-100 text-blue-900 border-blue-300',
  처리완료: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  반려: 'bg-gray-200 text-gray-700 border-gray-300',
};

interface Props {
  reportId: number;
  currentStatus: ReportStatus;
}

export default function AdminReportStatusControl({
  reportId,
  currentStatus,
}: Props) {
  const t = useTranslations('admin.reports');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (next: ReportStatus) => {
    if (next === currentStatus || isPending) return;
    setErrorMsg(null);
    startTransition(async () => {
      const result = await updateReportStatus(reportId, next);
      if ('error' in result) {
        setErrorMsg(
          result.error === 'FORBIDDEN'
            ? t('forbidden')
            : t('updateFailed')
        );
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {t('statusLabel')}:
        </span>
        {STATUSES.map((status) => {
          const isCurrent = status === currentStatus;
          const base =
            'rounded-full border px-3 py-1 text-xs font-medium transition';
          const variant = isCurrent
            ? `${STATUS_STYLES[status]} cursor-default`
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50';
          return (
            <button
              key={status}
              type="button"
              onClick={() => handleChange(status)}
              disabled={isCurrent || isPending}
              aria-pressed={isCurrent}
              aria-label={t('changeTo', { status: t(`status_${status}`) })}
              className={`${base} ${variant} ${
                isPending && !isCurrent ? 'opacity-50' : ''
              }`}
            >
              {t(`status_${status}`)}
            </button>
          );
        })}
        {isPending && (
          <span className="text-xs text-gray-500">{t('updating')}</span>
        )}
      </div>
      {errorMsg && (
        <p className="text-xs text-red-600" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
