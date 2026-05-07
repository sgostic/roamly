-- Roamly: switch to single-role-per-user, drop multi-role helpers,
-- decouple profiles from auth.users (mock-auth phase),
-- add transactional accept_offer + expiration indexes.

-- 1. Detach profiles from auth.users so mock auth can manage profiles directly.
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();

-- 2. Re-link travel_requests.traveler_id and offers.provider_id to profiles
--    instead of auth.users so referential integrity holds without real auth.
alter table public.travel_requests drop constraint if exists travel_requests_traveler_id_fkey;
alter table public.travel_requests
  add constraint travel_requests_traveler_id_fkey
  foreign key (traveler_id) references public.profiles(id) on delete cascade;

alter table public.offers drop constraint if exists offers_provider_id_fkey;
alter table public.offers
  add constraint offers_provider_id_fkey
  foreign key (provider_id) references public.profiles(id) on delete cascade;

-- 3. The auth-trigger pipeline used the multi-role table; rip it out.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 4. Replace user_roles table + has_role helper with a single role enum on profiles.
drop policy if exists "Providers create offers" on public.offers;
drop function if exists public.has_role(uuid, public.app_role);
drop table if exists public.user_roles;
drop type if exists public.app_role;

create type public.user_role as enum ('traveler', 'provider');

alter table public.profiles
  add column role public.user_role not null default 'traveler',
  add column email text;

create unique index profiles_email_key on public.profiles(email) where email is not null;

-- 5. Re-create the offer-create RLS policy without has_role().
create policy "Providers create offers"
  on public.offers for insert to authenticated
  with check (
    auth.uid() = provider_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'provider')
  );

-- 6. Transactional accept: chosen offer -> accepted, peers -> rejected, request -> closed.
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
    where request_id = v_request_id
      and id <> p_offer_id
      and status = 'pending';

  update public.travel_requests
    set status = 'closed'
    where id = v_request_id;
end;
$$;

revoke execute on function public.accept_offer(uuid) from public, anon, authenticated;

-- 7. Lazy-expiration indexes.
create index if not exists idx_requests_expires_open
  on public.travel_requests(expires_at) where status = 'open';

create index if not exists idx_offers_expires_pending
  on public.offers(expires_at) where status = 'pending';
