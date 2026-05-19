const externalCards = [
  {
    title: '고용노동부',
    description: '산업안전보건 정책자료, 보도자료, 공지사항 확인',
    href: 'https://www.moel.go.kr',
    badge: '정책',
  },
  {
    title: '국토교통부',
    description: '건설, 국토, 교통 관련 정책 및 공지 확인',
    href: 'https://www.molit.go.kr',
    badge: '건설',
  },
  {
    title: '중대재해 사이렌',
    description: '중대재해 발생 알림 및 예방자료 확인',
    href: 'https://labor.moel.go.kr/sasttc/cmmt/bbs_srn_list.do?seCdVal=B1',
    badge: '긴급',
  },
  {
    title: '안전보건공단 산업안전포털',
    description: '산재예방 자료, KOSHA Guide, 기술자료 확인',
    href: 'https://portal.kosha.or.kr',
    badge: '공단',
  },
];

const badgeColors: Record<string, string> = {
  정책: 'bg-blue-100 text-blue-700',
  건설: 'bg-green-100 text-green-700',
  긴급: 'bg-red-100 text-red-700',
  공단: 'bg-orange-100 text-orange-700',
};

export default function DashboardPreview() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900">공식 사이트 바로가기</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {externalCards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl bg-white p-5 shadow transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-blue-900">{card.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColors[card.badge]}`}
                >
                  {card.badge}
                </span>
              </div>
              <a
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                바로가기 →
              </a>
            </div>
            <p className="text-sm text-gray-500">{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
