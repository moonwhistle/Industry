import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const PROTECTED_PATHS = ['/write', '/admin', '/mypage'];

const intlMiddleware = createMiddleware(routing);

const localePrefixPattern = new RegExp(
  `^/(${routing.locales.join('|')})(?=/|$)`
);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const match = pathname.match(localePrefixPattern);
  const locale = match ? match[1] : routing.defaultLocale;
  const pathWithoutLocale = pathname.replace(localePrefixPattern, '') || '/';

  const isProtected = PROTECTED_PATHS.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  if (isProtected) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/login`;
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
