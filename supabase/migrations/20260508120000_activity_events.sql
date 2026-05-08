-- Roamly: activity_events table for internal analytics / BI.
-- Captures mutations + page views with typed columns + jsonb metadata.
-- All writes go through src/lib/activity.ts (logEvent).
-- Reads happen as service role from Supabase Studio / SQL editor.

create type public.activity_event_type as enum (
  -- auth
  'user_signed_up',
  'user_signed_in',
  'user_signed_out',
  -- traveler
  'request_created',
  'offer_accepted',
  -- provider
  'offer_submitted',
  -- both
  'profile_updated',
  -- page views (router navigation)
  'page_viewed'
);

create table public.activity_events (
  id            uuid primary key default gen_random_uuid(),
  event_type    public.activity_event_type not null,
  actor_id      uuid references public.profiles(id) on delete set null,
  actor_role    public.user_role,
  target_type   text,
  target_id     uuid,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index idx_activity_events_created_at  on public.activity_events (created_at desc);
create index idx_activity_events_actor       on public.activity_events (actor_id, created_at desc);
create index idx_activity_events_event_type  on public.activity_events (event_type, created_at desc);
create index idx_activity_events_target      on public.activity_events (target_type, target_id);
create index idx_activity_events_metadata    on public.activity_events using gin (metadata);

-- Lock down: no policies = no client access. Service role bypasses RLS for inserts.
alter table public.activity_events enable row level security;
