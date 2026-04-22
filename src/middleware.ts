import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req: request, res: response });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  if (!session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/admin')) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    const profile = data as { role: string } | null;

    if (profile?.role !== 'admin' && session.user.email !== 'gauravsites81@gmail.com') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      redirectUrl.searchParams.delete('next');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
