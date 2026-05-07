export type Offer = {
  id: string;
  request_id: string;
  title: string;
  provider_name: string;
  provider_company?: string;
  price_total: number;
  currency: string;
  accommodation: string;
  included_services: string[];
  photos: string[];
  description: string;
  status: "pending" | "accepted" | "rejected";
  expires_at: string;
};

export type TravelRequest = {
  id: string;
  destination: string | null;
  flexible_destination: boolean;
  date_start: string;
  date_end: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  travelers_count: number;
  preferences: string[];
  notes: string;
  status: "open" | "closed" | "expired";
  created_at: string;
  offers_count: number;
};

export const PREFERENCES = [
  "Luxury", "Budget", "Family-friendly", "Romantic",
  "Adventure", "Beach", "Nightlife", "Culture",
  "Foodie", "Wellness", "Nature", "City",
] as const;

export const SERVICES = [
  "Flights", "Transfers", "Breakfast", "All meals",
  "Tours", "Car rental", "Insurance", "Guide",
] as const;

export const MOCK_REQUESTS: TravelRequest[] = [
  {
    id: "r1",
    destination: "Santorini, Greece",
    flexible_destination: false,
    date_start: "2026-06-12",
    date_end: "2026-06-19",
    budget_min: 1800,
    budget_max: 2800,
    currency: "USD",
    travelers_count: 2,
    preferences: ["Romantic", "Beach", "Foodie"],
    notes: "Anniversary trip. Looking for a quiet boutique stay near the caldera with sunset views.",
    status: "open",
    created_at: "2026-05-01",
    offers_count: 7,
  },
  {
    id: "r2",
    destination: null,
    flexible_destination: true,
    date_start: "2026-07-20",
    date_end: "2026-07-30",
    budget_min: 3500,
    budget_max: 5000,
    currency: "USD",
    travelers_count: 4,
    preferences: ["Family-friendly", "Adventure", "Nature"],
    notes: "Family with two kids (8 and 11). Open to anywhere with hiking, lakes, fun for kids.",
    status: "open",
    created_at: "2026-04-28",
    offers_count: 12,
  },
  {
    id: "r3",
    destination: "Tokyo, Japan",
    flexible_destination: false,
    date_start: "2026-09-05",
    date_end: "2026-09-15",
    budget_min: 2500,
    budget_max: 4000,
    currency: "USD",
    travelers_count: 2,
    preferences: ["Culture", "Foodie", "City"],
    notes: "First time in Japan. Want to mix Tokyo with a side trip to Kyoto.",
    status: "open",
    created_at: "2026-04-25",
    offers_count: 5,
  },
  {
    id: "r4",
    destination: "Bali, Indonesia",
    flexible_destination: false,
    date_start: "2026-08-01",
    date_end: "2026-08-14",
    budget_min: 1200,
    budget_max: 2000,
    currency: "USD",
    travelers_count: 1,
    preferences: ["Wellness", "Beach", "Budget"],
    notes: "Solo retreat. Yoga, surf, healthy food.",
    status: "open",
    created_at: "2026-04-20",
    offers_count: 9,
  },
  {
    id: "r5",
    destination: "Reykjavík, Iceland",
    flexible_destination: false,
    date_start: "2026-11-10",
    date_end: "2026-11-17",
    budget_min: 2200,
    budget_max: 3200,
    currency: "USD",
    travelers_count: 2,
    preferences: ["Adventure", "Nature"],
    notes: "Northern lights, glacier hike, hot springs.",
    status: "open",
    created_at: "2026-04-15",
    offers_count: 4,
  },
  {
    id: "r6",
    destination: "Lisbon, Portugal",
    flexible_destination: false,
    date_start: "2026-05-25",
    date_end: "2026-06-01",
    budget_min: 1500,
    budget_max: 2200,
    currency: "USD",
    travelers_count: 3,
    preferences: ["City", "Foodie", "Nightlife"],
    notes: "Friends trip. Want a lively neighborhood and great restaurants.",
    status: "open",
    created_at: "2026-04-10",
    offers_count: 8,
  },
];

