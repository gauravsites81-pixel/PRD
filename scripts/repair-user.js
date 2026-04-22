#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function run() {
  loadEnvLocal();
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.STRIPE_SECRET_KEY) {
    console.error('Missing environment variables. Make sure .env.local exists with Supabase and Stripe keys.');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  try {
    const { data: user, error } = await supabase.from('users').select('*').eq('email', 'gauravsites81@gmail.com').single();
    if (error || !user) {
      console.log('Error finding user (gauravsites81@gmail.com):', error?.message || 'User not found');
      return;
    }
    console.log('User found:', user.id);
    
    // List stripe customers by email
    const customers = await stripe.customers.search({
      query: `email:\'gauravsites81@gmail.com\'`,
    });
    
    if (customers.data.length === 0) {
      console.log('No stripe customer found for this email.');
      return;
    }
    
    const customer = customers.data[0];
    console.log('Found customer:', customer.id);
    
    // List subscriptions for this customer
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1
    });
    
    if (subs.data.length === 0) {
      console.log('No stripe subscriptions found for customer.');
      return;
    }
    
    const subscription = subs.data[0];
    console.log('Found subscription:', subscription.id, 'status:', subscription.status);
    
    const interval = subscription.items.data[0]?.price?.recurring?.interval;
    const plan = interval === 'month' ? 'monthly' : interval === 'year' ? 'yearly' : null;

    const normalizedStatus =
        subscription.status === 'active' || subscription.status === 'trialing'
          ? 'active'
          : subscription.status === 'canceled'
          ? 'cancelled'
          : 'lapsed';
          
    const { error: upsertError } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      plan,
      status: normalizedStatus,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }, { onConflict: 'user_id' });
    
    if (upsertError) {
      console.error('Error repairing user subscription:', upsertError.message);
    } else {
      console.log('Successfully repaired user subscription! Status set to:', normalizedStatus);
    }
    
  } catch (e) {
    console.error('Caught error:', e);
  }
}
run();