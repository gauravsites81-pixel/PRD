#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');

    if (equalsIndex === -1) {
      continue;
    }

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

async function main() {
  loadEnvLocal();

  const email = process.argv[2];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email) {
    console.error('Usage: node scripts/make-admin.js user@example.com');
    process.exit(1);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error(`Failed to list Supabase auth users: ${authError.message}`);
    process.exit(1);
  }

  const user = authData.users.find(
    (candidate) => candidate.email && candidate.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    console.error(`No Supabase auth user found for ${email}`);
    process.exit(1);
  }

  const { error: upsertError } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        role: 'admin',
      },
      { onConflict: 'id' }
    );

  if (upsertError) {
    console.error(`Failed to update users.role for ${email}: ${upsertError.message}`);
    process.exit(1);
  }

  console.log(`Promoted ${email} to admin.`);
  console.log(`User ID: ${user.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
