# Reverse Travel Marketplace — MVP Plan

A bidding-style travel marketplace. Travelers post a trip request; providers submit competing offers; traveler compares and accepts one.

## Scope (v1)

- Email/password + Google auth
- Two roles on a single account: Traveler & Provider (toggle)
- Create / browse travel requests
- Submit / view offers
- Side-by-side offer comparison
- Accept one offer → request closes
- Clean, modern Airbnb/Booking-style UI, mobile-first

Deferred: chat, notifications, reviews, payments, AI suggestions.

## Pages / Routes

```text
/                      Landing (hero, how it works, CTAs)
/auth                  Login / Signup (email + Google)
/requests              Browse open requests (provider view)
/requests/new          Traveler: create a travel request
/requests/$id          Request detail + offers list + compare + accept
/dashboard             My requests (traveler) + my offers (provider)
/offers/new/$reqId     Provider: submit offer for a request
/profile               Edit profile, switch active role
```

## Data Model (Lovable Cloud)

- `profiles` — id (FK auth.users), display_name, avatar_url, bio, is_provider, company_name
- `travel_requests` — id, traveler_id, destination (text, nullable for flexible), flexible_destination (bool), date_start, date_end, budget_min, budget_max, travelers_count, preferences (text[]: luxury, budget, family, nightlife, adventure, etc.), notes, status (open/closed/expired), expires_at, created_at
- `offers` — id, request_id, provider_id, title, price_total, currency, accommodation, included_services (text[]), photos (text[]), description, expires_at, status (pending/accepted/rejected/withdrawn), created_at
- `user_roles` — id, user_id, role enum('traveler','provider','admin') — separate table per security best practice; `has_role()` SECURITY DEFINER function

RLS:

- profiles: anyone read, owner update
- travel_requests: anyone read open ones; owner full control
- offers: provider sees own; request owner sees all on their request; provider creates if has 'provider' role
- Accept offer: server function marks one offer accepted, others rejected, request closed

## Key UI Components

- `RequestCard` — destination, dates, budget, traveler count, preference chips
- `OfferCard` — photos, price, what's included, provider info, expiry
- `OfferComparisonTable` — pick 2–4 offers, side-by-side rows (price, accommodation, services, dates)
- `PreferenceChips` — multi-select preference tags
- `BudgetRangeSlider`
- `DateRangePicker` (shadcn calendar)
- Role badge / role switch in profile

## Storage

- One public bucket `offer-photos` for provider-uploaded images
- RLS: providers upload to their own folder; public read

## Design Direction

- Light, airy, Booking/Airbnb-inspired
- Soft neutrals + a single warm accent (coral/teal) — defined as `oklch` semantic tokens in `src/styles.css`
- Card-heavy layout, generous whitespace, big imagery in offers
- Mobile-first; comparison view collapses to stacked cards on small screens
- Distinctive type pairing (display serif for headings + clean sans for body) to avoid generic SaaS look

## Build Order

1. Enable Lovable Cloud, set up schema + RLS + storage bucket + roles table
2. Auth (email + Google) + profile + role switch
3. Landing page + design tokens
4. Traveler: create request, dashboard list, request detail
5. Provider: browse requests, submit offer, my offers
6. Offer comparison + accept flow (server function)
7. Polish: empty states, mobile QA, expiration handling

## Technical Notes

- Use `createServerFn` + `requireSupabaseAuth` middleware for all mutations (create request, submit offer, accept offer)
- Accept offer = transactional server function: set chosen offer to 'accepted', other offers to 'rejected', request to 'closed'
- Expiration handled lazily: server function filters/marks `expires_at < now()` as expired on read
- File-based routes under `src/routes/`, separate files per page (no hash anchors)
- Roles checked via `has_role(auth.uid(), 'provider')` in RLS, never client-side
