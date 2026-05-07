import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { RequestCard } from "@/components/RequestCard";
import type { TravelRequest, Offer } from "@/lib/marketplace";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Roamly" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, isProvider, refreshRoles } = useAuth();
  const nav = useNavigate();
  const [myRequests, setMyRequests] = useState<TravelRequest[]>([]);
  const [myOffers, setMyOffers] = useState<(Offer & { request?: TravelRequest })[]>([]);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: reqs } = await supabase.from("travel_requests").select("*").eq("traveler_id", user.id).order("created_at", { ascending: false });
      setMyRequests(reqs ?? []);
      if (isProvider) {
        const { data: offers } = await supabase.from("offers").select("*, request:travel_requests(*)").eq("provider_id", user.id).order("created_at", { ascending: false });
        setMyOffers((offers as any) ?? []);
      }
    })();
  }, [user, isProvider]);

  const becomeProvider = async () => {
    if (!user) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "provider" });
    if (error) toast.error(error.message);
    else { toast.success("You're now a provider! You can submit offers."); await refreshRoles(); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-semibold mb-8">Your dashboard</h1>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-semibold">My trip requests</h2>
            <Link to="/requests/new"><Button size="sm">New request</Button></Link>
          </div>
          {myRequests.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
              You haven't posted any requests yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRequests.map((r) => <RequestCard key={r.id} r={r} />)}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-semibold">My offers</h2>
            {!isProvider && <Button onClick={becomeProvider} variant="outline">Become a provider</Button>}
          </div>
          {!isProvider ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
              Become a provider to send offers and earn from travel requests.
            </div>
          ) : myOffers.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
              No offers yet. <Link className="text-primary underline" to="/requests">Browse open requests</Link>.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myOffers.map((o) => (
                <Link to="/requests/$id" params={{ id: o.request_id }} key={o.id} className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display text-lg font-semibold">{o.title}</h3>
                    <span className={`text-xs rounded-full px-2 py-1 ${o.status === "accepted" ? "bg-success/15 text-success" : o.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-secondary"}`}>{o.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">For: {o.request?.destination ?? "Flexible"} • {o.request && format(new Date(o.request.date_start), "MMM d")}</p>
                  <p className="text-primary font-semibold mt-2">{o.currency} {o.price_total}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
