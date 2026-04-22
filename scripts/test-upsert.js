const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

loadEnvLocal();

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Find a random user to mock
  const { data: user } = await supabase.from('users').select('*').limit(1).single();
  if (!user) {
    console.log("No users found");
    return;
  }
  
  console.log("Found user:", user.id);

  // Attempt the upsert
  const { data, error } = await supabase.from('subscriptions').upsert(
    {
      user_id: user.id,
      stripe_customer_id: 'cus_test123',
      stripe_subscription_id: 'sub_test123',
      plan: 'monthly',
      status: 'active',
      current_period_end: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  ).select();

  console.log("Upsert result:", { data, error });

  if (!error && data) {
    // cleanup mock
    await supabase.from('subscriptions').delete().eq('stripe_subscription_id', 'sub_test123');
  }
}

run();
