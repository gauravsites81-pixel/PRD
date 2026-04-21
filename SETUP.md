# GolfHeroes Setup

This guide covers creating a fresh Supabase project, creating a Vercel project, configuring Stripe and Resend, running the database SQL, and promoting an admin user.

## Prerequisites

- Node.js 18 or newer
- pnpm installed globally: `npm install -g pnpm`
- Supabase CLI installed: `npm install -g supabase`
- Git
- Accounts for Supabase, Vercel, Stripe, and Resend

## Create a Supabase Project

1. Open `https://supabase.com/dashboard`.
2. Select your organisation.
3. Click **New project**.
4. Set a project name, for example `golfheroes`.
5. Choose a strong database password and save it securely.
6. Choose the region closest to your users, typically London or another UK/EU region.
7. Click **Create new project** and wait for provisioning to finish.

After the project is ready, open **Settings > API** and copy:

- Project URL: `NEXT_PUBLIC_SUPABASE_URL`
- Anon public key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role key: `SUPABASE_SERVICE_ROLE_KEY`

Keep the service role key private. It bypasses Row Level Security and must only be used server-side or in trusted scripts.

## Run the Schema SQL

1. In Supabase, open **SQL Editor**.
2. Click **New query**.
3. Paste the full contents of `supabase/schema.sql`.
4. Click **Run**.
5. Confirm the tables appear in **Table Editor**:
   `users`, `subscriptions`, `golf_scores`, `charities`, `user_charity`, `draws`, `draw_results`, `winner_proofs`, and `prize_pool_config`.

The schema enables Row Level Security on every table and creates the rolling five-score trigger for `golf_scores`.

## Run the Seed SQL

1. Create the initial admin auth user first:
   - Open **Authentication > Users**.
   - Click **Add user**.
   - Create the admin email/password account.
2. Copy that auth user's UUID.
3. Open `supabase/seed.sql`.
4. Replace the placeholder UUID in the admin insert with the actual auth user UUID.
5. In **SQL Editor**, paste the edited seed SQL and click **Run**.

The seed inserts three sample UK golf charities and one admin profile row.

## Create Stripe Products

Use Stripe test mode while developing.

1. Open `https://dashboard.stripe.com`.
2. Toggle **Test mode** on.
3. Go to **Product catalog**.
4. Create a product named `GolfHeroes Monthly`.
5. Add a recurring monthly price in GBP.
6. Copy the monthly Price ID into `STRIPE_MONTHLY_PRICE_ID`.
7. Create a product named `GolfHeroes Yearly`.
8. Add a recurring yearly price in GBP, discounted compared with 12 monthly payments.
9. Copy the yearly Price ID into `STRIPE_YEARLY_PRICE_ID`.

Then open **Developers > API keys** and copy:

- Publishable key: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Secret key: `STRIPE_SECRET_KEY`

For webhooks:

1. Open **Developers > Webhooks**.
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`.
3. Select subscription and payment events used by the app, at minimum:
   `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, and `invoice.payment_failed`.
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

For local webhook testing, use `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and copy the local `whsec_...` value.

## Get Resend API Key

1. Open `https://resend.com`.
2. Create or select your account.
3. Open **API Keys**.
4. Create an API key for this app.
5. Copy it into `RESEND_API_KEY`.

For production sending, verify your domain in Resend and configure the required DNS records.

## Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Use this complete variable list:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_value
STRIPE_SECRET_KEY=sk_test_or_live_value
STRIPE_WEBHOOK_SECRET=whsec_value
STRIPE_MONTHLY_PRICE_ID=price_monthly_value
STRIPE_YEARLY_PRICE_ID=price_yearly_value

RESEND_API_KEY=re_value

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CURRENCY=GBP
NEXT_PUBLIC_CURRENCY_SYMBOL=£
NEXT_PUBLIC_ENABLE_DRAWS=true
```

Descriptions:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL used by browser and server code.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key used by browser clients under RLS.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase privileged server key for admin scripts and trusted server operations.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe browser publishable key.
- `STRIPE_SECRET_KEY`: Stripe secret API key for server-side Stripe calls.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret used to verify webhook events.
- `STRIPE_MONTHLY_PRICE_ID`: Stripe recurring monthly GBP price ID.
- `STRIPE_YEARLY_PRICE_ID`: Stripe recurring yearly GBP price ID.
- `RESEND_API_KEY`: Resend API key for transactional email.
- `NEXT_PUBLIC_APP_URL`: Public base URL. Use `http://localhost:3000` locally and your Vercel URL in production.
- `NEXT_PUBLIC_CURRENCY`: Currency code, currently `GBP`.
- `NEXT_PUBLIC_CURRENCY_SYMBOL`: Currency symbol displayed in the UI.
- `NEXT_PUBLIC_ENABLE_DRAWS`: Feature flag for draw functionality.

## Run Locally

Install dependencies:

```bash
pnpm install
```

Start the Next.js development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Create a Vercel Project

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Open `https://vercel.com/dashboard`.
3. Click **Add New > Project**.
4. Import this repository.
5. Keep the framework preset as **Next.js**.
6. Set the install command to `pnpm install`.
7. Set the build command to `pnpm build`.
8. Set the output directory to `.next` or leave it as the Next.js default.

## Deploy to Vercel

In Vercel, open **Project Settings > Environment Variables** and add every variable from `.env.local`.

Use production values:

- `NEXT_PUBLIC_APP_URL` should be your production URL, for example `https://your-domain.com`.
- Stripe keys should match the mode you intend to use. Use live keys only when you are ready for real payments.
- `STRIPE_WEBHOOK_SECRET` must come from the production webhook endpoint configured in Stripe.

Deploy by pushing to the connected branch:

```bash
git push origin main
```

After deployment:

1. Open the Vercel deployment URL.
2. Update Stripe webhook endpoint URL if needed.
3. Confirm Supabase auth redirect URLs include your production domain under **Authentication > URL Configuration**.

## Use `scripts/make-admin.js`

The script promotes an existing Supabase Auth user to admin in the public `users` table.

Requirements:

- The user must already exist in **Supabase Authentication > Users**.
- `.env.local` must contain `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Run:

```bash
pnpm make-admin admin@example.com
```

or:

```bash
node scripts/make-admin.js admin@example.com
```

The script:

1. Loads `.env.local`.
2. Finds the Supabase auth user by email.
3. Upserts the matching row in `public.users`.
4. Sets `role = 'admin'`.
5. Logs the promoted user's UUID.

If the email is not found, create the user in the Supabase dashboard first, then rerun the command.
