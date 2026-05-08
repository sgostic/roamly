"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logEvent } from "@/lib/activity";
import {
  clearCurrentUserCookie,
  getCurrentUser,
  setCurrentUserCookie,
  type Role,
} from "@/lib/auth";

const DEMO_TRAVELER_ID = "11111111-1111-1111-1111-000000000001";
const DEMO_TRAVELER_EMAIL = "alex@demo.com";

export type ActionResult = { error?: string };

function normalizeEmail(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
}

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = normalizeEmail(formData.get("email"));
  if (!email) return { error: "Enter your email." };

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, role")
    .eq("email", email)
    .maybeSingle();

  if (error) return { error: "Something went wrong. Try again." };
  if (!data) return { error: "No account with that email. Sign up first." };

  await setCurrentUserCookie(data.id);
  await logEvent({
    type: "user_signed_in",
    actorId: data.id,
    actorRole: data.role,
    targetType: "profile",
    targetId: data.id,
    metadata: { email, display_name: data.display_name },
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = normalizeEmail(formData.get("email"));
  const name = (formData.get("name") as string | null)?.trim();
  const role = formData.get("role") as Role | null;
  const companyName = (formData.get("company_name") as string | null)?.trim() || null;

  if (!email) return { error: "Enter your email." };
  if (!name) return { error: "Enter your name." };
  if (role !== "traveler" && role !== "provider") {
    return { error: "Pick a role to continue." };
  }

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return { error: "An account with that email already exists. Sign in instead." };

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      email,
      display_name: name,
      role,
      company_name: role === "provider" ? companyName : null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Could not create your account." };

  await setCurrentUserCookie(data.id);
  await logEvent({
    type: "user_signed_up",
    actorId: data.id,
    actorRole: role,
    targetType: "profile",
    targetId: data.id,
    metadata: {
      email,
      display_name: name,
      role,
      company_name: role === "provider" ? companyName : null,
    },
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInAsDemo(): Promise<void> {
  await setCurrentUserCookie(DEMO_TRAVELER_ID);
  await logEvent({
    type: "user_signed_in",
    actorId: DEMO_TRAVELER_ID,
    actorRole: "traveler",
    targetType: "profile",
    targetId: DEMO_TRAVELER_ID,
    metadata: { email: DEMO_TRAVELER_EMAIL, demo: true },
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  // Read the user BEFORE clearing the cookie so we can attribute the event.
  const user = await getCurrentUser();
  await clearCurrentUserCookie();
  if (user) {
    await logEvent({
      type: "user_signed_out",
      actorId: user.id,
      actorRole: user.role,
      targetType: "profile",
      targetId: user.id,
      metadata: { email: user.email, display_name: user.display_name },
    });
  }
  revalidatePath("/", "layout");
  redirect("/");
}
