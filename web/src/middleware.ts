import { NextRequest, NextResponse } from 'next/server';

// Protege as rotas do app: sem cookie de token -> manda pro /login.
// Se já logado e tentar /login -> manda pro dashboard.
const PUBLIC = ['/login'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('bf_token')?.value;
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname.startsWith(p));

  if (!token && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (token && pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // aplica a tudo menos assets estáticos e a API interna do Next
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
