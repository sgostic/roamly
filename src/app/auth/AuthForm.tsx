"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plane, Briefcase, User } from "lucide-react";
import { signIn, signUp, signInAsDemo, type ActionResult } from "./actions";

const initialState: ActionResult = {};

export function AuthForm() {
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<"traveler" | "provider">("traveler");

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <form action={signInAsDemo}>
        <Button type="submit" variant="outline" className="w-full mb-4">
          Continue as demo traveler
        </Button>
      </form>

      <div className="relative my-4 text-center text-xs text-muted-foreground">
        <span className="bg-card px-2 relative z-10">or</span>
        <div className="absolute inset-0 top-1/2 border-t" />
      </div>

      <Tabs defaultValue="signin">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form action={signInAction} className="space-y-3">
            <div>
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                name="email"
                type="email"
                required
                placeholder="alex@demo.com"
              />
            </div>
            {signInState.error && <p className="text-sm text-destructive">{signInState.error}</p>}
            <Button className="w-full" type="submit" disabled={signInPending}>
              {signInPending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-xs text-muted-foreground text-center pt-1">
              Tip: try <code className="font-mono">alex@demo.com</code> (traveler) or{" "}
              <code className="font-mono">helena@demo.com</code> (provider).
            </p>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form action={signUpAction} className="space-y-4">
            <div>
              <Label className="mb-2 block">I am a…</Label>
              <input type="hidden" name="role" value={role} />
              <div className="grid grid-cols-2 gap-2">
                <RoleTile
                  active={role === "traveler"}
                  onClick={() => setRole("traveler")}
                  icon={<User className="h-5 w-5" />}
                  title="Traveler"
                  body="Post trips, get offers"
                />
                <RoleTile
                  active={role === "provider"}
                  onClick={() => setRole("provider")}
                  icon={<Briefcase className="h-5 w-5" />}
                  title="Provider"
                  body="Send offers to travelers"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                You can&apos;t change roles later — pick carefully.
              </p>
            </div>

            <div>
              <Label htmlFor="signup-name">Name</Label>
              <Input id="signup-name" name="name" required />
            </div>
            <div>
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" name="email" type="email" required />
            </div>
            {role === "provider" && (
              <div>
                <Label htmlFor="signup-company">Company / brand</Label>
                <Input
                  id="signup-company"
                  name="company_name"
                  placeholder="Optional, shown on your offers"
                />
              </div>
            )}
            {signUpState.error && <p className="text-sm text-destructive">{signUpState.error}</p>}
            <Button className="w-full" type="submit" disabled={signUpPending}>
              {signUpPending ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RoleTile({
  active,
  onClick,
  icon,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition-colors ${
        active
          ? "bg-primary/5 border-primary ring-1 ring-primary/40"
          : "bg-background hover:bg-secondary"
      }`}
    >
      <div
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md mb-1 ${
          active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <div className="font-display font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{body}</div>
    </button>
  );
}

export function AuthHero() {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <Plane className="h-6 w-6" />
      </div>
      <h1 className="font-display text-3xl font-semibold">Welcome to Roamly</h1>
      <p className="text-muted-foreground mt-1">Sign in to post requests or send offers.</p>
    </div>
  );
}
