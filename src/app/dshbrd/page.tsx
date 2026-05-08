import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireUser } from "@/lib/auth";
import type { ActivityEventRow } from "@/lib/marketplace";
import type { Database } from "@/integrations/supabase/types";

export const metadata: Metadata = { title: "Activity — Roamly" };
export const dynamic = "force-dynamic";

type EventType = Database["public"]["Enums"]["activity_event_type"];
type UserRole = Database["public"]["Enums"]["user_role"];

const EVENT_TYPES: EventType[] = [
  "user_signed_up",
  "user_signed_in",
  "user_signed_out",
  "request_created",
  "offer_submitted",
  "offer_accepted",
  "profile_updated",
  "page_viewed",
];

const PAGE_SIZE = 50;
const FETCH_CAP = 5000; // hard upper bound on rows pulled per request

type Search = Record<string, string | string[] | undefined>;

function asString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}
function asArray(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.length > 0) return [v];
  return [];
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseFilters(sp: Search) {
  const today = new Date();
  const sevenAgo = new Date();
  sevenAgo.setDate(today.getDate() - 7);

  const from = asString(sp.from) ?? isoDay(sevenAgo);
  const to = asString(sp.to) ?? isoDay(today);
  const eventTypes = asArray(sp.event_type).filter((t): t is EventType =>
    (EVENT_TYPES as string[]).includes(t),
  ) as EventType[];
  const actorRoleRaw = asString(sp.actor_role) ?? "any";
  const sort = asString(sp.sort) === "asc" ? "asc" : "desc";
  const pageRaw = Number(asString(sp.page) ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const search = asString(sp.q)?.trim() ?? "";

  return { from, to, eventTypes, actorRoleRaw, sort, page, search };
}

// Authorization: signed-in user; if ROAMLY_ADMIN_EMAILS is set (comma-separated),
// only those emails may view. If unset, any signed-in user is allowed (dev convenience).
function isAuthorized(email: string | null): boolean {
  const allowList = process.env.ROAMLY_ADMIN_EMAILS;
  if (!allowList) return true;
  if (!email) return false;
  const allowed = allowList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

export default async function ActivityDashboard({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser();
  if (!isAuthorized(user.email)) redirect("/dashboard");

  const sp = await searchParams;
  const { from, to, eventTypes, actorRoleRaw, sort, page, search } = parseFilters(sp);

  // Build the query. End-of-day for `to` so the range is inclusive.
  const fromIso = new Date(`${from}T00:00:00.000Z`).toISOString();
  const toIso = new Date(`${to}T23:59:59.999Z`).toISOString();

  let query = supabaseAdmin
    .from("activity_events")
    .select("*")
    .gte("created_at", fromIso)
    .lte("created_at", toIso);

  if (eventTypes.length > 0) {
    query = query.in("event_type", eventTypes);
  }
  if (actorRoleRaw === "traveler" || actorRoleRaw === "provider") {
    query = query.eq("actor_role", actorRoleRaw as UserRole);
  }
  // Note: `actor_role IS NULL` (anonymous) isn't expressible via the mock client's
  // .eq, so handle that case in app code below.

  query = query.order("created_at", { ascending: sort === "asc" }).limit(FETCH_CAP);

  const { data, error } = await query;
  let rows: ActivityEventRow[] = data ?? [];

  if (actorRoleRaw === "none") {
    rows = rows.filter((r) => r.actor_role == null);
  }

  // App-side text search across structured + metadata fields.
  if (search) {
    const needle = search.toLowerCase();
    rows = rows.filter((r) => {
      const meta = r.metadata as Record<string, unknown> | null;
      const haystacks: (string | null | undefined)[] = [
        r.actor_id,
        r.target_id,
        r.target_type,
        r.event_type,
        meta?.actor_email as string | undefined,
        meta?.actor_name as string | undefined,
        meta?.email as string | undefined,
        meta?.display_name as string | undefined,
        meta?.pathname as string | undefined,
        meta?.destination as string | undefined,
        meta?.title as string | undefined,
        meta?.company_name as string | undefined,
      ];
      return haystacks.some((s) => typeof s === "string" && s.toLowerCase().includes(needle));
    });
  }

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(pageStart, pageStart + PAGE_SIZE);

  // Build "preserve filters" param string (without page) for pagination links.
  const preservedParams = new URLSearchParams();
  preservedParams.set("from", from);
  preservedParams.set("to", to);
  if (sort !== "desc") preservedParams.set("sort", sort);
  if (actorRoleRaw !== "any") preservedParams.set("actor_role", actorRoleRaw);
  if (search) preservedParams.set("q", search);
  for (const t of eventTypes) preservedParams.append("event_type", t);

  const errorMsg = error?.message ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
          <div>
            <h1 className="font-display text-4xl font-semibold">Activity</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Internal BI view of platform events. Date range required; defaults to last 7 days.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{total.toLocaleString()}</span> events
            {total >= FETCH_CAP && " (capped)"}
          </p>
        </div>

        <FilterBar
          from={from}
          to={to}
          selectedTypes={eventTypes}
          actorRole={actorRoleRaw}
          sort={sort}
          search={search}
        />

        {errorMsg && (
          <p className="text-sm text-destructive border border-destructive/30 rounded-md p-3 mb-4">
            Query failed: {errorMsg}
          </p>
        )}

        <div className="rounded-2xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Time</TableHead>
                <TableHead className="w-44">Event</TableHead>
                <TableHead className="w-56">Actor</TableHead>
                <TableHead className="w-40">Target</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    No events match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((r) => <EventRow key={r.id} row={r} />)
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            preservedParams={preservedParams.toString()}
          />
        )}
      </main>
    </div>
  );
}

