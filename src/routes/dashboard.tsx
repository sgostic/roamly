import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { MOCK_REQUESTS, MOCK_OFFERS } from "@/lib/marketplace";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Roamly" }] }),
  component: Dashboard,
});

function Dashboard() {
  const myRequests = MOCK_REQUESTS.slice(0, 2).map((r) => ({ ...r, offers_count: MOCK_OFFERS[r.id]?.length ?? 0 }));
  const myOffers = [
    { id: "o1", request_id: "r1", title: "7 nights at Caldera Suites + sunset cruise", destination: "Santorini, Greece", date_start: "2026-06-12", price_total: 2450, currency: "USD", status: "pending" as const },
    { id: "o6", request_id: "r3", title: "Tokyo + Kyoto cultural immersion", destination: "Tokyo, Japan", date_start: "2026-09-05", price_total: 3100, currency: "USD", status: "pending" as const },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-semibold mb-8">Your dashboard</h1>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-display text-2xl font-semibold">My trip requests</h2>
            <Link to="/requests/new"><Button size="sm">New request</Button></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRequests.map((r) => <RequestCard key={r.id} r={r} />)}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">My offers (as provider)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {myOffers.map((o) => (
              <Link to="/requests/$id" params={{ id: o.request_id }} key={o.id} className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-display text-lg font-semibold">{o.title}</h3>
                  <span className="text-xs rounded-full px-2 py-1 bg-secondary capitalize">{o.status}</span>
                </div>
                <p className="text-sm text-muted-foreground">For: {o.destination} • {format(new Date(o.date_start), "MMM d")}</p>
                <p className="text-primary font-semibold mt-2">{o.currency} {o.price_total.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
