import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SubmitOfferForm } from "./SubmitOfferForm";

export const metadata: Metadata = { title: "Submit an offer — Roamly" };

type PageProps = { params: Promise<{ reqId: string }> };

export default async function NewOfferPage({ params }: PageProps) {
  await requireRole("provider");
  const { reqId } = await params;

  const { data: request } = await supabaseAdmin
    .from("travel_requests")
    .select("id, destination, flexible_destination, status, expires_at")
    .eq("id", reqId)
    .maybeSingle();

  if (!request) notFound();

  const isAcceptingOffers = request.status === "open" && new Date(request.expires_at) > new Date();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold mb-2">Submit an offer</h1>
        <p className="text-muted-foreground mb-2">
          For:{" "}
          <span className="font-medium text-foreground">
            {request.flexible_destination ? "Flexible destination" : request.destination}
          </span>
        </p>
        <p className="text-muted-foreground mb-8">
          Make it stand out — clear pricing, photos, what&apos;s included.
        </p>

        {isAcceptingOffers ? (
          <SubmitOfferForm requestId={reqId} />
        ) : (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            This request is no longer accepting offers.
          </div>
        )}
      </main>
    </div>
  );
}
