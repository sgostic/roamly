// Server-side Supabase client. Uses the service role to bypass RLS.
// When SUPABASE_SERVICE_ROLE_KEY is missing, falls back to the in-memory mock
// (see ./mock-client) so dev can proceed without Supabase configured.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { mockSupabaseAdmin } from "./mock-client";

type AdminClient = ReturnType<typeof createClient<Database>>;

function createSupabaseAdminClient(): AdminClient {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

const useMock = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

if (useMock) {
  // One-time warning so it's obvious which mode is active.
  console.warn(
    "[Supabase] SUPABASE_SERVICE_ROLE_KEY not set — using in-memory mock client. " +
      "Data persists in process memory and resets on restart.",
  );
}

let _client: AdminClient | undefined;

// SECURITY: Service-role client — never expose to client code.
// Import as: `import { supabaseAdmin } from "@/integrations/supabase/client.server"`.
export const supabaseAdmin = new Proxy({} as AdminClient, {
  get(_, prop, receiver) {
    if (!_client) {
      _client = useMock
        ? (mockSupabaseAdmin as unknown as AdminClient)
        : createSupabaseAdminClient();
    }
    return Reflect.get(_client, prop, receiver);
  },
});
