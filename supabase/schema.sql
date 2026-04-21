create extension if not exists pgcrypto;

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    where id = check_user_id
      and role = 'admin'
  );
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'subscriber' check (role in ('subscriber', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text check (plan in ('monthly', 'yearly')),
  status text check (status in ('active', 'cancelled', 'lapsed')),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.golf_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer check (score >= 1 and score <= 45),
  date date not null,
  created_at timestamptz not null default now(),
  constraint golf_scores_user_id_date_key unique (user_id, date)
);

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  events jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_charity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  charity_id uuid not null references public.charities(id) on delete cascade,
  contribution_percentage integer not null default 10 check (contribution_percentage >= 10),
  updated_at timestamptz not null default now()
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  month integer not null check (month >= 1 and month <= 12),
  year integer not null,
  status text not null check (status in ('draft', 'simulated', 'published')),
  draw_type text not null check (draw_type in ('random', 'algorithmic')),
  drawn_numbers integer[] not null,
  jackpot_carried_over boolean not null default false,
  carried_over_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  constraint draws_month_year_key unique (month, year),
  constraint draws_drawn_numbers_count_check check (array_length(drawn_numbers, 1) = 5)
);

create table if not exists public.draw_results (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  match_type integer not null check (match_type in (3, 4, 5)),
  winner_user_id uuid not null references auth.users(id) on delete cascade,
  prize_amount numeric not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

create table if not exists public.winner_proofs (
  id uuid primary key default gen_random_uuid(),
  draw_result_id uuid not null unique references public.draw_results(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  proof_url text not null,
  admin_status text not null default 'pending' check (admin_status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  submitted_at timestamptz not null default now()
);

create table if not exists public.prize_pool_config (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null unique references public.draws(id) on delete cascade,
  total_pool numeric not null,
  five_match_pool numeric not null,
  four_match_pool numeric not null,
  three_match_pool numeric not null,
  active_subscriber_count integer,
  calculated_at timestamptz not null default now()
);

create or replace function public.trim_golf_scores_to_latest_five()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.golf_scores
    where user_id = new.user_id
  ) > 5 then
    delete from public.golf_scores
    where id = (
      select id
      from public.golf_scores
      where user_id = new.user_id
      order by date asc, created_at asc
      limit 1
    );
  end if;

  return new;
end;
$$;

drop trigger if exists golf_scores_limit_five_after_insert on public.golf_scores;
create trigger golf_scores_limit_five_after_insert
after insert on public.golf_scores
for each row
execute function public.trim_golf_scores_to_latest_five();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'subscriber')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.golf_scores enable row level security;
alter table public.charities enable row level security;
alter table public.user_charity enable row level security;
alter table public.draws enable row level security;
alter table public.draw_results enable row level security;
alter table public.winner_proofs enable row level security;
alter table public.prize_pool_config enable row level security;

drop policy if exists "Users can read own row and admins can read all" on public.users;
create policy "Users can read own row and admins can read all"
on public.users
for select
using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "Users can update own row" on public.users;
create policy "Users can update own row"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert own row" on public.users;
create policy "Users can insert own row"
on public.users
for insert
with check (auth.uid() = id and role = 'subscriber');

drop policy if exists "Users can read own subscriptions and admins can read all" on public.subscriptions;
create policy "Users can read own subscriptions and admins can read all"
on public.subscriptions
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Admins can update all subscriptions" on public.subscriptions;
create policy "Admins can update all subscriptions"
on public.subscriptions
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Users can read own golf scores and admins can read all" on public.golf_scores;
create policy "Users can read own golf scores and admins can read all"
on public.golf_scores
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can insert own golf scores" on public.golf_scores;
create policy "Users can insert own golf scores"
on public.golf_scores
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own golf scores and admins can update all" on public.golf_scores;
create policy "Users can update own golf scores and admins can update all"
on public.golf_scores
for update
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can delete own golf scores" on public.golf_scores;
create policy "Users can delete own golf scores"
on public.golf_scores
for delete
using (auth.uid() = user_id);

drop policy if exists "Anyone can read charities" on public.charities;
create policy "Anyone can read charities"
on public.charities
for select
using (true);

drop policy if exists "Admins can insert charities" on public.charities;
create policy "Admins can insert charities"
on public.charities
for insert
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update charities" on public.charities;
create policy "Admins can update charities"
on public.charities
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete charities" on public.charities;
create policy "Admins can delete charities"
on public.charities
for delete
using (public.is_admin(auth.uid()));

drop policy if exists "Users can read own charity choice and admins can read all" on public.user_charity;
create policy "Users can read own charity choice and admins can read all"
on public.user_charity
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can update own charity choice" on public.user_charity;
create policy "Users can update own charity choice"
on public.user_charity
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can insert own charity choice" on public.user_charity;
create policy "Users can insert own charity choice"
on public.user_charity
for insert
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read published draws and admins can read all" on public.draws;
create policy "Authenticated users can read published draws and admins can read all"
on public.draws
for select
using ((auth.role() = 'authenticated' and status = 'published') or public.is_admin(auth.uid()));

drop policy if exists "Admins can insert draws" on public.draws;
create policy "Admins can insert draws"
on public.draws
for insert
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update draws" on public.draws;
create policy "Admins can update draws"
on public.draws
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete draws" on public.draws;
create policy "Admins can delete draws"
on public.draws
for delete
using (public.is_admin(auth.uid()));

drop policy if exists "Users can read own draw results and admins can read all" on public.draw_results;
create policy "Users can read own draw results and admins can read all"
on public.draw_results
for select
using (auth.uid() = winner_user_id or public.is_admin(auth.uid()));

drop policy if exists "Admins can insert draw results" on public.draw_results;
create policy "Admins can insert draw results"
on public.draw_results
for insert
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update draw results" on public.draw_results;
create policy "Admins can update draw results"
on public.draw_results
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete draw results" on public.draw_results;
create policy "Admins can delete draw results"
on public.draw_results
for delete
using (public.is_admin(auth.uid()));

drop policy if exists "Users can read own winner proofs and admins can read all" on public.winner_proofs;
create policy "Users can read own winner proofs and admins can read all"
on public.winner_proofs
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can insert own winner proofs" on public.winner_proofs;
create policy "Users can insert own winner proofs"
on public.winner_proofs
for insert
with check (auth.uid() = user_id);

drop policy if exists "Admins can update winner proofs" on public.winner_proofs;
create policy "Admins can update winner proofs"
on public.winner_proofs
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete winner proofs" on public.winner_proofs;
create policy "Admins can delete winner proofs"
on public.winner_proofs
for delete
using (public.is_admin(auth.uid()));

drop policy if exists "Authenticated users can read prize pool config" on public.prize_pool_config;
create policy "Authenticated users can read prize pool config"
on public.prize_pool_config
for select
using (auth.role() = 'authenticated');

drop policy if exists "Admins can insert prize pool config" on public.prize_pool_config;
create policy "Admins can insert prize pool config"
on public.prize_pool_config
for insert
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update prize pool config" on public.prize_pool_config;
create policy "Admins can update prize pool config"
on public.prize_pool_config
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete prize pool config" on public.prize_pool_config;
create policy "Admins can delete prize pool config"
on public.prize_pool_config
for delete
using (public.is_admin(auth.uid()));

create index if not exists users_email_idx on public.users (email);
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);
create index if not exists golf_scores_user_id_date_idx on public.golf_scores (user_id, date desc);
create index if not exists charities_is_featured_idx on public.charities (is_featured);
create index if not exists user_charity_user_id_idx on public.user_charity (user_id);
create index if not exists user_charity_charity_id_idx on public.user_charity (charity_id);
create index if not exists draws_month_year_idx on public.draws (month, year);
create index if not exists draws_status_idx on public.draws (status);
create index if not exists draw_results_draw_id_idx on public.draw_results (draw_id);
create index if not exists draw_results_winner_user_id_idx on public.draw_results (winner_user_id);
create index if not exists winner_proofs_draw_result_id_idx on public.winner_proofs (draw_result_id);
create index if not exists winner_proofs_user_id_idx on public.winner_proofs (user_id);
create index if not exists prize_pool_config_draw_id_idx on public.prize_pool_config (draw_id);

-- Force constraint updates for existing tables
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.golf_scores DROP CONSTRAINT IF EXISTS golf_scores_user_id_fkey;
ALTER TABLE public.golf_scores ADD CONSTRAINT golf_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_charity DROP CONSTRAINT IF EXISTS user_charity_user_id_fkey;
ALTER TABLE public.user_charity ADD CONSTRAINT user_charity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.draw_results DROP CONSTRAINT IF EXISTS draw_results_winner_user_id_fkey;
ALTER TABLE public.draw_results ADD CONSTRAINT draw_results_winner_user_id_fkey FOREIGN KEY (winner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.winner_proofs DROP CONSTRAINT IF EXISTS winner_proofs_user_id_fkey;
ALTER TABLE public.winner_proofs ADD CONSTRAINT winner_proofs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;




