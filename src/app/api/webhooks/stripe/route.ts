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

      const userId = session.metadata?.user_id;
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;
      const clientReferenceId = session.client_reference_id as string; // CRITICAL: From checkout

      // Processing webhook data for user subscription

      if (!userId) {
        return Response.json({ ok: true });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const interval =
        subscription.items.data[0]?.price?.recurring?.interval;

      const plan =
        interval === 'month'
          ? 'monthly'
          : interval === 'year'
          ? 'yearly'
          : null;

      // FIXED STATUS NORMALIZATION
      const normalizedStatus =
        subscription.status === 'active' ||
        subscription.status === 'trialing'
          ? 'active'
          : subscription.status === 'canceled'
          ? 'cancelled'
          : 'inactive';

      // Saving subscription for user

      const { error } = await supabaseAdmin.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan,
          status: normalizedStatus,
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        // Supabase error occurred
      } else {
        // Subscription saved successfully
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    // Webhook handler error occurred
    return new Response('Webhook handler failed', { status: 500 });
  }
}