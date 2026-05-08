import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type EventType = Database["public"]["Enums"]["activity_event_type"];
type UserRole = Database["public"]["Enums"]["user_role"];

export type LogEventInput = {
  type: EventType;
  actorId?: string | null;
  actorRole?: UserRole | null;
  targetType?: "request" | "offer" | "profile" | "page" | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

// Append a row to activity_events. Never throws — a failed log must not break a mutation.
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("activity_events").insert({
      event_type: input.type,
      actor_id: input.actorId ?? null,
      actor_role: input.actorRole ?? null,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      metadata: (input.metadata ??
        {}) as Database["public"]["Tables"]["activity_events"]["Insert"]["metadata"],
    });
    if (error) console.error("[activity] logEvent insert error", input.type, error);
  } catch (err) {
    console.error("[activity] logEvent threw", input.type, err);
  }
}
