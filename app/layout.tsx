import type { Metadata } from 'next';
import './globals.css';
import HeaderBanner from '@/components/HeaderBanner';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: '산업안전보건 통합 커뮤니티 포털',
  description: '산업안전보건 전문 커뮤니티 포털 — 근로자와 관리자를 위한 안전 정보 공유 공간',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <HeaderBanner />
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
