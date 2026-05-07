import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SERVICES } from "@/lib/marketplace";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

export const Route = createFileRoute("/offers/new/$reqId")({
  head: () => ({ meta: [{ title: "Submit an offer — Roamly" }] }),
  component: NewOfferPage,
});

function NewOfferPage() {
  const { reqId } = Route.useParams();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(1000);
  const [accommodation, setAccommodation] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const toggleSvc = (s: string) =>
    setServices((arr) => arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPhotos((p) => [...p, ...urls]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Offer submitted!");
    nav({ to: "/requests/$id", params: { id: reqId } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold mb-2">Submit an offer</h1>
        <p className="text-muted-foreground mb-8">Make it stand out — clear pricing, photos, what's included.</p>
        <form onSubmit={submit} className="space-y-6 rounded-2xl border bg-card p-6">
          <div><Label>Title</Label><Input required value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g. 7-night beachfront stay in Crete" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Total price ($)</Label><Input type="number" required min={0} value={price} onChange={(e)=>setPrice(+e.target.value)} /></div>
            <div><Label>Accommodation</Label><Input value={accommodation} onChange={(e)=>setAccommodation(e.target.value)} placeholder="4★ Hotel near the sea" /></div>
          </div>
          <div>
            <Label>Included services</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <button key={s} type="button" onClick={()=>toggleSvc(s)}
                  className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${services.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-secondary"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Photos</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} alt="" className="h-20 w-20 object-cover rounded-md" />
                  <button type="button" onClick={()=>setPhotos(photos.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="h-20 w-20 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-secondary">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
              </label>
            </div>
          </div>
          <div><Label>Description</Label><Textarea rows={5} value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="What makes this offer special?" /></div>
          <Button type="submit" size="lg" className="w-full">Send offer</Button>
        </form>
      </main>
    </div>
  );
}
