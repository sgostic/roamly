import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { RequestCard } from "@/components/RequestCard";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const metadata: Metadata = { title: "Browse travel requests — Roamly" };

export default async function RequestsList() {
  const user = await requireUser();
  if (user.role !== "provider") redirect("/dashboard");

  const now = new Date().toISOString();

  const { data: requests } = await supabaseAdmin
    .from("travel_requests")
    .select("*")
    .eq("status", "open")
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  const list = requests ?? [];

  // Fetch offer counts in one round trip then merge.
  const counts = new Map<string, number>();
  if (list.length) {
    const { data: offers } = await supabaseAdmin
      .from("offers")
      .select("request_id")
      .in(
        "request_id",
        list.map((r) => r.id),
      );
    offers?.forEach((o) => counts.set(o.request_id, (counts.get(o.request_id) ?? 0) + 1));
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold">Open trip requests</h1>
          <p className="text-muted-foreground mt-1">
            Find travelers looking for offers like yours.
          </p>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            No open requests right now. Check back soon.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((r) => (
              <RequestCard key={r.id} r={{ ...r, offers_count: counts.get(r.id) ?? 0 }} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
