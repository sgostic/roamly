import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import type { Database } from "./types";

export type SupabaseAuthContext = {
  supabase: ReturnType<typeof createClient<Database>>;
  userId: string;
  claims: Record<string, unknown>;
};

/**
 * Reads the Authorization header and validates the Supabase JWT.
 * Use at the top of Server Actions that require authentication.
 * Throws a Response (401/500) on failure.
 */
export async function requireSupabaseAuth(): Promise<SupabaseAuthContext> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Add them to .env.`;
    console.error(`[Supabase] ${message}`);
    throw new Response(message, { status: 500 });
  }

  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader) {
    throw new Response("Unauthorized: No authorization header provided", { status: 401 });
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new Response("Unauthorized: Only Bearer tokens are supported", { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new Response("Unauthorized: No token provided", { status: 401 });
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    throw new Response("Unauthorized: Invalid token", { status: 401 });
  }

  if (!data.claims.sub) {
    throw new Response("Unauthorized: No user ID found in token", { status: 401 });
  }

  return {
    supabase,
    userId: data.claims.sub as string,
    claims: data.claims as Record<string, unknown>,
  };
}
