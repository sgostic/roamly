"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireRole } from "@/lib/auth";

export type ActionResult = { error?: string };

const PHOTO_BUCKET = "offer-photos";
const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

function asNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function uploadOfferPhotos(providerId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    if (file.size === 0) continue;
    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error(`Photo too large (max ${MAX_PHOTO_BYTES / 1024 / 1024} MB).`);
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${providerId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    const { data } = supabaseAdmin.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

export async function submitOffer(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("provider");

  const requestId = ((formData.get("request_id") as string | null) ?? "").trim();
  const title = ((formData.get("title") as string | null) ?? "").trim();
  const price = asNumber(formData.get("price_total"));
  const accommodation = ((formData.get("accommodation") as string | null) ?? "").trim() || null;
  const description = ((formData.get("description") as string | null) ?? "").trim() || null;
  const services = formData
    .getAll("included_services")
    .filter((v): v is string => typeof v === "string");

  if (!requestId) return { error: "Missing request id." };
  if (!title) return { error: "Title is required." };
  if (price === null || price <= 0) return { error: "Enter a valid total price." };

  // Confirm the request still exists, is open, and not expired before doing
  // an expensive photo upload.
  const { data: request } = await supabaseAdmin
    .from("travel_requests")
    .select("id, status, expires_at")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { error: "Request not found." };
  if (request.status !== "open" || new Date(request.expires_at) <= new Date()) {
    return { error: "This request is no longer accepting offers." };
  }

  const photoFiles = formData
    .getAll("photos")
    .filter((v): v is File => v instanceof File && v.size > 0)
    .slice(0, MAX_PHOTOS);

  let photoUrls: string[] = [];
  try {
    photoUrls = await uploadOfferPhotos(user.id, photoFiles);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Photo upload failed." };
  }

  const { error } = await supabaseAdmin.from("offers").insert({
    request_id: requestId,
    provider_id: user.id,
    title,
    price_total: price,
    accommodation,
    included_services: services,
    photos: photoUrls,
    description,
  });

  if (error) return { error: error.message };

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/dashboard");
  redirect(`/requests/${requestId}`);
}

export async function acceptOffer(offerId: string): Promise<ActionResult> {
  const user = await requireRole("traveler");

  const { data: offer } = await supabaseAdmin
    .from("offers")
    .select("id, request_id, status")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer) return { error: "Offer not found." };
  if (offer.status !== "pending") return { error: "Offer is no longer pending." };

  const { data: request } = await supabaseAdmin
    .from("travel_requests")
    .select("traveler_id, status")
    .eq("id", offer.request_id)
    .maybeSingle();
  if (!request) return { error: "Request not found." };
  if (request.traveler_id !== user.id) return { error: "Not your request." };
  if (request.status !== "open") return { error: "Request is already closed." };

  const { error: rpcErr } = await supabaseAdmin.rpc("accept_offer", { p_offer_id: offerId });
  if (rpcErr) return { error: rpcErr.message };

  revalidatePath(`/requests/${offer.request_id}`);
  revalidatePath("/dashboard");
  return {};
}
