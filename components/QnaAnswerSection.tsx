import { createClient } from '@/lib/supabase/server';
import type { AnswerWithAuthor } from '@/types';
import AdminContentActions from './admin/AdminContentActions';
import AnswerForm from './forms/AnswerForm';
import AnswerOpinionForm from './forms/AnswerOpinionForm';
import ReportButton from './ReportButton';
import SelectAnswerButton from './SelectAnswerButton';

type QnaAnswerSectionProps = {
  postId: number;
  questionAuthorId: string | null;
};

export default async function QnaAnswerSection({
  postId,
  questionAuthorId,
}: QnaAnswerSectionProps) {
  const supabase = await createClient();

  const [{ data: answers }, { data: userData }] = await Promise.all([
    supabase
      .from('answers')
      .select(
        `
        id,
        post_id,
        author_id,
        content,
        source,
        is_selected,
        is_admin_answer,
        is_hidden,
        hidden_reason,
        created_at,
        updated_at,
        profiles (
          nickname,
          email,
          public_id,
          user_role,
          industry
        ),
        answer_opinions (
          id,
          answer_id,
          author_id,
          opinion_type,
          content,
          source,
          is_hidden,
          hidden_reason,
          created_at,
          updated_at,
          profiles (
            nickname,
            email,
            public_id,
            user_role
          )
        )
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const { data: currentProfile } = userData.user
    ? await supabase
        .from('profiles')
        .select('is_admin, user_role')
        .eq('id', userData.user.id)
        .single()
    : { data: null };
  const isAdmin = Boolean(
    currentProfile?.is_admin || currentProfile?.user_role === '관리자'
  );
  const isQuestionAuthor = Boolean(
    userData.user && questionAuthorId && userData.user.id === questionAuthorId
  );
  const typedAnswers = (answers ?? []) as unknown as AnswerWithAuthor[];

  return (
    <section className="mt-10 border-t border-gray-200 pt-6">
      <div className="mb-6 rounded-xl bg-blue-50 p-5">
        <h2 className="text-xl font-bold text-blue-950">
          Q&A 답변 및 추가의견
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-900">
          산업안전보건 관련 답변은 법령, 현장 조건, 작업 환경에 따라 달라질 수
          있습니다. 답변에 오류가 있거나 추가 근거가 필요한 경우 다른 사용자가
          이의제기 또는 추가의견을 남길 수 있습니다.
        </p>
      </div>

      <AnswerForm postId={postId} />

      <div className="mt-8 space-y-6">
        {typedAnswers.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            아직 등록된 답변이 없습니다.
          </div>
        )}

        {typedAnswers.map((answer) => (
          <div key={answer.id} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="font-bold text-blue-900">
                {answer.profiles?.nickname ??
                  answer.profiles?.public_id ??
                  answer.profiles?.email ??
                  '알 수 없음'}
              </span>

              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                {answer.profiles?.user_role ?? '사용자'}
              </span>

              {answer.is_admin_answer && (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                  관리자 답변
                </span>
              )}

              {answer.is_selected && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                  채택 답변
                </span>
              )}

              {answer.is_hidden && (
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                  숨김
                </span>
              )}

              <span className="text-xs text-gray-400">
                {new Date(answer.created_at).toLocaleString('ko-KR')}
              </span>

              {answer.author_id && (
                <ReportButton
                  targetType="answer"
                  targetId={answer.id}
                  reportedUserId={answer.author_id}
                />
              )}

              {isQuestionAuthor && (
                <SelectAnswerButton
                  answerId={answer.id}
                  isSelected={answer.is_selected}
                />
              )}
            </div>

            {answer.is_hidden ? (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-400">
                관리자에 의해 숨김 처리된 답변입니다.
              </p>
            ) : (
              <div className="whitespace-pre-wrap leading-7 text-gray-800">
                {answer.content}
              </div>
            )}

            {answer.source && !answer.is_hidden && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                <strong>근거/출처:</strong> {answer.source}
              </div>
            )}

            {isAdmin && <AdminContentActions targetType="answer" targetId={answer.id} />}

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-800">
                이 답변에 대한 이의제기 및 추가의견
              </h3>

              <div className="space-y-3">
                {answer.answer_opinions?.map((opinion) => (
                  <div key={opinion.id} className="rounded-lg bg-white p-4 shadow-sm">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                        {opinion.opinion_type}
                      </span>

                      <span className="text-sm font-semibold text-gray-800">
                        {opinion.profiles?.nickname ??
                          opinion.profiles?.public_id ??
                          opinion.profiles?.email ??
                          '알 수 없음'}
                      </span>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {opinion.profiles?.user_role ?? '사용자'}
                      </span>

                      <span className="text-xs text-gray-400">
                        {new Date(opinion.created_at).toLocaleString('ko-KR')}
                      </span>

                      {opinion.author_id && (
                        <ReportButton
                          targetType="answer_opinion"
                          targetId={opinion.id}
                          reportedUserId={opinion.author_id}
                        />
                      )}
                    </div>

                    {opinion.is_hidden ? (
                      <p className="text-sm text-gray-400">
                        관리자에 의해 숨김 처리된 의견입니다.
                      </p>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {opinion.content}
                      </p>
                    )}

                    {opinion.source && !opinion.is_hidden && (
                      <p className="mt-2 text-xs text-gray-500">
                        근거/출처: {opinion.source}
                      </p>
                    )}

                    {isAdmin && (
                      <AdminContentActions
                        targetType="answer_opinion"
                        targetId={opinion.id}
                      />
                    )}
                  </div>
                ))}
              </div>

              <AnswerOpinionForm answerId={answer.id} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
