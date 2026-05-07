-- Roamly demo seed: 3 travelers, 6 providers, 6 travel requests, 6 offers.
-- Idempotent via ON CONFLICT DO NOTHING so re-running is safe.

-- Travelers
insert into public.profiles (id, email, display_name, role, bio) values
  ('11111111-1111-1111-1111-000000000001', 'alex@demo.com',   'Alex Morgan',  'traveler', 'Anniversary trip planner. Loves boutique stays.'),
  ('11111111-1111-1111-1111-000000000002', 'jordan@demo.com', 'Jordan Kim',   'traveler', 'First-time traveler to Asia. Foodie at heart.'),
  ('11111111-1111-1111-1111-000000000003', 'sam@demo.com',    'Sam Hayes',    'traveler', 'Adventurer + city explorer.')
on conflict (id) do nothing;

-- Providers
insert into public.profiles (id, email, display_name, role, company_name, bio) values
  ('22222222-2222-2222-2222-000000000001', 'helena@demo.com', 'Helena Pappas',  'provider', 'Aegean Boutique Travel', 'Specialist in Greek island getaways.'),
  ('22222222-2222-2222-2222-000000000002', 'nikos@demo.com',  'Nikos Travels',  'provider', 'Cyclades & Co.',         'Cyclades local with 12 years guiding visitors.'),
  ('22222222-2222-2222-2222-000000000003', 'marina@demo.com', 'Marina Atlas',   'provider', 'Atlas Private Villas',   'Curated cliffside villas with private chefs.'),
  ('22222222-2222-2222-2222-000000000004', 'lukas@demo.com',  'Lukas Berger',   'provider', 'Alpine Family Trips',    'Family-friendly Alpine adventures.'),
  ('22222222-2222-2222-2222-000000000005', 'sofia@demo.com',  'Sofía Ramírez',  'provider', 'Pura Vida Family',       'Wildlife-rich Costa Rica trips for families.'),
  ('22222222-2222-2222-2222-000000000006', 'yuki@demo.com',   'Yuki Tanaka',    'provider', 'Sakura Trails',          'Bilingual Tokyo + Kyoto cultural specialist.')
on conflict (id) do nothing;

-- Travel requests
insert into public.travel_requests (
  id, traveler_id, destination, flexible_destination,
  date_start, date_end, budget_min, budget_max, currency,
  travelers_count, preferences, notes, status, expires_at, created_at
) values
  ('33333333-3333-3333-3333-000000000001', '11111111-1111-1111-1111-000000000001',
   'Santorini, Greece', false,
   '2026-06-12', '2026-06-19', 1800, 2800, 'USD',
   2, array['Romantic','Beach','Foodie'],
   'Anniversary trip. Looking for a quiet boutique stay near the caldera with sunset views.',
   'open', '2027-12-31', '2026-05-01'),

  ('33333333-3333-3333-3333-000000000002', '11111111-1111-1111-1111-000000000001',
   null, true,
   '2026-07-20', '2026-07-30', 3500, 5000, 'USD',
   4, array['Family-friendly','Adventure','Nature'],
   'Family with two kids (8 and 11). Open to anywhere with hiking, lakes, fun for kids.',
   'open', '2027-12-31', '2026-04-28'),

  ('33333333-3333-3333-3333-000000000003', '11111111-1111-1111-1111-000000000002',
   'Tokyo, Japan', false,
   '2026-09-05', '2026-09-15', 2500, 4000, 'USD',
   2, array['Culture','Foodie','City'],
   'First time in Japan. Want to mix Tokyo with a side trip to Kyoto.',
   'open', '2027-12-31', '2026-04-25'),

  ('33333333-3333-3333-3333-000000000004', '11111111-1111-1111-1111-000000000002',
   'Bali, Indonesia', false,
   '2026-08-01', '2026-08-14', 1200, 2000, 'USD',
   1, array['Wellness','Beach','Budget'],
   'Solo retreat. Yoga, surf, healthy food.',
   'open', '2027-12-31', '2026-04-20'),

  ('33333333-3333-3333-3333-000000000005', '11111111-1111-1111-1111-000000000003',
   'Reykjavík, Iceland', false,
   '2026-11-10', '2026-11-17', 2200, 3200, 'USD',
   2, array['Adventure','Nature'],
   'Northern lights, glacier hike, hot springs.',
   'open', '2027-12-31', '2026-04-15'),

  ('33333333-3333-3333-3333-000000000006', '11111111-1111-1111-1111-000000000003',
   'Lisbon, Portugal', false,
   '2026-05-25', '2026-06-01', 1500, 2200, 'USD',
   3, array['City','Foodie','Nightlife'],
   'Friends trip. Want a lively neighborhood and great restaurants.',
   'open', '2027-12-31', '2026-04-10')
