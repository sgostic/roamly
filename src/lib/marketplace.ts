import type { Database } from "@/integrations/supabase/types";

export type TravelRequestRow = Database["public"]["Tables"]["travel_requests"]["Row"];
export type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ActivityEventRow = Database["public"]["Tables"]["activity_events"]["Row"];

// What RequestCard renders — a request row plus the count of offers received.
export type TravelRequest = TravelRequestRow & { offers_count: number };

// What offer cards render — an offer row plus the provider's display info,
// joined in via the FK on offers.provider_id.
export type OfferWithProvider = OfferRow & {
  provider: Pick<ProfileRow, "display_name" | "company_name"> | null;
};

export const PREFERENCES = [
  "Luxury",
  "Budget",
  "Family-friendly",
  "Romantic",
  "Adventure",
  "Beach",
  "Nightlife",
  "Culture",
  "Foodie",
  "Wellness",
  "Nature",
  "City",
] as const;

export const SERVICES = [
  "Flights",
  "Transfers",
  "Breakfast",
  "All meals",
  "Tours",
  "Car rental",
  "Insurance",
  "Guide",
] as const;
