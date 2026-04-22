import { NextResponse } from 'next/server';
import { createRouteSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function POST() {
  const supabase = createRouteSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const adminSupabase = createServiceRoleClient();

  // Check if user already exists to preserve their role
  const { data: existingUser } = await adminSupabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // Temporarily disabled - don't override existing roles during testing
  // const { error } = await adminSupabase
  //   .from('users')
  //   .upsert(
  //     {
  //       id: user.id,
  //       email: user.email,
  //       role: existingUser?.role || 'subscriber', // Preserve existing role
  //     },
  //     { onConflict: 'id' }
  //   );

  const { error } = { error: null }; // No-op for testing

  if (error) {
    // Failed to sync public.users profile
    return NextResponse.json({ error: 'Profile sync failed' }, { status: 500 });
  }

  // Successfully synced public.users profile

  return NextResponse.json({ ok: true });
}
