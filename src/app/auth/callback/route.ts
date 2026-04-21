import { NextResponse, type NextRequest } from 'next/server';
import { createRouteSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createRouteSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const adminSupabase = createServiceRoleClient();
      const fullName =
        typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;

      const { data: existingProfile } = await adminSupabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        await adminSupabase
          .from('users')
          .update({
            email: user.email,
            full_name: fullName,
          })
          .eq('id', user.id);
      } else {
        await adminSupabase.from('users').insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          role: 'subscriber',
        });
      }
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://golftrak.vercel.app';
  return NextResponse.redirect(new URL(next, baseUrl));
}
