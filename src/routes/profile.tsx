import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Roamly" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, isProvider, refreshRoles } = useAuth();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name ?? "");
        setCompanyName(data.company_name ?? "");
        setBio(data.bio ?? "");
      }
    });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      company_name: companyName || null,
      bio: bio || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  const toggleProvider = async () => {
    if (!user) return;
    if (isProvider) {
      await supabase.from("user_roles").delete().eq("user_id", user.id).eq("role", "provider");
      toast.success("No longer a provider");
    } else {
      await supabase.from("user_roles").insert({ user_id: user.id, role: "provider" });
      toast.success("You're now a provider");
    }
    await refreshRoles();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-xl">
        <h1 className="font-display text-4xl font-semibold mb-8">Profile</h1>
        <form onSubmit={save} className="space-y-5 rounded-2xl border bg-card p-6 mb-6">
          <div><Label>Display name</Label><Input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} /></div>
          <div><Label>Company / brand name</Label><Input value={companyName} onChange={(e)=>setCompanyName(e.target.value)} placeholder="Optional, shown on offers" /></div>
          <div><Label>Bio</Label><Textarea value={bio} onChange={(e)=>setBio(e.target.value)} rows={4} /></div>
          <Button type="submit" disabled={busy}>Save changes</Button>
        </form>
        <div className="rounded-2xl border bg-card p-6 flex items-center justify-between">
          <div>
            <p className="font-medium">Provider account</p>
            <p className="text-sm text-muted-foreground">{isProvider ? "You can submit offers on travel requests." : "Become a provider to send offers."}</p>
          </div>
          <Button variant={isProvider ? "outline" : "default"} onClick={toggleProvider}>
            {isProvider ? "Disable" : "Enable"}
          </Button>
        </div>
      </main>
    </div>
  );
}