function FilterBar({
  from,
  to,
  selectedTypes,
  actorRole,
  sort,
  search,
}: {
  from: string;
  to: string;
  selectedTypes: EventType[];
  actorRole: string;
  sort: string;
  search: string;
}) {
  const selectedSet = new Set(selectedTypes);
  return (
    <form method="GET" action="/dshbrd" className="rounded-2xl border bg-card p-5 mb-6 grid gap-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="from" className="text-xs uppercase tracking-wide">
            From
          </Label>
          <Input id="from" type="date" name="from" defaultValue={from} required />
        </div>
        <div>
          <Label htmlFor="to" className="text-xs uppercase tracking-wide">
            To
          </Label>
          <Input id="to" type="date" name="to" defaultValue={to} required />
        </div>
        <div>
          <Label htmlFor="actor_role" className="text-xs uppercase tracking-wide">
            Actor role
          </Label>
          <select
            id="actor_role"
            name="actor_role"
            defaultValue={actorRole}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
          >
            <option value="any">Any</option>
            <option value="traveler">Traveler</option>
            <option value="provider">Provider</option>
            <option value="none">Anonymous (no role)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="sort" className="text-xs uppercase tracking-wide">
            Sort by time
          </Label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wide">Event types</Label>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
          {EVENT_TYPES.map((t) => (
            <label key={t} className="inline-flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="event_type"
                value={t}
                defaultChecked={selectedSet.has(t)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="font-mono text-xs">{t}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
        <div>
          <Label htmlFor="q" className="text-xs uppercase tracking-wide">
            Search (email, name, target id, pathname…)
          </Label>
          <Input id="q" type="search" name="q" defaultValue={search} placeholder="alex@demo.com" />
        </div>
        <Button type="submit">Apply filters</Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/dshbrd">Reset</Link>
        </Button>
      </div>
    </form>
  );
}

function EventRow({ row }: { row: ActivityEventRow }) {
  const meta = (row.metadata as Record<string, unknown> | null) ?? {};
  const actorEmail =
    (meta.actor_email as string | undefined) ?? (meta.email as string | undefined) ?? null;
  const actorName =
    (meta.actor_name as string | undefined) ?? (meta.display_name as string | undefined) ?? null;
  const actorRole = row.actor_role;

  return (
    <TableRow>
      <TableCell className="font-mono text-xs whitespace-nowrap">
        <div>{format(new Date(row.created_at), "yyyy-MM-dd HH:mm:ss")}</div>
        <div className="text-muted-foreground">{format(new Date(row.created_at), "EEE")}</div>
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs rounded-md bg-secondary px-2 py-1">
          {row.event_type}
        </span>
      </TableCell>
      <TableCell>
        {actorEmail || actorName ? (
          <div className="text-sm">
            {actorName && <div className="font-medium">{actorName}</div>}
            {actorEmail && (
              <div className="text-xs text-muted-foreground font-mono">{actorEmail}</div>
            )}
            {actorRole && (
              <span
                className={`inline-block mt-1 text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 ${
                  actorRole === "provider"
                    ? "bg-accent/10 text-accent"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {actorRole}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">anonymous</span>
        )}
      </TableCell>
      <TableCell className="text-xs">
        {row.target_type ? (
          <>
            <div className="font-mono">{row.target_type}</div>
            {row.target_id && (
              <div className="text-muted-foreground font-mono truncate max-w-[140px]">
                {row.target_id.slice(0, 8)}…
              </div>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
            {Object.keys(meta).length} fields
          </summary>
          <pre className="mt-2 bg-muted/50 rounded p-2 overflow-auto max-w-xl whitespace-pre-wrap break-all font-mono text-[11px]">
            {JSON.stringify(meta, null, 2)}
          </pre>
        </details>
      </TableCell>
    </TableRow>
  );
}

function Pagination({
  page,
  totalPages,
  preservedParams,
}: {
  page: number;
  totalPages: number;
  preservedParams: string;
}) {
  function href(p: number) {
    const sp = new URLSearchParams(preservedParams);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/dshbrd?${qs}` : "/dshbrd";
  }
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <p className="text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
          {page > 1 ? <Link href={href(page - 1)}>Previous</Link> : <span>Previous</span>}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          asChild={page < totalPages}
        >
          {page < totalPages ? <Link href={href(page + 1)}>Next</Link> : <span>Next</span>}
        </Button>
      </div>
    </div>
  );
}
