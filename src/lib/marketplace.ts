import type { Database } from "@/integrations/supabase/types";

export type TravelRequest = Database["public"]["Tables"]["travel_requests"]["Row"];
export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const PREFERENCES = [
  "Luxury", "Budget", "Family-friendly", "Romantic",
  "Adventure", "Beach", "Nightlife", "Culture",
  "Foodie", "Wellness", "Nature", "City",
] as const;

export const SERVICES = [
  "Flights", "Transfers", "Breakfast", "All meals",
  "Tours", "Car rental", "Insurance", "Guide",
] as const;
