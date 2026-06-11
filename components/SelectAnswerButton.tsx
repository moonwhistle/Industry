'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toggleAnswerSelection } from '@/app/actions/answers';

interface Props {
  answerId: number;
  isSelected: boolean;
}

export default function SelectAnswerButton({ answerId, isSelected }: Props) {
  const t = useTranslations('qna');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = () => {
    if (isPending) return;
    setErrorMsg(null);
    startTransition(async () => {
      const result = await toggleAnswerSelection(answerId);
      if ('error' in result) {
        setErrorMsg(t('selectFailed'));
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={isSelected}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
          isSelected
            ? 'border-green-400 bg-green-100 text-green-800 hover:bg-green-200'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        {isPending
          ? t('selectUpdating')
          : isSelected
            ? t('deselect')
            : t('select')}
      </button>
      {errorMsg && (
        <span className="text-xs text-red-600" role="alert">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
