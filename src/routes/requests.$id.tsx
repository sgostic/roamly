import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { TravelRequest, Offer, Profile } from "@/lib/marketplace";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users, Wallet, Check, ScaleIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/requests/$id")({
  head: () => ({ meta: [{ title: "Request — Roamly" }] }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const { user, loading, isProvider } = useAuth();
  const nav = useNavigate();
  const [req, setReq] = useState<TravelRequest | null>(null);
  const [offers, setOffers] = useState<(Offer & { provider?: Profile })[]>([]);
  const [busy, setBusy] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const load = async () => {
    const { data: r } = await supabase.from("travel_requests").select("*").eq("id", id).single();
    setReq(r);
    const { data: o } = await supabase
      .from("offers")
      .select("*, provider:profiles!offers_provider_id_fkey(*)")
      .eq("request_id", id)
      .order("price_total");
    setOffers((o as any) ?? []);
    setBusy(false);
  };
  useEffect(() => { if (user) load(); }, [user, id]);

  if (busy || !req) return <div className="min-h-screen"><Header /><div className="container mx-auto p-10 text-muted-foreground">Loading…</div></div>;

  const isOwner = user?.id === req.traveler_id;
  const toggleCompare = (oid: string) =>
    setCompareIds((arr) => arr.includes(oid) ? arr.filter(x => x !== oid) : arr.length >= 4 ? arr : [...arr, oid]);

  const accept = async (offerId: string) => {
    if (!isOwner) return;
    if (!confirm("Accept this offer? All other offers will be rejected and the request closes.")) return;
    const { error: e1 } = await supabase.from("offers").update({ status: "accepted" }).eq("id", offerId);
    if (e1) return toast.error(e1.message);
    await supabase.from("offers").update({ status: "rejected" }).eq("request_id", id).neq("id", offerId).eq("status", "pending");
    await supabase.from("travel_requests").update({ status: "closed" }).eq("id", id);
    toast.success("Offer accepted!");
    load();
  };

  const compared = offers.filter((o) => compareIds.includes(o.id));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <div className="rounded-2xl border bg-card p-6 mb-8">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />{req.flexible_destination ? "Flexible" : req.destination}
              </div>
              <h1 className="font-display text-3xl font-semibold mt-1">
                {req.flexible_destination ? "Open to suggestions" : req.destination}
              </h1>
            </div>
            <span className={`text-xs rounded-full px-3 py-1 ${req.status === "open" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{req.status}</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />{format(new Date(req.date_start), "MMM d")} – {format(new Date(req.date_end), "MMM d, yyyy")}</div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />{req.travelers_count} travelers</div>
            <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-muted-foreground" />{req.currency} {req.budget_min} – {req.budget_max}</div>
          </div>
          {req.preferences.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {req.preferences.map((p) => <span key={p} className="text-xs rounded-full bg-secondary px-2 py-0.5">{p}</span>)}
            </div>
          )}
          {req.notes && <p className="mt-4 text-sm text-muted-foreground">{req.notes}</p>}
          {!isOwner && isProvider && req.status === "open" && (
            <Button className="mt-6" onClick={() => nav({ to: "/offers/new/$reqId", params: { reqId: req.id } })}>Submit an offer</Button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold">{offers.length} offer{offers.length !== 1 && "s"}</h2>
          {compareIds.length >= 2 && (
            <span className="text-sm text-muted-foreground flex items-center gap-1.5"><ScaleIcon className="h-4 w-4" />Comparing {compareIds.length}</span>
          )}
        </div>

        {offers.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">No offers yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {offers.map((o) => (
              <div key={o.id} className={`rounded-2xl border bg-card overflow-hidden transition-all ${compareIds.includes(o.id) ? "ring-2 ring-primary" : ""}`}>
                {o.photos[0] && <img src={o.photos[0]} alt="" className="h-44 w-full object-cover" />}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{o.title}</h3>
                      <p className="text-xs text-muted-foreground">by {o.provider?.company_name || o.provider?.display_name || "Provider"}</p>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-1 ${o.status === "accepted" ? "bg-success/15 text-success" : o.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-secondary"}`}>{o.status}</span>
                  </div>
                  <p className="text-2xl font-display font-semibold text-primary">{o.currency} {o.price_total}</p>
                  {o.accommodation && <p className="text-sm text-muted-foreground mt-2">🏠 {o.accommodation}</p>}
                  {o.included_services.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {o.included_services.map((s) => <span key={s} className="text-xs rounded bg-secondary px-2 py-0.5">{s}</span>)}
                    </div>
                  )}
                  {o.description && <p className="text-sm mt-3 line-clamp-3">{o.description}</p>}
                  <div className="mt-4 flex gap-2">
                    {isOwner && req.status === "open" && o.status === "pending" && (
                      <Button size="sm" onClick={() => accept(o.id)}><Check className="h-4 w-4 mr-1" />Accept</Button>
                    )}
                    {isOwner && offers.length > 1 && (
                      <Button size="sm" variant="outline" onClick={() => toggleCompare(o.id)}>
                        {compareIds.includes(o.id) ? "Unselect" : "Compare"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {compared.length >= 2 && (
          <div className="mt-10 rounded-2xl border bg-card p-6 overflow-x-auto">
            <h3 className="font-display text-xl font-semibold mb-4">Side-by-side</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Offer</th>
                  {compared.map((o) => <th key={o.id} className="text-left py-2 px-3 font-display">{o.title}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="py-2 text-muted-foreground">Price</td>{compared.map((o) => <td key={o.id} className="py-2 px-3 font-semibold text-primary">{o.currency} {o.price_total}</td>)}</tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground">Accommodation</td>{compared.map((o) => <td key={o.id} className="py-2 px-3">{o.accommodation || "—"}</td>)}</tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground">Included</td>{compared.map((o) => <td key={o.id} className="py-2 px-3">{o.included_services.join(", ") || "—"}</td>)}</tr>
                <tr><td className="py-2 text-muted-foreground">Provider</td>{compared.map((o) => <td key={o.id} className="py-2 px-3">{o.provider?.company_name || o.provider?.display_name || "—"}</td>)}</tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
