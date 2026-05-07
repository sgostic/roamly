"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { MOCK_REQUESTS, MOCK_OFFERS, type Offer } from "@/lib/marketplace";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users, Wallet, Check, Scale, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const req = MOCK_REQUESTS.find((r) => r.id === id) ?? MOCK_REQUESTS[0];
  const initialOffers = MOCK_OFFERS[req.id] ?? [];
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);

  const toggleCompare = (oid: string) =>
    setCompareIds((arr) =>
      arr.includes(oid) ? arr.filter((x) => x !== oid) : arr.length >= 4 ? arr : [...arr, oid],
    );

  const accept = (offerId: string) => {
    if (!confirm("Accept this offer? All other offers will be rejected and the request closes."))
      return;
    setOffers((arr) =>
      arr.map((o) =>
        o.id === offerId ? { ...o, status: "accepted" } : { ...o, status: "rejected" },
      ),
    );
    setAccepted(true);
    toast.success("Offer accepted! The traveler will be in touch.");
  };

  const compared = offers.filter((o) => compareIds.includes(o.id));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <button
          onClick={() => router.push("/requests")}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All requests
        </button>
        <div className="rounded-2xl border bg-card p-6 mb-8">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {req.flexible_destination ? "Flexible destination" : req.destination}
              </div>
              <h1 className="font-display text-3xl font-semibold mt-1">
                {req.flexible_destination ? "Open to suggestions" : req.destination}
              </h1>
            </div>
            <span
              className={`text-xs rounded-full px-3 py-1 ${
                accepted || req.status !== "open"
                  ? "bg-muted text-muted-foreground"
                  : "bg-success/15 text-success"
              }`}
            >
              {accepted ? "closed" : req.status}
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {format(new Date(req.date_start), "MMM d")} –{" "}
              {format(new Date(req.date_end), "MMM d, yyyy")}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {req.travelers_count} travelers
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              {req.currency} {req.budget_min} – {req.budget_max}
            </div>
          </div>
          {req.preferences.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {req.preferences.map((p) => (
                <span key={p} className="text-xs rounded-full bg-secondary px-2 py-0.5">
                  {p}
                </span>
              ))}
            </div>
          )}
          {req.notes && <p className="mt-4 text-sm text-muted-foreground">{req.notes}</p>}
          <div className="mt-6 flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/offers/new/${req.id}`}>Submit an offer</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-display text-2xl font-semibold">
            {offers.length} offer{offers.length !== 1 && "s"}
          </h2>
          {compareIds.length >= 2 && (
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Scale className="h-4 w-4" />
              Comparing {compareIds.length}
            </span>
          )}
        </div>

        {offers.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            No offers yet — be the first.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {offers.map((o) => (
              <div
                key={o.id}
                className={`rounded-2xl border bg-card overflow-hidden transition-all ${
                  compareIds.includes(o.id) ? "ring-2 ring-primary" : ""
                } ${o.status === "rejected" ? "opacity-60" : ""}`}
              >
                {o.photos[0] && (
                  <img src={o.photos[0]} alt="" className="h-44 w-full object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{o.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        by {o.provider_company || o.provider_name}
                      </p>
                    </div>
                    <span
                      className={`text-xs rounded-full px-2 py-1 whitespace-nowrap ${
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
                  <p className="text-2xl font-display font-semibold text-primary">
                    {o.currency} {o.price_total.toLocaleString()}
                  </p>
                  {o.accommodation && (
                    <p className="text-sm text-muted-foreground mt-2">🏠 {o.accommodation}</p>
                  )}
                  {o.included_services.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {o.included_services.map((s) => (
                        <span key={s} className="text-xs rounded bg-secondary px-2 py-0.5">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {o.description && (
                    <p className="text-sm mt-3 line-clamp-3 text-muted-foreground">
                      {o.description}
                    </p>
                  )}
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {!accepted && o.status === "pending" && (
                      <Button size="sm" onClick={() => accept(o.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    )}
                    {offers.length > 1 && o.status !== "rejected" && (
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
            <h3 className="font-display text-xl font-semibold mb-4">Side-by-side comparison</h3>
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground w-32">Offer</th>
                  {compared.map((o) => (
                    <th key={o.id} className="text-left py-2 px-3 font-display font-semibold">
                      {o.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 text-muted-foreground">Price</td>
                  {compared.map((o) => (
                    <td key={o.id} className="py-3 px-3 font-semibold text-primary">
                      {o.currency} {o.price_total.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-muted-foreground">Accommodation</td>
                  {compared.map((o) => (
                    <td key={o.id} className="py-3 px-3">
                      {o.accommodation || "—"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-muted-foreground">Included</td>
                  {compared.map((o) => (
                    <td key={o.id} className="py-3 px-3">
                      {o.included_services.join(", ") || "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 text-muted-foreground">Provider</td>
                  {compared.map((o) => (
                    <td key={o.id} className="py-3 px-3">
                      {o.provider_company || o.provider_name}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
