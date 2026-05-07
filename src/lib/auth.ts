import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export type CurrentUser = Database["public"]["Tables"]["profiles"]["Row"];
export type Role = Database["public"]["Enums"]["user_role"];

export const COOKIE_NAME = "roamly-user-id";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = (await cookies()).get(COOKIE_NAME)?.value;
  if (!userId) return null;
  const { data } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data ?? null;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user;
}

export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== role) redirect("/dashboard");
  return user;
}

export async function setCurrentUserCookie(userId: string) {
  (await cookies()).set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearCurrentUserCookie() {
  (await cookies()).delete(COOKIE_NAME);
}