export const MOCK_OFFERS: Record<string, Offer[]> = {
  r1: [
    {
      id: "o1",
      request_id: "r1",
      title: "7 nights at Caldera Suites + sunset cruise",
      provider_name: "Helena Pappas",
      provider_company: "Aegean Boutique Travel",
      price_total: 2450,
      currency: "USD",
      accommodation: "Caldera Suites — Caldera-view room, private terrace",
      included_services: ["Transfers", "Breakfast", "Tours"],
      photos: [
        "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=800&q=80",
      ],
      description:
        "Our signature Santorini package: 7 nights in Oia with caldera views, private airport transfers, daily breakfast, and a private sunset catamaran cruise with dinner.",
      status: "pending",
      expires_at: "2026-05-18",
    },
    {
      id: "o2",
      request_id: "r1",
      title: "Boutique stay in Imerovigli + winery tour",
      provider_name: "Nikos Travels",
      provider_company: "Cyclades & Co.",
      price_total: 2180,
      currency: "USD",
      accommodation: "Sun Rocks Hotel — Junior suite with plunge pool",
      included_services: ["Breakfast", "Tours"],
      photos: [
        "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?auto=format&fit=crop&w=800&q=80",
      ],
      description:
        "Quieter Imerovigli base with one of the best caldera panoramas. Includes a half-day Santo Wines tasting tour.",
      status: "pending",
      expires_at: "2026-05-20",
    },
    {
      id: "o3",
      request_id: "r1",
      title: "Luxury cliffside villa, fully private",
      provider_name: "Marina Atlas",
      provider_company: "Atlas Private Villas",
      price_total: 2780,
      currency: "USD",
      accommodation: "Private 1-bedroom villa in Oia with infinity pool",
      included_services: ["Transfers", "Breakfast", "All meals"],
      photos: [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      ],
      description:
        "Exclusive standalone villa with a heated infinity pool right on the cliff. In-villa chef on three evenings.",
      status: "pending",
      expires_at: "2026-05-22",
    },
  ],
  r2: [
    {
      id: "o4",
      request_id: "r2",
      title: "10 days in the Swiss Alps for the family",
      provider_name: "Lukas Berger",
      provider_company: "Alpine Family Trips",
      price_total: 4600,
      currency: "USD",
      accommodation: "Family chalet in Interlaken, 3 bedrooms",
      included_services: ["Car rental", "Breakfast", "Tours"],
      photos: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"],
      description: "Lakes, hiking, kid-safe via ferrata, and a day at a wildlife park.",
      status: "pending",
      expires_at: "2026-05-25",
    },
    {
      id: "o5",
      request_id: "r2",
      title: "Costa Rica adventure & wildlife (10 days)",
      provider_name: "Sofía Ramírez",
      provider_company: "Pura Vida Family",
      price_total: 4200,
      currency: "USD",
      accommodation: "Eco-lodges in Arenal + Manuel Antonio",
      included_services: ["Transfers", "Breakfast", "Tours", "Guide"],
      photos: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80"],
      description: "Volcano hike, sloth & monkey spotting, beach time. Designed for kids 6–12.",
      status: "pending",
      expires_at: "2026-05-28",
    },
  ],
  r3: [
    {
      id: "o6",
      request_id: "r3",
      title: "Tokyo + Kyoto cultural immersion",
      provider_name: "Yuki Tanaka",
      provider_company: "Sakura Trails",
      price_total: 3100,
      currency: "USD",
      accommodation: "Boutique hotel Shibuya + ryokan in Higashiyama",
      included_services: ["Transfers", "Tours", "Guide"],
      photos: ["https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80"],
      description: "Mixed modern Tokyo + traditional Kyoto. Includes JR pass and tea ceremony.",
      status: "pending",
      expires_at: "2026-06-01",
    },
  ],
  r4: [],
  r5: [],
  r6: [],
};
