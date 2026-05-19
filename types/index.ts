export type UserRole = '근로자' | '관리자';
export type Industry = '건설업' | '제조업' | '기타';
export type ManagerType =
  | '안전관리자'
  | '보건관리자'
  | '현장소장'
  | '관리감독자'
  | '안전보건총괄책임자'
  | '안전보건관리책임자';

export type QnaStatus = '답변대기' | '답변완료';
export type ReportStatus = '접수' | '처리중' | '처리완료';

export type CategorySlug =
  | 'notice'
  | 'free'
  | 'resources'
  | 'law'
  | 'news'
  | 'accident'
  | 'education'
  | 'checklist'
  | 'photos'
  | 'qna';

export interface Profile {
  id: string;
  email: string | null;
  nickname: string;
  nationality: string | null;
  age: number | null;
  user_role: UserRole;
  industry: Industry;
  manager_type: ManagerType | null;
  profile_image: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: CategorySlug;
  sort_order: number;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  category_slug: CategorySlug;
  author_id: string | null;
  image_url: string | null;
  file_url: string | null;
  view_count: number;
  like_count: number;
  qna_status: QnaStatus;
  accident_type: string | null;
  accident_cause: string | null;
  prevention_plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  profiles: Pick<Profile, 'nickname' | 'email'> | null;
}

export interface PostListItem {
  id: number;
  title: string;
  created_at: string;
  view_count: number;
  like_count: number;
  profiles: Pick<Profile, 'nickname' | 'email'> | null;
}

export interface RecentPostItem {
  id: number;
  title: string;
  category_slug: string;
  created_at: string;
  profiles: Pick<Profile, 'nickname' | 'email'> | null;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: string | null;
  content: string;
  parent_comment_id: number | null;
  created_at: string;
}

export interface CommentWithAuthor extends Comment {
  profiles: Pick<Profile, 'nickname' | 'email'> | null;
}

export interface Like {
  id: number;
  post_id: number;
  user_id: string;
  created_at: string;
}

export interface Report {
  id: number;
  post_id: number;
  reporter_id: string | null;
  reason: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface SiteStats {
  memberCount: number;
  postCount: number;
  commentCount: number;
}
