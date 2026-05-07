import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Inbox, Scale, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Roamly — Travel offers come to you",
  description:
    "Post your dream trip. Get personalized offers from agencies, hotels and hosts. Compare and book the best one.",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Reverse travel marketplace
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.05] mb-6">
                Stop searching. <br />
                <span className="text-primary">Let trips find you.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mb-8">
                Tell us where you&apos;d like to go and what you&apos;d like to spend. Verified
                hosts, hotels and agencies send tailored offers within hours.
              </p>
              <div>
                <Button size="lg" asChild>
                  <Link href="/auth">Get started</Link>
                </Button>
                <p className="mt-3 text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth?tab=signin" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
            <div className="relative aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
                alt="Coastal getaway"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-card/95 backdrop-blur p-5 shadow-lg">
                <div className="text-xs text-muted-foreground">Greece, 7 nights, 2 people</div>
                <div className="font-display text-xl font-semibold mt-1">
                  &quot;Quiet island, near beach, mid-budget&quot;
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">12 offers received</span>
                  <span className="font-semibold text-primary">from $980</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-card">
          <div className="container mx-auto px-4 py-20 grid md:grid-cols-3 gap-10">
            {[
              {
                icon: Inbox,
                title: "Post your trip",
                body: "Destination (or flexible), dates, budget, and what you love.",
              },
              {
                icon: Sparkles,
                title: "Get tailored offers",
                body: "Providers compete with personalized prices and itineraries.",
              },
              {
                icon: Scale,
                title: "Compare & accept",
                body: "Side-by-side comparison. Pick the one that fits, close the request.",
              },
            ].map((s) => (
              <div key={s.title}>
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 text-center">
          <ShieldCheck className="h-8 w-8 mx-auto text-primary mb-4" />
          <h2 className="font-display text-3xl md:text-4xl font-semibold max-w-2xl mx-auto">
            One request. Multiple offers. Zero search fatigue.
          </h2>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/auth">Get started — free</Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Roamly
      </footer>
    </div>
  );
}
