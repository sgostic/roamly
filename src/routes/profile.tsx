import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Roamly" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [displayName, setDisplayName] = useState("Alex Morgan");
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [isProvider, setIsProvider] = useState(true);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-xl">
        <h1 className="font-display text-4xl font-semibold mb-8">Profile</h1>
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Profile saved"); }} className="space-y-5 rounded-2xl border bg-card p-6 mb-6">
          <div><Label>Display name</Label><Input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} /></div>
          <div><Label>Company / brand name</Label><Input value={companyName} onChange={(e)=>setCompanyName(e.target.value)} placeholder="Optional, shown on offers" /></div>
          <div><Label>Bio</Label><Textarea value={bio} onChange={(e)=>setBio(e.target.value)} rows={4} /></div>
          <Button type="submit">Save changes</Button>
        </form>
        <div className="rounded-2xl border bg-card p-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Provider account</p>
            <p className="text-sm text-muted-foreground">{isProvider ? "You can submit offers on travel requests." : "Become a provider to send offers."}</p>
          </div>
          <Button variant={isProvider ? "outline" : "default"} onClick={() => { setIsProvider(!isProvider); toast.success(isProvider ? "Disabled provider mode" : "You're now a provider"); }}>
            {isProvider ? "Disable" : "Enable"}
          </Button>
        </div>
      </main>
    </div>
  );
}
