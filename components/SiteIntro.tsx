export default function SiteIntro() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-3 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
        산업안전보건 통합 커뮤니티 소개
      </div>

      <h2 className="mb-4 text-2xl font-bold text-blue-950">
        관리자와 근로자가 함께 만드는 안전한 현장
      </h2>

      <p className="leading-8 text-gray-700">
        산업안전보건 통합 커뮤니티는 건설업, 제조업, 기타 산업현장의
        관리자와 근로자가 함께 소통하는 안전보건 정보 공유 플랫폼입니다.
        관리자는 근로자의 실제 어려움을 이해하고, 근로자는 관리자의 법적
        책임과 안전관리 기준을 이해할 수 있도록 질문, 답변, 자료 공유,
        사고사례, 아차사고, 익명 제보 기능을 제공합니다.
      </p>

      <p className="mt-4 leading-8 text-gray-700">
        특히 익명 제보를 통해 현장의 위험요소를 부담 없이 공유할 수 있으며,
        회사명, 개인명, 현장명 언급은 금지하여 비방이 아닌 안전문화 개선을
        목적으로 운영됩니다. 이 플랫폼은 관리자와 근로자가 서로의 입장을
        이해하고, 현장의 안전보건 수준을 함께 높여가는 화합의 장을
        지향합니다.
      </p>
    </section>
  );
}
