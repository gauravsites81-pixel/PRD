insert into public.charities (name, description, image_url, events, is_featured)
values
  (
    'Golf Foundation',
    'UK charity helping young people from all backgrounds build confidence, resilience, and life skills through golf.',
    'https://www.golf-foundation.org/wp-content/uploads/2023/01/Golf-Foundation-logo.png',
    '[{"name":"Junior Golf Sixes","type":"youth_golf"},{"name":"Unleash Your Drive","type":"schools_programme"}]'::jsonb,
    true
  ),
  (
    'On Course Foundation',
    'UK-based charity supporting wounded, injured, and sick service personnel and veterans through golf and employment pathways.',
    'https://www.oncoursefoundation.com/wp-content/uploads/2022/03/OCF-logo.png',
    '[{"name":"Golf Skills Events","type":"veterans_support"},{"name":"Employment Programme","type":"career_support"}]'::jsonb,
    false
  ),
  (
    'The Golf Trust',
    'Charity using golf to improve wellbeing, inclusion, and access for people with disabilities and long-term health conditions.',
    'https://www.thegolftrust.com/wp-content/uploads/2020/07/the-golf-trust-logo.png',
    '[{"name":"Inclusive Golf Sessions","type":"accessibility"},{"name":"Community Golf Days","type":"community"}]'::jsonb,
    false
  )
on conflict do nothing;

-- Placeholder admin profile. Replace this UUID with the actual auth.users.id
-- created via the Supabase dashboard before running this seed in production.
insert into public.users (id, email, full_name, role)
values (
  '00000000-0000-0000-0000-000000000001',
  'admin@example.com',
  'Initial Admin',
  'admin'
)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = 'admin';
