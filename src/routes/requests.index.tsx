import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { MOCK_REQUESTS, MOCK_OFFERS } from "@/lib/marketplace";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/requests/")({
  head: () => ({ meta: [{ title: "Browse travel requests — Roamly" }] }),
  component: RequestsList,
});

function RequestsList() {
  const items = MOCK_REQUESTS;
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <div>
            <h1 className="font-display text-4xl font-semibold">Open trip requests</h1>
            <p className="text-muted-foreground mt-1">Find travelers looking for offers like yours.</p>
          </div>
          <Link to="/requests/new"><Button><Plus className="h-4 w-4 mr-1" />New request</Button></Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((r) => <RequestCard key={r.id} r={{ ...r, offers_count: MOCK_OFFERS[r.id]?.length ?? 0 }} />)}
        </div>
      </main>
    </div>
  );
}
