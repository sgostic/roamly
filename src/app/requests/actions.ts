"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logEvent } from "@/lib/activity";
import { requireRole } from "@/lib/auth";

export type ActionResult = { error?: string };

function asNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function createTravelRequest(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole("traveler");

  const flexible = formData.get("flexible_destination") === "on";
  const destination = ((formData.get("destination") as string | null) ?? "").trim();
  const dateStart = (formData.get("date_start") as string | null) ?? "";
  const dateEnd = (formData.get("date_end") as string | null) ?? "";
  const budgetMin = asNumber(formData.get("budget_min"));
  const budgetMax = asNumber(formData.get("budget_max"));
  const travelers = asNumber(formData.get("travelers_count"));
  const preferences = formData
    .getAll("preferences")
    .filter((v): v is string => typeof v === "string");
  const notes = ((formData.get("notes") as string | null) ?? "").trim() || null;

  if (!flexible && !destination) return { error: "Pick a destination or mark it flexible." };
  if (!dateStart || !dateEnd) return { error: "Both dates are required." };
  if (new Date(dateEnd) < new Date(dateStart)) return { error: "End date is before start date." };
  if (budgetMin === null || budgetMax === null) return { error: "Enter a budget range." };
  if (budgetMax < budgetMin) return { error: "Max budget is below min budget." };
  if (!travelers || travelers < 1) return { error: "At least one traveler." };

  const { data, error } = await supabaseAdmin
    .from("travel_requests")
    .insert({
      traveler_id: user.id,
      destination: flexible ? null : destination,
      flexible_destination: flexible,
      date_start: dateStart,
      date_end: dateEnd,
      budget_min: budgetMin,
      budget_max: budgetMax,
      travelers_count: travelers,
      preferences,
      notes,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create request." };

  await logEvent({
    type: "request_created",
    actorId: user.id,
    actorRole: "traveler",
    targetType: "request",
    targetId: data.id,
    metadata: {
      destination: flexible ? null : destination,
      flexible_destination: flexible,
      date_start: dateStart,
      date_end: dateEnd,
      budget_min: budgetMin,
      budget_max: budgetMax,
      travelers_count: travelers,
      preferences,
      actor_email: user.email,
      actor_name: user.display_name,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/requests");
  redirect(`/requests/${data.id}`);
}
