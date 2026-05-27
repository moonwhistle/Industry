import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import '../globals.css';
import HeaderBanner from '@/components/HeaderBanner';
import Sidebar from '@/components/Sidebar';
import { routing } from '@/i18n/routing';

export const metadata: Metadata = {
  title: '산업안전보건 통합 커뮤니티 포털',
  description: '산업안전보건 전문 커뮤니티 포털 — 근로자와 관리자를 위한 안전 정보 공유 공간',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <HeaderBanner />
          <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
            <Sidebar />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
