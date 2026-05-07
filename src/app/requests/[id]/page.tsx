import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users, Wallet, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { OfferRow, OfferWithProvider, ProfileRow } from "@/lib/marketplace";
import { OffersSection } from "./OffersSection";

export const metadata: Metadata = { title: "Request — Roamly" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RequestDetail({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  const { data: request } = await supabaseAdmin
    .from("travel_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!request) notFound();

  const isOwner = user.role === "traveler" && user.id === request.traveler_id;
  const isProvider = user.role === "provider";

  // Travelers who don't own this request can't see it.
  if (user.role === "traveler" && !isOwner) redirect("/dashboard");

  const acceptingOffers = request.status === "open" && new Date(request.expires_at) > new Date();

  // Owner sees every offer; provider sees only their own (if any).
  let offers: OfferWithProvider[] = [];
  if (isOwner) {
    const { data: rawOffers } = await supabaseAdmin
      .from("offers")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: true });
    offers = await joinProviders(rawOffers ?? []);
  }

  let myOffer: OfferWithProvider | null = null;
  if (isProvider) {
    const { data: own } = await supabaseAdmin
      .from("offers")
      .select("*")
      .eq("request_id", id)
      .eq("provider_id", user.id)
      .maybeSingle();
    if (own) {
      const [withProvider] = await joinProviders([own]);
      myOffer = withProvider;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <Link
          href={isProvider ? "/requests" : "/dashboard"}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {isProvider ? "All requests" : "Dashboard"}
        </Link>

        <div className="rounded-2xl border bg-card p-6 mb-8">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {request.flexible_destination ? "Flexible destination" : request.destination}
              </div>
              <h1 className="font-display text-3xl font-semibold mt-1">
                {request.flexible_destination ? "Open to suggestions" : request.destination}
              </h1>
            </div>
            <span
              className={`text-xs rounded-full px-3 py-1 ${
                acceptingOffers ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {acceptingOffers
                ? request.status
                : request.status === "open"
                  ? "expired"
                  : request.status}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {format(new Date(request.date_start), "MMM d")} –{" "}
              {format(new Date(request.date_end), "MMM d, yyyy")}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {request.travelers_count} travelers
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              {request.currency} {request.budget_min} – {request.budget_max}
            </div>
          </div>

          {request.preferences.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {request.preferences.map((p) => (
                <span key={p} className="text-xs rounded-full bg-secondary px-2 py-0.5">
                  {p}
                </span>
              ))}
            </div>
          )}
          {request.notes && <p className="mt-4 text-sm text-muted-foreground">{request.notes}</p>}

          {isProvider && acceptingOffers && !myOffer && (
            <div className="mt-6">
              <Button asChild>
                <Link href={`/offers/new/${request.id}`}>Submit an offer</Link>
              </Button>
            </div>
          )}
        </div>

        {isOwner && <OffersSection offers={offers} />}

        {isProvider && (
          <ProviderOfferSummary
            myOffer={myOffer}
            requestId={request.id}
            acceptingOffers={acceptingOffers}
          />
        )}
      </main>
    </div>
  );
}

function ProviderOfferSummary({
  myOffer,
  requestId,
  acceptingOffers,
}: {
  myOffer: OfferWithProvider | null;
  requestId: string;
  acceptingOffers: boolean;
}) {
  if (myOffer) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-display text-xl font-semibold mb-3">Your offer</h2>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="font-display text-lg font-semibold">{myOffer.title}</p>
            <p className="text-primary font-semibold">
              {myOffer.currency} {myOffer.price_total.toLocaleString()}
            </p>
          </div>
          <span
            className={`text-xs rounded-full px-3 py-1 capitalize ${
              myOffer.status === "accepted"
                ? "bg-success/15 text-success"
                : myOffer.status === "rejected"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-secondary"
            }`}
          >
            {myOffer.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Competing offers are hidden until the traveler accepts one.
        </p>
      </div>
    );
  }

  if (!acceptingOffers) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
        This request is no longer accepting offers.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <p className="text-muted-foreground mb-4">
        You haven&apos;t submitted an offer for this request.
      </p>
      <Button asChild>
        <Link href={`/offers/new/${requestId}`}>Submit an offer</Link>
      </Button>
    </div>
  );
}

async function joinProviders(offers: OfferRow[]): Promise<OfferWithProvider[]> {
  if (offers.length === 0) return [];
  const ids = [...new Set(offers.map((o) => o.provider_id))];
  const { data: providers } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, company_name")
    .in("id", ids);

  const byId = new Map<string, Pick<ProfileRow, "display_name" | "company_name">>();
  providers?.forEach((p) =>
    byId.set(p.id, { display_name: p.display_name, company_name: p.company_name }),
  );

  return offers.map((o) => ({ ...o, provider: byId.get(o.provider_id) ?? null }));
}
