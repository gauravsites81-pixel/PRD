import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature');

  if (!sig) {
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    // Webhook error occurred
    return new Response('Webhook error', { status: 400 });
  }

  // Processing webhook event

  try {
    // MAIN EVENT
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id || session.client_reference_id;
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (!userId) {
        console.error('Webhook Error: No user ID found in session metadata or client_reference_id', { sessionId: session.id });
        return Response.json({ error: 'Missing userId' }, { status: 400 });
      }

      console.log(`Webhook: Found userId ${userId}, proceeding with checkout.session.completed...`);

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const interval = subscription.items.data[0]?.price?.recurring?.interval;
      const plan = interval === 'month' ? 'monthly' : interval === 'year' ? 'yearly' : null;

      const normalizedStatus =
        subscription.status === 'active' || subscription.status === 'trialing'
          ? 'active'
          : subscription.status === 'canceled'
          ? 'cancelled'
          : 'lapsed';

      const { error } = await supabaseAdmin.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan,
          status: normalizedStatus,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('Webhook Supabase Upsert Error on Checkout:', error);
        return Response.json({ error: 'Database insert failed' }, { status: 500 });
      } else {
        console.log(`Successfully processed checkout.session.completed for user ${userId}.`);
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      console.log(`Webhook: Processing ${event.type} for customer ${customerId}...`);

      let userId = subscription.metadata?.user_id;

      if (!userId) {
        // Fallback to existing db record if metadata is missing on the subscription
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();
        
        userId = existingSub?.user_id;
      }

      if (!userId) {
        console.log(`Webhook: No user_id found in metadata or DB for stripe_subscription_id ${subscription.id}`);
        return Response.json({ received: true });
      }

      const interval = subscription.items.data[0]?.price?.recurring?.interval;
      const plan = interval === 'month' ? 'monthly' : interval === 'year' ? 'yearly' : null;

      const normalizedStatus =
        subscription.status === 'active' || subscription.status === 'trialing'
          ? 'active'
          : subscription.status === 'canceled'
          ? 'cancelled'
          : 'lapsed';

      const { error: upsertError } = await supabaseAdmin.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan,
          status: normalizedStatus,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (upsertError) {
        console.error(`Webhook Supabase Upsert Error on ${event.type}:`, upsertError);
        return Response.json({ error: 'Database update failed' }, { status: 500 });
      } else {
        console.log(`Successfully processed ${event.type} for user ${userId}.`);
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    // Webhook handler error occurred
    return new Response('Webhook handler failed', { status: 500 });
  }
}