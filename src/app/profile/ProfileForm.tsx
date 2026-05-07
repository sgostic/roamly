"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { CurrentUser } from "@/lib/auth";
import { updateProfile, type ActionResult } from "./actions";

const initialState: ActionResult = {};

export function ProfileForm({ user }: { user: CurrentUser }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  useEffect(() => {
    if (state.success) toast.success("Profile saved");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border bg-card p-6">
      <div>
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={user.display_name ?? ""}
          required
        />
      </div>
      {user.role === "provider" && (
        <div>
          <Label htmlFor="company_name">Company / brand name</Label>
          <Input
            id="company_name"
            name="company_name"
            defaultValue={user.company_name ?? ""}
            placeholder="Shown on your offers"
          />
        </div>
      )}
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={user.bio ?? ""} rows={4} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
