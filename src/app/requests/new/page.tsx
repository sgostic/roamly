"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PREFERENCES } from "@/lib/marketplace";
import { toast } from "sonner";

export default function NewRequestPage() {
  const router = useRouter();
  const [flexible, setFlexible] = useState(false);
  const [destination, setDestination] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [budgetMin, setBudgetMin] = useState(500);
  const [budgetMax, setBudgetMax] = useState(2000);
  const [travelers, setTravelers] = useState(2);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const togglePref = (p: string) =>
    setPrefs((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Request posted! Providers can now send offers.");
    router.push("/requests/r1");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold mb-2">Post a trip request</h1>
        <p className="text-muted-foreground mb-8">
          Tell providers what you&apos;re looking for. They&apos;ll send personalized offers.
        </p>
        <form onSubmit={submit} className="space-y-6 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Flexible destination</Label>
              <p className="text-sm text-muted-foreground">Let providers suggest where to go.</p>
            </div>
            <Switch checked={flexible} onCheckedChange={setFlexible} />
          </div>
          {!flexible && (
            <div>
              <Label>Destination</Label>
              <Input
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Lisbon, Portugal"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From</Label>
              <Input
                type="date"
                required
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>
            <div>
              <Label>To</Label>
              <Input
                type="date"
                required
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Travelers</Label>
              <Input
                type="number"
                min={1}
                value={travelers}
                onChange={(e) => setTravelers(+e.target.value)}
              />
            </div>
            <div>
              <Label>Budget min ($)</Label>
              <Input
                type="number"
                min={0}
                value={budgetMin}
                onChange={(e) => setBudgetMin(+e.target.value)}
              />
            </div>
            <div>
              <Label>Budget max ($)</Label>
              <Input
                type="number"
                min={0}
                value={budgetMax}
                onChange={(e) => setBudgetMax(+e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Preferences</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PREFERENCES.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => togglePref(p)}
                  className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${
                    prefs.includes(p)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else providers should know?"
              rows={4}
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Post request
          </Button>
        </form>
      </main>
    </div>
  );
}
