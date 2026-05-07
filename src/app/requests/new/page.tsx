import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { requireRole } from "@/lib/auth";
import { NewRequestForm } from "./NewRequestForm";

export const metadata: Metadata = { title: "Post a trip request — Roamly" };

export default async function NewRequestPage() {
  await requireRole("traveler");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold mb-2">Post a trip request</h1>
        <p className="text-muted-foreground mb-8">
          Tell providers what you&apos;re looking for. They&apos;ll send personalized offers.
        </p>
        <NewRequestForm />
      </main>
    </div>
  );
}
