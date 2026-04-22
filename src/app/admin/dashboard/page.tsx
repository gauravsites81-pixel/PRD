import { createServerSupabaseClient } from '@/lib/supabase-server';
import { AdminPanel } from '@/components/admin/AdminPanel';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();

  // 1. Fetch Users & their Subscriptions
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*, subscriptions(status, plan, current_period_end)')
    .order('created_at', { ascending: false });

  // 2. Fetch Draws & Draw Results
  const { data: draws, error: drawsError } = await supabase
    .from('draws')
    .select('*, draw_results(*, users(email, full_name))')
    .order('created_at', { ascending: false });

  // 3. Fetch Winner Proofs
  const { data: proofs, error: proofsError } = await supabase
    .from('winner_proofs')
    .select('*, users(email, full_name), draw_results(prize_amount, match_type)')
    .order('submitted_at', { ascending: false });

  // 4. Metrics
  const { count: subscriberCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data } = await supabase
    .from('draws')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  const latestDraw = data as any;

  const totalPool = (subscriberCount || 0) * 10;
  const currentRollover = latestDraw?.jackpot_carried_over ? latestDraw.carried_over_amount : 0;
  
  const typedProofs = proofs as any[];
  const pendingProofs = typedProofs?.filter(p => p.admin_status === 'pending').length || 0;

  const metrics = {
    totalSubscribers: subscriberCount || 0,
    totalPool: totalPool + currentRollover,
    rollover: currentRollover,
    nextDrawDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(), // 1st of next month approx
    pendingProofs,
  };

  return (
    <AdminPanel 
      initialUsers={users || []} 
      initialDraws={draws || []} 
      initialProofs={proofs || []}
      metrics={metrics}
    />
  );
}
