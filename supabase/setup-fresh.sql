-- ============================================================================
-- Roamly: fresh Supabase setup. Paste this whole file into the Supabase
-- Dashboard -> SQL Editor and run once. Idempotent — safe to re-run.
-- Result: final schema + RLS + storage bucket + accept_offer RPC + demo seed.
-- ============================================================================

-- 1. Enums --------------------------------------------------------------------
do $$ begin
  create type public.user_role     as enum ('traveler', 'provider');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('open', 'closed', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.offer_status   as enum ('pending', 'accepted', 'rejected', 'withdrawn');
exception when duplicate_object then null; end $$;


-- 2. Helpers ------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;


-- 3. Tables -------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  email         text,
  display_name  text,
  avatar_url    text,
  bio           text,
  company_name  text,
  role          public.user_role not null default 'traveler',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists profiles_email_key
  on public.profiles(email) where email is not null;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table if not exists public.travel_requests (
  id                   uuid primary key default gen_random_uuid(),
  traveler_id          uuid not null references public.profiles(id) on delete cascade,
  destination          text,
  flexible_destination boolean not null default false,
  date_start           date not null,
  date_end             date not null,
  budget_min           numeric(10,2) not null,
  budget_max           numeric(10,2) not null,
  currency             text not null default 'USD',
  travelers_count      int  not null default 1,
  preferences          text[] not null default '{}',
  notes                text,
  status               public.request_status not null default 'open',
  expires_at           timestamptz not null default (now() + interval '14 days'),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists travel_requests_updated_at on public.travel_requests;
create trigger travel_requests_updated_at before update on public.travel_requests
  for each row execute function public.set_updated_at();

create table if not exists public.offers (
  id                  uuid primary key default gen_random_uuid(),
  request_id          uuid not null references public.travel_requests(id) on delete cascade,
  provider_id         uuid not null references public.profiles(id) on delete cascade,
  title               text not null,
  price_total         numeric(10,2) not null,
  currency            text not null default 'USD',
  accommodation       text,
  included_services   text[] not null default '{}',
  photos              text[] not null default '{}',
  description         text,
  expires_at          timestamptz not null default (now() + interval '7 days'),
  status              public.offer_status not null default 'pending',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists offers_updated_at on public.offers;
create trigger offers_updated_at before update on public.offers
  for each row execute function public.set_updated_at();


-- 4. Indexes ------------------------------------------------------------------
create index if not exists idx_offers_request          on public.offers(request_id);
create index if not exists idx_requests_status         on public.travel_requests(status);
create index if not exists idx_requests_expires_open
  on public.travel_requests(expires_at) where status = 'open';
create index if not exists idx_offers_expires_pending
  on public.offers(expires_at) where status = 'pending';


-- 5. Transactional accept_offer RPC ------------------------------------------
create or replace function public.accept_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
begin
  select request_id into v_request_id from public.offers where id = p_offer_id;
  if v_request_id is null then
    raise exception 'Offer not found' using errcode = 'P0002';
  end if;

  update public.offers
    set status = 'accepted'
    where id = p_offer_id;

  update public.offers
    set status = 'rejected'
    where request_id = v_request_id and id <> p_offer_id and status = 'pending';

  update public.travel_requests
    set status = 'closed'
    where id = v_request_id;
end;
$$;

revoke execute on function public.accept_offer(uuid) from public, anon, authenticated;


-- 6. RLS ----------------------------------------------------------------------
-- Note: this app currently uses service-role queries (mock auth), so these
-- policies are dormant. They activate when real Supabase Auth is wired and
-- profiles.id is re-linked to auth.users.id.

alter table public.profiles        enable row level security;
alter table public.travel_requests enable row level security;
alter table public.offers          enable row level security;

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Open requests viewable by all authenticated" on public.travel_requests;
create policy "Open requests viewable by all authenticated"
  on public.travel_requests for select to authenticated
  using (status = 'open' or auth.uid() = traveler_id);

drop policy if exists "Travelers create own requests" on public.travel_requests;
create policy "Travelers create own requests"
  on public.travel_requests for insert to authenticated
  with check (
    auth.uid() = traveler_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'traveler')
  );

drop policy if exists "Travelers update own requests" on public.travel_requests;
create policy "Travelers update own requests"
  on public.travel_requests for update to authenticated using (auth.uid() = traveler_id);

drop policy if exists "Travelers delete own requests" on public.travel_requests;
create policy "Travelers delete own requests"
  on public.travel_requests for delete to authenticated using (auth.uid() = traveler_id);

drop policy if exists "Provider sees own offers" on public.offers;
create policy "Provider sees own offers"
  on public.offers for select to authenticated using (auth.uid() = provider_id);

drop policy if exists "Request owner sees offers on their request" on public.offers;
create policy "Request owner sees offers on their request"
  on public.offers for select to authenticated
  using (exists (
    select 1 from public.travel_requests r
    where r.id = request_id and r.traveler_id = auth.uid()
  ));

drop policy if exists "Providers create offers" on public.offers;
create policy "Providers create offers"
  on public.offers for insert to authenticated
  with check (
    auth.uid() = provider_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'provider')
  );

drop policy if exists "Providers update own offers" on public.offers;
create policy "Providers update own offers"
  on public.offers for update to authenticated using (auth.uid() = provider_id);

drop policy if exists "Request owner can update offer status" on public.offers;
create policy "Request owner can update offer status"
  on public.offers for update to authenticated
  using (exists (
    select 1 from public.travel_requests r
    where r.id = request_id and r.traveler_id = auth.uid()
  ));


-- 7. Storage bucket -----------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('offer-photos', 'offer-photos', true)
on conflict (id) do nothing;

drop policy if exists "Providers upload to own folder"  on storage.objects;
create policy "Providers upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'offer-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Providers update own photos" on storage.objects;
create policy "Providers update own photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'offer-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Providers delete own photos" on storage.objects;
create policy "Providers delete own photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'offer-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- 8. Demo seed (safe to re-run) -----------------------------------------------
-- Travelers
insert into public.profiles (id, email, display_name, role, bio) values
  ('11111111-1111-1111-1111-000000000001', 'alex@demo.com',   'Alex Morgan',  'traveler', 'Anniversary trip planner. Loves boutique stays.'),
  ('11111111-1111-1111-1111-000000000002', 'jordan@demo.com', 'Jordan Kim',   'traveler', 'First-time traveler to Asia. Foodie at heart.'),
  ('11111111-1111-1111-1111-000000000003', 'sam@demo.com',    'Sam Hayes',    'traveler', 'Adventurer + city explorer.')
on conflict (id) do nothing;

-- Providers
insert into public.profiles (id, email, display_name, role, company_name, bio) values
  ('22222222-2222-2222-2222-000000000001', 'helena@demo.com', 'Helena Pappas', 'provider', 'Aegean Boutique Travel', 'Specialist in Greek island getaways.'),
  ('22222222-2222-2222-2222-000000000002', 'nikos@demo.com',  'Nikos Travels', 'provider', 'Cyclades & Co.',         'Cyclades local with 12 years guiding visitors.'),
  ('22222222-2222-2222-2222-000000000003', 'marina@demo.com', 'Marina Atlas',  'provider', 'Atlas Private Villas',   'Curated cliffside villas with private chefs.'),
  ('22222222-2222-2222-2222-000000000004', 'lukas@demo.com',  'Lukas Berger',  'provider', 'Alpine Family Trips',    'Family-friendly Alpine adventures.'),
  ('22222222-2222-2222-2222-000000000005', 'sofia@demo.com',  'Sofía Ramírez', 'provider', 'Pura Vida Family',       'Wildlife-rich Costa Rica trips for families.'),
  ('22222222-2222-2222-2222-000000000006', 'yuki@demo.com',   'Yuki Tanaka',   'provider', 'Sakura Trails',          'Bilingual Tokyo + Kyoto cultural specialist.')
on conflict (id) do nothing;

-- Travel requests
insert into public.travel_requests (
  id, traveler_id, destination, flexible_destination,
  date_start, date_end, budget_min, budget_max, currency,
  travelers_count, preferences, notes, status, expires_at, created_at
) values
  ('33333333-3333-3333-3333-000000000001', '11111111-1111-1111-1111-000000000001',
   'Santorini, Greece', false,
   '2026-06-12', '2026-06-19', 1800, 2800, 'USD',
   2, array['Romantic','Beach','Foodie'],
   'Anniversary trip. Looking for a quiet boutique stay near the caldera with sunset views.',
   'open', '2027-12-31', '2026-05-01'),

  ('33333333-3333-3333-3333-000000000002', '11111111-1111-1111-1111-000000000001',
   null, true,
   '2026-07-20', '2026-07-30', 3500, 5000, 'USD',
   4, array['Family-friendly','Adventure','Nature'],
   'Family with two kids (8 and 11). Open to anywhere with hiking, lakes, fun for kids.',
   'open', '2027-12-31', '2026-04-28'),

  ('33333333-3333-3333-3333-000000000003', '11111111-1111-1111-1111-000000000002',
   'Tokyo, Japan', false,
   '2026-09-05', '2026-09-15', 2500, 4000, 'USD',
   2, array['Culture','Foodie','City'],
   'First time in Japan. Want to mix Tokyo with a side trip to Kyoto.',
   'open', '2027-12-31', '2026-04-25'),

  ('33333333-3333-3333-3333-000000000004', '11111111-1111-1111-1111-000000000002',
   'Bali, Indonesia', false,
   '2026-08-01', '2026-08-14', 1200, 2000, 'USD',
   1, array['Wellness','Beach','Budget'],
   'Solo retreat. Yoga, surf, healthy food.',
   'open', '2027-12-31', '2026-04-20'),

  ('33333333-3333-3333-3333-000000000005', '11111111-1111-1111-1111-000000000003',
   'Reykjavík, Iceland', false,
   '2026-11-10', '2026-11-17', 2200, 3200, 'USD',
   2, array['Adventure','Nature'],
   'Northern lights, glacier hike, hot springs.',
   'open', '2027-12-31', '2026-04-15'),

  ('33333333-3333-3333-3333-000000000006', '11111111-1111-1111-1111-000000000003',
   'Lisbon, Portugal', false,
   '2026-05-25', '2026-06-01', 1500, 2200, 'USD',
   3, array['City','Foodie','Nightlife'],
   'Friends trip. Want a lively neighborhood and great restaurants.',
   'open', '2027-12-31', '2026-04-10')
on conflict (id) do nothing;

-- Offers
insert into public.offers (
  id, request_id, provider_id, title, price_total, currency,
  accommodation, included_services, photos, description,
  status, expires_at, created_at
) values
  ('44444444-4444-4444-4444-000000000001',
   '33333333-3333-3333-3333-000000000001', '22222222-2222-2222-2222-000000000001',
   '7 nights at Caldera Suites + sunset cruise', 2450, 'USD',
   'Caldera Suites — Caldera-view room, private terrace',
   array['Transfers','Breakfast','Tours'],
   array[
     'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
     'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=800&q=80'
   ],
   'Our signature Santorini package: 7 nights in Oia with caldera views, private airport transfers, daily breakfast, and a private sunset catamaran cruise with dinner.',
   'pending', '2027-12-31', '2026-05-02'),

  ('44444444-4444-4444-4444-000000000002',
   '33333333-3333-3333-3333-000000000001', '22222222-2222-2222-2222-000000000002',
   'Boutique stay in Imerovigli + winery tour', 2180, 'USD',
   'Sun Rocks Hotel — Junior suite with plunge pool',
   array['Breakfast','Tours'],
   array['https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?auto=format&fit=crop&w=800&q=80'],
   'Quieter Imerovigli base with one of the best caldera panoramas. Includes a half-day Santo Wines tasting tour.',
   'pending', '2027-12-31', '2026-05-03'),

  ('44444444-4444-4444-4444-000000000003',
   '33333333-3333-3333-3333-000000000001', '22222222-2222-2222-2222-000000000003',
   'Luxury cliffside villa, fully private', 2780, 'USD',
   'Private 1-bedroom villa in Oia with infinity pool',
   array['Transfers','Breakfast','All meals'],
   array['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
   'Exclusive standalone villa with a heated infinity pool right on the cliff. In-villa chef on three evenings.',
   'pending', '2027-12-31', '2026-05-04'),

  ('44444444-4444-4444-4444-000000000004',
   '33333333-3333-3333-3333-000000000002', '22222222-2222-2222-2222-000000000004',
   '10 days in the Swiss Alps for the family', 4600, 'USD',
   'Family chalet in Interlaken, 3 bedrooms',
   array['Car rental','Breakfast','Tours'],
   array['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'],
   'Lakes, hiking, kid-safe via ferrata, and a day at a wildlife park.',
   'pending', '2027-12-31', '2026-04-30'),

  ('44444444-4444-4444-4444-000000000005',
   '33333333-3333-3333-3333-000000000002', '22222222-2222-2222-2222-000000000005',
   'Costa Rica adventure & wildlife (10 days)', 4200, 'USD',
   'Eco-lodges in Arenal + Manuel Antonio',
   array['Transfers','Breakfast','Tours','Guide'],
   array['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80'],
   'Volcano hike, sloth & monkey spotting, beach time. Designed for kids 6–12.',
   'pending', '2027-12-31', '2026-05-01'),

  ('44444444-4444-4444-4444-000000000006',
   '33333333-3333-3333-3333-000000000003', '22222222-2222-2222-2222-000000000006',
   'Tokyo + Kyoto cultural immersion', 3100, 'USD',
   'Boutique hotel Shibuya + ryokan in Higashiyama',
   array['Transfers','Tours','Guide'],
   array['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
   'Mixed modern Tokyo + traditional Kyoto. Includes JR pass and tea ceremony.',
   'pending', '2027-12-31', '2026-04-27')
on conflict (id) do nothing;

-- Done. ----------------------------------------------------------------------
