import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Inbox, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { OfferRow, TravelRequestRow } from "@/lib/marketplace";

export const metadata: Metadata = { title: "Dashboard — Roamly" };

export default async function Dashboard() {
  const user = await requireUser();
  if (user.role === "provider")
    return <ProviderDashboard userId={user.id} userName={user.display_name} />;
  return <TravelerDashboard userId={user.id} userName={user.display_name} />;
}

async function TravelerDashboard({
  userId,
  userName,
}: {
  userId: string;
  userName: string | null;
}) {
  const { data: requests } = await supabaseAdmin
    .from("travel_requests")
    .select("*")
    .eq("traveler_id", userId)
    .order("created_at", { ascending: false });

  const requestList = requests ?? [];
  const requestIds = requestList.map((r) => r.id);

  // Offer counts + recent offers across all my requests.
  const counts = new Map<string, number>();
  let recentOffers: (OfferRow & { request: TravelRequestRow | null })[] = [];

  if (requestIds.length > 0) {
    const { data: offers } = await supabaseAdmin
      .from("offers")
      .select("*")
      .in("request_id", requestIds)
      .order("created_at", { ascending: false })
      .limit(20);
    offers?.forEach((o) => counts.set(o.request_id, (counts.get(o.request_id) ?? 0) + 1));

    const requestById = new Map(requestList.map((r) => [r.id, r]));
    recentOffers =
      offers?.slice(0, 6).map((o) => ({ ...o, request: requestById.get(o.request_id) ?? null })) ??
      [];
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-semibold mb-2">
          Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mb-8">Post a trip and let providers compete for it.</p>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-display text-2xl font-semibold">My trip requests</h2>
            <Button size="sm" asChild>
              <Link href="/requests/new">
                <Plus className="h-4 w-4 mr-1" />
                New request
              </Link>
            </Button>
          </div>
          {requestList.length === 0 ? (
            <EmptyState
              title="You haven't posted any trips yet."
              body="Post your first request — providers send tailored offers within hours."
              actionHref="/requests/new"
              actionLabel="Post a trip request"
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requestList.map((r) => (
                <RequestCard key={r.id} r={{ ...r, offers_count: counts.get(r.id) ?? 0 }} />
              ))}
            </div>
          )}
        </section>

        {recentOffers.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">Recent offers received</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {recentOffers.map((o) => (
                <Link
                  key={o.id}
                  href={`/requests/${o.request_id}`}
                  className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-display text-lg font-semibold">{o.title}</h3>
                    <span
                      className={`text-xs rounded-full px-2 py-1 capitalize ${
                        o.status === "accepted"
                          ? "bg-success/15 text-success"
                          : o.status === "rejected"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-secondary"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {o.request?.flexible_destination ? "Flexible" : (o.request?.destination ?? "—")}
                    {o.request && ` • ${format(new Date(o.request.date_start), "MMM d")}`}
                  </p>
                  <p className="text-primary font-semibold mt-2">
                    {o.currency} {o.price_total.toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

async function ProviderDashboard({
  userId,
  userName,
}: {
  userId: string;
  userName: string | null;
}) {
  const { data: offers } = await supabaseAdmin
    .from("offers")
    .select("*")
    .eq("provider_id", userId)
    .order("created_at", { ascending: false });

  const offerList = offers ?? [];
  const requestIds = [...new Set(offerList.map((o) => o.request_id))];

  let requestById = new Map<string, TravelRequestRow>();
  if (requestIds.length > 0) {
    const { data: requests } = await supabaseAdmin
      .from("travel_requests")
      .select("*")
      .in("id", requestIds);
    requestById = new Map((requests ?? []).map((r) => [r.id, r]));
  }

  const accepted = offerList.filter((o) => o.status === "accepted").length;
  const pending = offerList.filter((o) => o.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-semibold mb-2">
          Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mb-8">Browse open requests and send tailored offers.</p>

        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          <Stat label="Pending offers" value={pending} />
          <Stat label="Accepted" value={accepted} accent />
          <Stat label="Total submitted" value={offerList.length} />
        </div>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-display text-2xl font-semibold">My offers</h2>
            <Button size="sm" asChild>
              <Link href="/requests">
                <Inbox className="h-4 w-4 mr-1" />
                Browse requests
              </Link>
            </Button>
          </div>

          {offerList.length === 0 ? (
            <EmptyState
              title="You haven't sent any offers yet."
              body="Browse open requests and send your first tailored offer."
              actionHref="/requests"
              actionLabel="Browse open requests"
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {offerList.map((o) => {
                const req = requestById.get(o.request_id);
                return (
                  <Link
                    key={o.id}
                    href={`/requests/${o.request_id}`}
                    className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-display text-lg font-semibold">{o.title}</h3>
                      <span
                        className={`text-xs rounded-full px-2 py-1 capitalize ${
                          o.status === "accepted"
                            ? "bg-success/15 text-success"
                            : o.status === "rejected"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-secondary"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    {req && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {req.flexible_destination ? "Flexible" : req.destination} •{" "}
                        {format(new Date(req.date_start), "MMM d")}
                      </p>
                    )}
                    <p className="text-primary font-semibold mt-2">
                      {o.currency} {o.price_total.toLocaleString()}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`font-display text-3xl font-semibold mt-1 ${
          accent ? "text-success" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <p className="font-display text-lg font-semibold mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-4">{body}</p>
      <Button asChild>
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
