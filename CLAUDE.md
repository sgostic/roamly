# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Roamly" — a reverse travel marketplace (travelers post trip requests, providers submit competing offers, traveler compares and accepts one). See `SPEC.md` for the canonical product spec and `.lovable/plan.md` for earlier design notes.

## Stack

- **Next.js 15** (App Router, React 19, Server Actions) deployed on **Vercel**
- **Tailwind v4** (CSS-first, `@tailwindcss/postcss`, tokens in `src/app/globals.css`)
- **shadcn/ui** (new-york style) in `src/components/ui/`
- **Supabase** for Postgres + storage. Auth is **mock** for now (cookie-based identity).
- **Bun** is the package manager

## Commands

```bash
bun install
bun run dev       # next dev
bun run build     # next build
bun run start     # next start (after build)
bun run lint      # eslint .
bun run format    # prettier --write .
```

No test runner is configured.

## Strict role separation (per SPEC.md)

Every account has exactly one role — `traveler` or `provider` — chosen at signup and **locked**. There is no UI to switch roles. The role lives on `profiles.role` (Postgres enum `user_role`). Enforcement layers:

- **Page-level**: `requireRole(role)` from `src/lib/auth.ts` redirects to `/dashboard` on mismatch. Used in `requests/new/page.tsx` (traveler-only), `offers/new/[reqId]/page.tsx` (provider-only), and inside `requests/[id]/page.tsx` (which redirects non-owner travelers and serves a different view to providers).
- **Action-level**: every mutation in `src/app/{auth,requests,offers,profile}/actions.ts` calls `requireRole(...)` first. Server Actions never trust the client to assert a role.
- **DB-level (future)**: RLS policies referencing `profiles.role` exist for documentation but are bypassed by `supabaseAdmin` (service role) today.

When adding new write paths, always start with `await requireRole(...)`.

## Mock auth model

Real Supabase Auth is intentionally not wired. Identity is a single `roamly-user-id` HttpOnly cookie holding a `profiles.id`. The migration also drops `profiles.id`'s FK to `auth.users` so profiles stand alone.

`src/lib/auth.ts` is the only thing that reads/writes that cookie. Use:

- `getCurrentUser()` — `null` if signed out, full profile row otherwise (Server Components, Server Actions).
- `requireUser()` — redirects to `/auth` if signed out.
- `requireRole('traveler' | 'provider')` — redirects to `/dashboard` on role mismatch.

Sign-in is email-only lookup (no password). Sign-up creates a `profiles` row and writes the cookie. The "Continue as demo traveler" button on `/auth` instant-logs-in as the seeded `alex@demo.com`.

When wiring real Supabase Auth later: re-add the `profiles.id → auth.users.id` FK, replace the cookie reads in `auth.ts` with `supabase.auth.getUser()`, and switch `supabaseAdmin` reads to RLS-aware queries via the user's JWT.

## Routing

File-based App Router under `src/app/`. All authenticated pages are Server Components that fetch via `supabaseAdmin`; forms are tiny Client Components calling Server Actions.

| Path                  | Visible to                                            | File                                                          |
| --------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| `/`                   | Public                                                | `src/app/page.tsx`                                            |
| `/auth`               | Signed-out (else redirects to `/dashboard`)           | `src/app/auth/page.tsx` + `AuthForm.tsx`                      |
| `/dashboard`          | Signed-in; role-aware (traveler view ≠ provider view) | `src/app/dashboard/page.tsx`                                  |
| `/profile`            | Signed-in; role badge is locked                       | `src/app/profile/page.tsx` + `ProfileForm.tsx`                |
| `/requests`           | Provider only (travelers redirect)                    | `src/app/requests/page.tsx`                                   |
| `/requests/[id]`      | Provider OR request-owning traveler                   | `src/app/requests/[id]/page.tsx` + `OffersSection.tsx`        |
| `/requests/new`       | Traveler only                                         | `src/app/requests/new/page.tsx` + `NewRequestForm.tsx`        |
| `/offers/new/[reqId]` | Provider only                                         | `src/app/offers/new/[reqId]/page.tsx` + `SubmitOfferForm.tsx` |

A non-owner traveler visiting `/requests/[id]` is redirected to `/dashboard` — competing offers are owner-only viewing.

## Server Actions

Every mutation lives next to the route that triggers it:

