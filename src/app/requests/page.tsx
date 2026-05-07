import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { MOCK_REQUESTS, MOCK_OFFERS } from "@/lib/marketplace";
import { Plus } from "lucide-react";

export const metadata = { title: "Browse travel requests — Roamly" };

export default function RequestsList() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <div>
            <h1 className="font-display text-4xl font-semibold">Open trip requests</h1>
            <p className="text-muted-foreground mt-1">
              Find travelers looking for offers like yours.
            </p>
          </div>
          <Button asChild>
            <Link href="/requests/new">
              <Plus className="h-4 w-4 mr-1" />
              New request
            </Link>
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_REQUESTS.map((r) => (
            <RequestCard key={r.id} r={{ ...r, offers_count: MOCK_OFFERS[r.id]?.length ?? 0 }} />
          ))}
        </div>
      </main>
    </div>
  );
}
