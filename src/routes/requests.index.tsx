import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { RequestCard } from "@/components/RequestCard";
import type { TravelRequest } from "@/lib/marketplace";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/requests/")({
  head: () => ({ meta: [{ title: "Browse travel requests — Roamly" }] }),
  component: RequestsList,
});

function RequestsList() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<TravelRequest[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("travel_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      setItems(data ?? []);
      setBusy(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-semibold">Open trip requests</h1>
            <p className="text-muted-foreground mt-1">Find travelers looking for offers like yours.</p>
          </div>
          <Link to="/requests/new"><Button><Plus className="h-4 w-4 mr-1" />New request</Button></Link>
        </div>
        {busy ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <p className="text-muted-foreground">No open requests yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((r) => <RequestCard key={r.id} r={r} />)}
          </div>
        )}
      </main>
    </div>
  );
}
