
-- Enums
create type public.app_role as enum ('traveler', 'provider', 'admin');
create type public.request_status as enum ('open', 'closed', 'expired');
create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view own roles"
  on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Users can self-assign provider/traveler role"
  on public.user_roles for insert to authenticated
  with check (auth.uid() = user_id and role in ('traveler','provider'));
create policy "Users can remove own non-admin roles"
  on public.user_roles for delete to authenticated
  using (auth.uid() = user_id and role in ('traveler','provider'));

-- Auto-create profile + traveler role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'traveler');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Travel requests
create table public.travel_requests (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references auth.users(id) on delete cascade,
  destination text,
  flexible_destination boolean not null default false,
  date_start date not null,
  date_end date not null,
  budget_min numeric(10,2) not null,
  budget_max numeric(10,2) not null,
  currency text not null default 'USD',
  travelers_count int not null default 1,
  preferences text[] not null default '{}',
  notes text,
  status public.request_status not null default 'open',
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.travel_requests enable row level security;

create trigger travel_requests_updated_at before update on public.travel_requests
  for each row execute function public.set_updated_at();

create policy "Open requests viewable by all authenticated"
  on public.travel_requests for select to authenticated
  using (status = 'open' or auth.uid() = traveler_id);
create policy "Travelers create own requests"
  on public.travel_requests for insert to authenticated
  with check (auth.uid() = traveler_id);
create policy "Travelers update own requests"
  on public.travel_requests for update to authenticated
  using (auth.uid() = traveler_id);
create policy "Travelers delete own requests"
  on public.travel_requests for delete to authenticated
  using (auth.uid() = traveler_id);

-- Offers
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.travel_requests(id) on delete cascade,
  provider_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  price_total numeric(10,2) not null,
  currency text not null default 'USD',
  accommodation text,
  included_services text[] not null default '{}',
  photos text[] not null default '{}',
  description text,
  expires_at timestamptz not null default (now() + interval '7 days'),
  status public.offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.offers enable row level security;

create trigger offers_updated_at before update on public.offers
  for each row execute function public.set_updated_at();

create policy "Provider sees own offers"
  on public.offers for select to authenticated
  using (auth.uid() = provider_id);
create policy "Request owner sees offers on their request"
  on public.offers for select to authenticated
  using (exists (select 1 from public.travel_requests r where r.id = request_id and r.traveler_id = auth.uid()));
create policy "Providers create offers"
  on public.offers for insert to authenticated
  with check (auth.uid() = provider_id and public.has_role(auth.uid(), 'provider'));
create policy "Providers update own offers"
  on public.offers for update to authenticated
  using (auth.uid() = provider_id);
create policy "Request owner can update offer status"
  on public.offers for update to authenticated
  using (exists (select 1 from public.travel_requests r where r.id = request_id and r.traveler_id = auth.uid()));

create index idx_offers_request on public.offers(request_id);
create index idx_requests_status on public.travel_requests(status);

-- Storage bucket for offer photos
insert into storage.buckets (id, name, public) values ('offer-photos','offer-photos', true);

create policy "Public read offer photos"
  on storage.objects for select to public
  using (bucket_id = 'offer-photos');
create policy "Providers upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'offer-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Providers update own photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'offer-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Providers delete own photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'offer-photos' and auth.uid()::text = (storage.foldername(name))[1]);
