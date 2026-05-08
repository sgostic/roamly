"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logEvent } from "@/lib/activity";
import { requireUser } from "@/lib/auth";

export type ActionResult = { error?: string; success?: boolean };

export async function updateProfile(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const displayName = ((formData.get("display_name") as string | null) ?? "").trim();
  const companyName = ((formData.get("company_name") as string | null) ?? "").trim() || null;
  const bio = ((formData.get("bio") as string | null) ?? "").trim() || null;

  if (!displayName) return { error: "Name is required." };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      display_name: displayName,
      company_name: user.role === "provider" ? companyName : null,
      bio,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const changedFields: string[] = [];
  if (displayName !== user.display_name) changedFields.push("display_name");
  if (user.role === "provider" && companyName !== user.company_name) {
    changedFields.push("company_name");
  }
  if (bio !== user.bio) changedFields.push("bio");

  await logEvent({
    type: "profile_updated",
    actorId: user.id,
    actorRole: user.role,
    targetType: "profile",
    targetId: user.id,
    metadata: {
      changed_fields: changedFields,
      actor_email: user.email,
      actor_name: displayName,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { success: true };
}
