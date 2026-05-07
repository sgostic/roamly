"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SERVICES } from "@/lib/marketplace";
import { toast } from "sonner";
import { submitOffer, type ActionResult } from "@/app/offers/actions";

const initialState: ActionResult = {};
const MAX_PHOTOS = 6;

export function SubmitOfferForm({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(submitOffer, initialState);
  const [services, setServices] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const photosInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  // Keep object URLs in sync with file list and revoke on cleanup.
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  // Mirror `photos` state into the actual <input type="file"> so FormData picks them up.
  useEffect(() => {
    const el = photosInputRef.current;
    if (!el) return;
    const dt = new DataTransfer();
    photos.forEach((f) => dt.items.add(f));
    el.files = dt.files;
  }, [photos]);

  const toggleSvc = (s: string) =>
    setServices((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]));

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;
    setPhotos((p) => [...p, ...Array.from(picked)].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, j) => j !== i));

  return (
    <form action={formAction} className="space-y-6 rounded-2xl border bg-card p-6">
      <input type="hidden" name="request_id" value={requestId} />

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. 7-night beachfront stay in Crete"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price_total">Total price ($)</Label>
          <Input
            id="price_total"
            name="price_total"
            type="number"
            required
            min={0}
            defaultValue={1000}
          />
        </div>
        <div>
          <Label htmlFor="accommodation">Accommodation</Label>
          <Input id="accommodation" name="accommodation" placeholder="4★ Hotel near the sea" />
        </div>
      </div>

      <div>
        <Label>Included services</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const active = services.includes(s);
            return (
              <label
                key={s}
                className={`text-sm rounded-full px-3 py-1.5 border transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-secondary"
                }`}
              >
                <input
                  type="checkbox"
                  name="included_services"
                  value={s}
                  checked={active}
                  onChange={() => toggleSvc(s)}
                  className="sr-only"
                />
                {s}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Photos</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={`${i}-${photos[i]?.name ?? ""}`} className="relative">
              <img src={src} alt="" className="h-20 w-20 object-cover rounded-md" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="h-20 w-20 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-secondary">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
            </label>
          )}
        </div>
        {/* The actual field that FormData reads — ref-synced from `photos` state. */}
        <input
          ref={photosInputRef}
          type="file"
          name="photos"
          accept="image/*"
          multiple
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Up to {MAX_PHOTOS} photos. Max 5 MB each.
        </p>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          placeholder="What makes this offer special?"
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending offer…" : "Send offer"}
      </Button>
    </form>
  );
}