- `src/app/auth/actions.ts` — `signIn`, `signUp`, `signOut`, `signInAsDemo`
- `src/app/requests/actions.ts` — `createTravelRequest`
- `src/app/offers/actions.ts` — `submitOffer`, `acceptOffer`
- `src/app/profile/actions.ts` — `updateProfile`

Form actions follow the `useActionState` pattern: `(prev: ActionResult, formData: FormData) => Promise<ActionResult>` where `ActionResult = { error?: string; success?: boolean }`. Error strings render via `toast.error` (sonner) inside a `useEffect`. Success usually redirects.

`acceptOffer` is the only RPC: it calls the `accept_offer(uuid)` Postgres function for a transactional flip (chosen offer → accepted, peers → rejected, request → closed). Don't reproduce that logic in the app layer — always use the RPC.

## Mock Supabase fallback

When `SUPABASE_SERVICE_ROLE_KEY` is missing, `supabaseAdmin` automatically swaps to an in-memory mock (`src/integrations/supabase/mock-client.ts`). The mock seeds the same demo data as the SQL seed migration (`mock-data.ts`), supports the chainable query builder methods used by this app (`select`/`eq`/`gt`/`in`/`order`/`limit`/`single`/`maybeSingle`/`insert`/`update`), implements the `accept_offer` RPC, and stubs `storage.upload`/`getPublicUrl` to return `placehold.co` URLs.

State persists on `globalThis` so it survives Next.js dev HMR but resets on server restart. To switch to real Supabase, set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`; no code change needed. The console logs `[Supabase] ... using in-memory mock client` once at startup so it's clear which mode is active.

The mock query builder does **not** support PostgREST nested selects (e.g. `travel_requests!inner(...)`) — use two separate queries instead, as `acceptOffer` does. If you need joins for performance later, do them via two queries + `Map` join in app code.

## Database

Schema in `supabase/migrations/`:

- `20260507081214_*.sql` — initial schema (profiles, user_roles, travel_requests, offers, RLS, storage)
- `20260507081235_*.sql` — security hardening
- `20260507120000_role_separation_and_helpers.sql` — drops user_roles + has_role; adds `user_role` enum + `profiles.role` + `profiles.email`; adds `accept_offer()` RPC; re-points `travel_requests.traveler_id` and `offers.provider_id` FKs to `profiles`; drops the `profiles.id → auth.users` FK
- `20260507120100_seed_demo_data.sql` — 3 travelers, 6 providers, 6 requests, 6 offers with deterministic UUIDs

To apply migrations against the hosted Supabase project: paste the SQL into the Supabase Dashboard SQL editor in chronological order, or run `supabase db push` if the local CLI is linked.

`src/integrations/supabase/types.ts` is hand-maintained to match the schema (no `supabase gen types` step in CI). When you add or alter a column, edit `types.ts` to match.

## Photo upload

`submitOffer` uploads `File` objects from `formData.getAll('photos')` to the `offer-photos` bucket via `supabaseAdmin.storage` (service role). The client-side `SubmitOfferForm` keeps the chosen files in React state and ref-syncs them to a hidden `<input type="file" name="photos" multiple>` via `DataTransfer` so `FormData` picks them up on submit. Public URLs go into `offers.photos[]`.

Limits: 6 photos per offer, 5 MB each — defined in `src/app/offers/actions.ts`.

## Out of scope (intentionally not built)

Per the most recent scope decision (Core MVP), these SPEC features are deferred:

- Chat / in-app messaging
- Ratings & reviews
- Real-time notifications
- Smart matching beyond `WHERE status='open' AND expires_at > now()`
- Payment / Stripe — bookings happen out-of-band after accept

When picking these up, the `accept_offer` RPC is a good template for transactional flows.

## Conventions

- **Path alias**: `@/*` → `src/*`
- **Button + Link**: use `<Button asChild><Link href="...">…</Link></Button>` — never `<Link><Button>…</Button></Link>` (invalid HTML)
- **Async Header**: `src/components/Header.tsx` is `async` and reads `getCurrentUser()`. The sign-out is split into `SignOutButton.tsx` (Client) calling the `signOut` action.
- **Styling**: Tailwind v4 with `oklch` semantic tokens (`--primary` coral, `--accent` teal, `--success` green). `font-display` (Fraunces) for headings, `font-sans` (Inter) for body — both via `next/font/google` in the root layout.
- **Toasts**: `sonner`, mounted in `src/app/layout.tsx`.
- **Prettier**: `printWidth: 100`, double quotes, semis, trailing commas.