on conflict (id) do nothing;

-- Offers
insert into public.offers (
  id, request_id, provider_id, title, price_total, currency,
  accommodation, included_services, photos, description,
  status, expires_at, created_at
) values
  -- Santorini (r1) — 3 offers
  ('44444444-4444-4444-4444-000000000001',
   '33333333-3333-3333-3333-000000000001',
   '22222222-2222-2222-2222-000000000001',
   '7 nights at Caldera Suites + sunset cruise',
   2450, 'USD',
   'Caldera Suites — Caldera-view room, private terrace',
   array['Transfers','Breakfast','Tours'],
   array[
     'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
     'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=800&q=80'
   ],
   'Our signature Santorini package: 7 nights in Oia with caldera views, private airport transfers, daily breakfast, and a private sunset catamaran cruise with dinner.',
   'pending', '2027-12-31', '2026-05-02'),

  ('44444444-4444-4444-4444-000000000002',
   '33333333-3333-3333-3333-000000000001',
   '22222222-2222-2222-2222-000000000002',
   'Boutique stay in Imerovigli + winery tour',
   2180, 'USD',
   'Sun Rocks Hotel — Junior suite with plunge pool',
   array['Breakfast','Tours'],
   array['https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?auto=format&fit=crop&w=800&q=80'],
   'Quieter Imerovigli base with one of the best caldera panoramas. Includes a half-day Santo Wines tasting tour.',
   'pending', '2027-12-31', '2026-05-03'),

  ('44444444-4444-4444-4444-000000000003',
   '33333333-3333-3333-3333-000000000001',
   '22222222-2222-2222-2222-000000000003',
   'Luxury cliffside villa, fully private',
   2780, 'USD',
   'Private 1-bedroom villa in Oia with infinity pool',
   array['Transfers','Breakfast','All meals'],
   array['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
   'Exclusive standalone villa with a heated infinity pool right on the cliff. In-villa chef on three evenings.',
   'pending', '2027-12-31', '2026-05-04'),

  -- Family flexible (r2) — 2 offers
  ('44444444-4444-4444-4444-000000000004',
   '33333333-3333-3333-3333-000000000002',
   '22222222-2222-2222-2222-000000000004',
   '10 days in the Swiss Alps for the family',
   4600, 'USD',
   'Family chalet in Interlaken, 3 bedrooms',
   array['Car rental','Breakfast','Tours'],
   array['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'],
   'Lakes, hiking, kid-safe via ferrata, and a day at a wildlife park.',
   'pending', '2027-12-31', '2026-04-30'),

  ('44444444-4444-4444-4444-000000000005',
   '33333333-3333-3333-3333-000000000002',
   '22222222-2222-2222-2222-000000000005',
   'Costa Rica adventure & wildlife (10 days)',
   4200, 'USD',
   'Eco-lodges in Arenal + Manuel Antonio',
   array['Transfers','Breakfast','Tours','Guide'],
   array['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80'],
   'Volcano hike, sloth & monkey spotting, beach time. Designed for kids 6–12.',
   'pending', '2027-12-31', '2026-05-01'),

  -- Tokyo (r3) — 1 offer
  ('44444444-4444-4444-4444-000000000006',
   '33333333-3333-3333-3333-000000000003',
   '22222222-2222-2222-2222-000000000006',
   'Tokyo + Kyoto cultural immersion',
   3100, 'USD',
   'Boutique hotel Shibuya + ryokan in Higashiyama',
   array['Transfers','Tours','Guide'],
   array['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
   'Mixed modern Tokyo + traditional Kyoto. Includes JR pass and tea ceremony.',
   'pending', '2027-12-31', '2026-04-27')

  -- r4 (Bali), r5 (Iceland), r6 (Lisbon) intentionally have no offers yet.
on conflict (id) do nothing;
