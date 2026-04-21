import { NextResponse } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/supabase-server';

export async function POST() {
  const supabase = createRouteSupabaseClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
