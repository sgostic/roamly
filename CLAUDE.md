# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Roamly" — a reverse travel marketplace (travelers post trip requests, providers submit competing offers, traveler compares and accepts one). See `.lovable/plan.md` for the full product/data-model spec.

## Stack

- **Next.js 15** (App Router, React 19) deployed on **Vercel**
- **Tailwind v4** (CSS-first, `@tailwindcss/postcss`, tokens in `src/app/globals.css`)
- **shadcn/ui** (new-york style) in `src/components/ui/` — see `components.json`
- **Supabase** for auth, Postgres, and storage
- **Bun** is the package manager (`bun.lock` present); npm also works

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

## Routing

File-based App Router under `src/app/`:

| Path | File |
|---|---|
| `/` | `src/app/page.tsx` — Server Component |
| `/auth` | `src/app/auth/page.tsx` — Client Component |
| `/dashboard` | `src/app/dashboard/page.tsx` — Server Component |
| `/requests` | `src/app/requests/page.tsx` — Server Component |
| `/requests/new` | `src/app/requests/new/page.tsx` — Client Component |
| `/requests/[id]` | `src/app/requests/[id]/page.tsx` — Client Component |
| `/offers/new/[reqId]` | `src/app/offers/new/[reqId]/page.tsx` — Client Component |
| `/profile` | `src/app/profile/page.tsx` — Client Component |

Pages with state/hooks are Client Components (`"use client"`). Pages that only render data are Server Components. The `Header` component is a Client Component (uses `useRouter`). `RequestCard` is a Server Component.

For route params in Client Components, use `useParams()` from `next/navigation`. For navigation, use `useRouter()` from `next/navigation`.

## Supabase clients (three flavors — pick the right one)

| Import | Where | Auth context |
|---|---|---|
| `@/integrations/supabase/client` (`supabase`) | Client components & Server Components | Anon key, `NEXT_PUBLIC_*` env vars |
| `@/integrations/supabase/client.server` (`supabaseAdmin`) | Server Actions / Route Handlers only | **Service role** — bypasses RLS, never expose to client |
| `@/integrations/supabase/auth-middleware` (`requireSupabaseAuth`) | Server Actions | Reads `Authorization` header via `next/headers`; returns `{ supabase, userId, claims }` |

For mutations (create request, submit offer, accept offer), use Next.js **Server Actions** (`"use server"`) + `requireSupabaseAuth`. The accept-offer flow must be transactional: set chosen offer to `accepted`, others to `rejected`, request to `closed`.

## Environment variables

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser & SSR client (`client.ts`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser & SSR client (`client.ts`) |
| `SUPABASE_URL` | Server-only clients (`client.server.ts`, `auth-middleware.ts`) |
| `SUPABASE_PUBLISHABLE_KEY` | `auth-middleware.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | `client.server.ts` (bypasses RLS) |

`NEXT_PUBLIC_*` vars are inlined into the client bundle at build time. Non-prefixed vars are server-only. Add them to `.env.local` (gitignored) for local dev, or Vercel environment settings for production.

## Database & RLS

Schema in `supabase/migrations/`:

- `profiles` (1:1 with `auth.users`), `user_roles` (enum `traveler`/`provider`/`admin`), `travel_requests`, `offers`
- `handle_new_user()` trigger auto-creates a profile + `traveler` role on signup
- Role checks go through `has_role(uuid, app_role)` (SECURITY DEFINER) — used in RLS, never client-side
- Storage bucket `offer-photos` is public-read; providers upload into a folder named with their own `auth.uid()`

`src/integrations/supabase/types.ts` is auto-generated from the DB schema — don't hand-edit; regenerate with `supabase gen types typescript`.

## Mock data caveat

All routes currently render from `src/lib/marketplace.ts` (`MOCK_REQUESTS`, `MOCK_OFFERS`) instead of Supabase. The DB schema and clients are wired up but route-level queries haven't been migrated yet. When replacing mocks, use Server Components + Supabase client for reads, and Server Actions + `requireSupabaseAuth` for writes.

## Conventions

- **Path alias**: `@/*` → `src/*` (configured in `tsconfig.json`)
- **shadcn/ui**: add components with `npx shadcn@latest add <name>` — they land in `src/components/ui/` and use the `cn()` helper from `@/lib/utils`
- **Button + Link pattern**: use `<Button asChild><Link href="...">...</Link></Button>` — never wrap a `<Button>` inside a `<Link>` (invalid HTML: `<a><button>`)
- **Styling**: Tailwind v4 with `oklch` semantic tokens in `src/app/globals.css`. `font-display` (Fraunces, loaded via `next/font/google`) for headings, `font-sans` (Inter) for body
- **Toasts**: `sonner` (mounted in `src/app/layout.tsx`)
- **Forms**: `react-hook-form` + `zod` + `@hookform/resolvers` are installed; current routes use plain `useState` since they're mock-driven
- **Prettier**: `printWidth: 100`, double quotes, semis, trailing commas
