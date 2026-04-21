import { redirect } from 'next/navigation';
import { CharitySelector } from '@/components/dashboard/charity-selector';
import { LogoutButton } from '@/components/auth/logout-button';
import { ScoreManager } from '@/components/dashboard/score-manager';
import { SubscribeButtons } from '@/components/dashboard/subscribe-buttons';
import DrawResults from '@/components/dashboard/draw-results';
import { WinningsNew as Winnings } from '@/components/dashboard/winnings-new';
import { WinnerProof } from '@/components/dashboard/winner-proof';
import { BillingManager } from '@/components/dashboard/billing-manager';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { formatDate } from '@/utils/formatters';
import type { Charity, GolfScore, Subscription, UserCharity, Draw, DrawResult } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard');
  }

  // Profile
 const profile = {
  email: user.email,
  full_name: user.user_metadata?.full_name || null,
  role: 'subscriber',
};

  // Subscription
  const { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const subscription = subscriptionData as Subscription | null;

  const isSubscribed = subscription?.status === 'active';

  // Scores
  const { data: scoreData } = await supabase
    .from('golf_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(5);

  const initialScores = (scoreData || []) as GolfScore[];

  // Charities
  const { data: charityData } = await supabase
    .from('charities')
    .select('*')
    .order('name', { ascending: true });

  const charities = (charityData || []) as Charity[];

  const { data: userCharityData } = await supabase
    .from('user_charity')
    .select('*, charities(*)')
    .eq('user_id', user.id)
    .maybeSingle();

  const userCharity = userCharityData as (UserCharity & {
    charities: Charity | null;
  }) | null;

  // Draw data
  const { data: latestDrawData } = await supabase
    .from('draws')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestDraw = latestDrawData as Draw | null;

  // User's result for latest draw
  let userResult: {
    id: string;
    user_id: string;
    draw_id: string;
    matched_count: number;
    matched_numbers: number[];
    created_at: string;
  } | null = null;
  if (latestDraw) {
    const { data: userResultData } = await supabase
      .from('draw_results')
      .select('*')
      .eq('winner_user_id', user.id)
      .eq('draw_id', latestDraw.id)
      .maybeSingle();

    // Map database fields to component interface
    if (userResultData) {
      userResult = {
        id: (userResultData as any).id,
        user_id: (userResultData as any).winner_user_id,
        draw_id: (userResultData as any).draw_id,
        matched_count: (userResultData as any).match_type,
        matched_numbers: [], // This would need to be calculated or stored separately
        created_at: (userResultData as any).created_at,
      };
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <header className="flex justify-between items-center border-b pb-6">
          <div>
            <p className="text-sm font-bold text-emerald-700">
              GolfHeroes dashboard
            </p>
            <h1 className="text-3xl font-extrabold mt-2">Your account</h1>
          </div>
          <LogoutButton />
        </header>

        {/* PROFILE */}
        <section className="mt-8 bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold">Signed in</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold">
                {profile?.full_name || 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{profile?.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-semibold capitalize">
                {profile?.role || 'subscriber'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Subscription</p>

              <p className="font-semibold">
                {isSubscribed
                  ? `Active, ${subscription?.plan}`
                  : 'Not active yet'}
              </p>

              {subscription?.current_period_end && (
                <p className="text-xs text-gray-500">
                  Renews/ends {formatDate(subscription.current_period_end)}
                </p>
              )}
            </div>
          </div>

          {/* Subscribe buttons only if NOT subscribed */}
          {!isSubscribed && (
            <div className="mt-6">
              <SubscribeButtons
                monthlyPriceId={
                  process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || ''
                }
                yearlyPriceId={
                  process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || ''
                }
                userId={user.id}
              />
            </div>
          )}
        </section>

        {/* LOCK MESSAGE */}
        {!isSubscribed && (
          <div className="mt-6 bg-yellow-100 border border-yellow-300 p-4 rounded-lg text-sm font-semibold text-yellow-800">
            🔒 You need an active subscription to fully use the app.
          </div>
        )}

        {/* SCORE */}
        <ScoreManager
          userId={user.id}
          initialScores={initialScores}
          disabled={!isSubscribed}
        />

        {/* CHARITY */}
        <CharitySelector
          userId={user.id}
          initialCharities={charities}
          initialSelection={userCharity}
          disabled={!isSubscribed}
        />

        {/* WINNINGS */}
        <Winnings
          userId={user.id}
          disabled={!isSubscribed}
        />

        {/* WINNER PROOF */}
        <WinnerProof
          userId={user.id}
          disabled={!isSubscribed}
        />

        {/* BILLING */}
        <BillingManager
          disabled={!isSubscribed}
        />

        {/* DRAW RESULTS */}
        <DrawResults
          draw={latestDraw}
          userResult={userResult}
        />
      </div>
    </main>
  );
}