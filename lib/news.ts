// 산업안전 뉴스 하위 분류 (Step 9)
// slug 로 저장하고 UI 에서 한글 라벨로 표시. "전체" 는 필터 미적용 뷰라 여기 포함하지 않음.

export const NEWS_SUBCATEGORIES = [
  { slug: 'construction', name: '건설업' },
  { slug: 'manufacturing', name: '제조업' },
  { slug: 'shipping', name: '조선·운송업' },
  { slug: 'etc', name: '기타' },
] as const;

export type NewsSubcategorySlug = (typeof NEWS_SUBCATEGORIES)[number]['slug'];

export const NEWS_SUBCATEGORY_SLUGS: readonly string[] = NEWS_SUBCATEGORIES.map(
  (s) => s.slug
);

export function isNewsSubcategory(value: string): value is NewsSubcategorySlug {
  return NEWS_SUBCATEGORY_SLUGS.includes(value);
}
