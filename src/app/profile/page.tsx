import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { Header } from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profile — Roamly" };

export default async function ProfilePage() {
  const user = await requireUser();
  const isProvider = user.role === "provider";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-xl">
        <h1 className="font-display text-4xl font-semibold mb-2">Profile</h1>
        <p className="text-muted-foreground mb-6">{user.email}</p>

        <ProfileForm user={user} />

        <div className="mt-6 rounded-2xl border bg-card p-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">Account type</p>
              <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Locked" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isProvider
                ? "You submit offers on travel requests. You can&rsquo;t create requests."
                : "You post travel requests. You can&rsquo;t send offers."}
            </p>
          </div>
          <span
            className={`text-xs rounded-full px-3 py-1 capitalize whitespace-nowrap ${
              isProvider ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
            }`}
          >
            {user.role}
          </span>
        </div>
      </main>
    </div>
  );
}
