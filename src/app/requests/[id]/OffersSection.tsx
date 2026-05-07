"use client";

import { useState, useTransition } from "react";
import { Check, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OfferWithProvider } from "@/lib/marketplace";
import { acceptOffer } from "@/app/offers/actions";

const MAX_COMPARE = 4;

export function OffersSection({ offers }: { offers: OfferWithProvider[] }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
        No offers yet — providers will start sending tailored offers shortly.
      </div>
    );
  }

  const toggleCompare = (id: string) =>
    setCompareIds((arr) =>
      arr.includes(id)
        ? arr.filter((x) => x !== id)
        : arr.length >= MAX_COMPARE
          ? arr
          : [...arr, id],
    );

  const handleAccept = (offerId: string) => {
    if (!confirm("Accept this offer? All other offers will be rejected and the request closes."))
      return;
    startTransition(async () => {
      const res = await acceptOffer(offerId);
      if (res.error) toast.error(res.error);
      else toast.success("Offer accepted! The provider will be in touch.");
    });
  };

  const compared = offers.filter((o) => compareIds.includes(o.id));
  const requestIsClosed = offers.some((o) => o.status === "accepted");

  return (
    <>
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

      <div className="grid md:grid-cols-2 gap-4">
        {offers.map((o) => {
          const inCompare = compareIds.includes(o.id);
          return (
            <div
              key={o.id}
              className={`rounded-2xl border bg-card overflow-hidden transition-all ${
                inCompare ? "ring-2 ring-primary" : ""
              } ${o.status === "rejected" ? "opacity-60" : ""}`}
            >
              {o.photos[0] && <img src={o.photos[0]} alt="" className="h-44 w-full object-cover" />}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{o.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      by {o.provider?.company_name || o.provider?.display_name || "Provider"}
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
                  <p className="text-sm mt-3 line-clamp-3 text-muted-foreground">{o.description}</p>
                )}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {!requestIsClosed && o.status === "pending" && (
                    <Button size="sm" onClick={() => handleAccept(o.id)} disabled={pending}>
                      <Check className="h-4 w-4 mr-1" />
                      {pending ? "Accepting…" : "Accept"}
                    </Button>
                  )}
                  {offers.length > 1 && o.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => toggleCompare(o.id)}>
                      {inCompare ? "Unselect" : "Compare"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
                    {o.provider?.company_name || o.provider?.display_name || "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
