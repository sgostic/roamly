"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PREFERENCES } from "@/lib/marketplace";
import { toast } from "sonner";
import { createTravelRequest, type ActionResult } from "../actions";

const initialState: ActionResult = {};

export function NewRequestForm() {
  const [state, formAction, pending] = useActionState(createTravelRequest, initialState);
  const [flexible, setFlexible] = useState(false);
  const [prefs, setPrefs] = useState<string[]>([]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  const togglePref = (p: string) =>
    setPrefs((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]));

  return (
    <form action={formAction} className="space-y-6 rounded-2xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Flexible destination</Label>
          <p className="text-sm text-muted-foreground">Let providers suggest where to go.</p>
        </div>
        <Switch checked={flexible} onCheckedChange={setFlexible} name="flexible_destination" />
      </div>

      {!flexible && (
        <div>
          <Label htmlFor="destination">Destination</Label>
          <Input id="destination" name="destination" required placeholder="e.g. Lisbon, Portugal" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date_start">From</Label>
          <Input id="date_start" name="date_start" type="date" required />
        </div>
        <div>
          <Label htmlFor="date_end">To</Label>
          <Input id="date_end" name="date_end" type="date" required />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="travelers_count">Travelers</Label>
          <Input
            id="travelers_count"
            name="travelers_count"
            type="number"
            min={1}
            defaultValue={2}
            required
          />
        </div>
        <div>
          <Label htmlFor="budget_min">Budget min ($)</Label>
          <Input
            id="budget_min"
            name="budget_min"
            type="number"
            min={0}
            defaultValue={500}
            required
          />
        </div>
        <div>
          <Label htmlFor="budget_max">Budget max ($)</Label>
          <Input
            id="budget_max"
            name="budget_max"
            type="number"
            min={0}
            defaultValue={2000}
            required
          />
        </div>
      </div>

      <div>
        <Label>Preferences</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PREFERENCES.map((p) => {
            const active = prefs.includes(p);
            return (
              <label
                key={p}
                className={`text-sm rounded-full px-3 py-1.5 border transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-secondary"
                }`}
              >
                <input
                  type="checkbox"
                  name="preferences"
                  value={p}
                  checked={active}
                  onChange={() => togglePref(p)}
                  className="sr-only"
                />
                {p}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Anything else providers should know?"
          rows={4}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Posting…" : "Post request"}
      </Button>
    </form>
  );
}
