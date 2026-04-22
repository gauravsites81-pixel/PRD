import { NextResponse } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Type definition for subscription data
interface SubscriptionData {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  plan: string;
  current_period_end: string;
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get customer ID from user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError) {
      // Subscription query error occurred
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    if (!subscription || !(subscription as any).stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const appUrl = process.env.APP_URL;

    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: (subscription as any).stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    // Billing portal error occurred
    return NextResponse.json(
      { 
        error: 'Failed to create billing portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
