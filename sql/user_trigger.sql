-- Fix missing DB Trigger for user provisioning

-- 1. Ensure the handle_new_user function exists
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

-- 2. Drop and recreate the trigger to ensure it listens to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- You can copy and paste this into the Supabase SQL Editor.
