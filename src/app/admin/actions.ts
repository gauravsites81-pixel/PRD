'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

// Require admin privilege for all actions
async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const profile = data as { role: string } | null;

  if (profile?.role !== 'admin') throw new Error('Forbidden');
  return user;
}

export async function toggleUserRole(userId: string, currentRole: string) {
  await requireAdmin();
  const adminSupabase = createServiceRoleClient();
  const newRole = currentRole === 'admin' ? 'subscriber' : 'admin';
  
  const { error } = await adminSupabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);
    
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  return { success: true, role: newRole };
}

export async function verifyWinnerProof(proofId: string, status: 'approved' | 'rejected') {
  await requireAdmin();
  const adminSupabase = createServiceRoleClient();
  
  const { error } = await adminSupabase
    .from('winner_proofs')
    .update({ admin_status: status })
    .eq('id', proofId);
    
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  return { success: true };
}

export async function markWinnerPaid(resultId: string) {
  await requireAdmin();
  const adminSupabase = createServiceRoleClient();
  
  const { error } = await adminSupabase
    .from('draw_results')
    .update({ payment_status: 'paid' })
    .eq('id', resultId);
    
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  return { success: true };
}
