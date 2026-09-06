-- ==============================================================================
-- Seed Data for Multi-Tenant Western Boys Salon SaaS Platform
-- ==============================================================================

-- 1. Insert 2 Salons for Multi-Tenant Testing
INSERT INTO salons (
    id, name, slug, phone, email, address, city, state,
    subscription_plan, billing_cycle, subscription_status
) VALUES 
(
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Western Boys Salon (Vaishali Nagar)',
    'western-boys-salon',
    '+91 98765 43210',
    'contact@westernboyssalon.com',
    'Shop 14, Royal Heritage Arcade, Vaishali Nagar',
    'Jaipur',
    'Rajasthan',
    'base_monthly',
    'monthly',
    'active'
),
(
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'Western Grooming Lounge (Celebration Mall)',
    'western-grooming-lounge',
    '+91 98290 88776',
    'udaipur@westernboyssalon.com',
    'Level 2, Celebration Mall Complex, Bhuwana',
    'Udaipur',
    'Rajasthan',
    'yearly',
    '1_year',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Profiles for All Roles
INSERT INTO profiles (
    id, auth_user_id, salon_id, role, full_name, phone, email, specialties, rating
) VALUES 
-- Super Admin
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'super_admin',
    'Super Admin',
    '+91 99999 00000',
    'admin@westernboyssaas.com',
    ARRAY['Platform Overseer', 'Tenant Admin'],
    5.0
),
-- Multi-Salon Owner (Owns both Jaipur and Udaipur salons)
(
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'salon_owner',
    'Kabir Khan',
    '+91 98765 00001',
    'kabir@westernboyssalon.com',
    ARRAY['Executive Barber', 'Business Founder'],
    5.0
),
-- Single-Salon Owner (Owns Udaipur salon only)
(
    '66666666-6666-6666-6666-666666666666',
    '66666666-6666-6666-6666-666666666666',
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'salon_owner',
    'Rishi Mehra',
    '+91 98290 00006',
    'rishi@udaipurlounge.com',
    ARRAY['Stylist & Franchise Partner'],
    5.0
),
-- Jaipur Manager
(
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'manager',
    'Aman Sharma',
    '+91 98765 00002',
    'aman@westernboyssalon.com',
    ARRAY['Queue Operations', 'Client Relations'],
    4.9
),
-- Jaipur Staff Barber (Farhan)
(
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'staff',
    'Farhan Akhtar',
    '+91 98765 00003',
    'farhan@westernboyssalon.com',
    ARRAY['Skin Fade', 'Beard Sculpting', 'Razor Detail'],
    4.9
),
-- Jaipur Staff Barber (Vikram)
(
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'staff',
    'Vikram Singh',
    '+91 98765 00004',
    'vikram@westernboyssalon.com',
    ARRAY['Hair Coloring', 'Keratin Treatment'],
    4.8
),
-- Udaipur Staff Barber (Devendra)
(
    '77777777-7777-7777-7777-777777777777',
    '77777777-7777-7777-7777-777777777777',
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'staff',
    'Devendra Rajput',
    '+91 98290 00007',
    'devendra@udaipurlounge.com',
    ARRAY['Royal Shave', 'Beard Trim'],
    4.9
) ON CONFLICT (id) DO NOTHING;

-- 3. Link Salon Ownership via salon_owners Table
-- Kabir Khan owns BOTH Jaipur Flagship & Udaipur Branch
INSERT INTO salon_owners (user_id, salon_id, is_primary) VALUES 
('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', TRUE),
('11111111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', FALSE)
ON CONFLICT (user_id, salon_id) DO NOTHING;

-- Rishi Mehra owns ONLY Udaipur Branch
INSERT INTO salon_owners (user_id, salon_id, is_primary) VALUES 
('66666666-6666-6666-6666-666666666666', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', TRUE)
ON CONFLICT (user_id, salon_id) DO NOTHING;

-- 4. Insert Services for Jaipur Flagship
INSERT INTO services (
    id, salon_id, name, category, description, duration_minutes, in_salon_price, home_service_price
) VALUES 
(
    's1111111-1111-1111-1111-111111111111',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Signature Fade & Scissor Cut',
    'Hair',
    'Precision fade tailored to face structure, wash and matte styling.',
    30,
    250.00,
    450.00
),
(
    's2222222-2222-2222-2222-222222222222',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Royal Beard Sculpt & Hot Towel',
    'Beard',
    'Straight razor detailing, beard oil conditioning, and hot steam therapy.',
    25,
    180.00,
    320.00
),
(
    's3333333-3333-3333-3333-333333333333',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Gentlemen Combo (Hair + Beard)',
    'Combo',
    'Haircut + beard shaping + relaxing express head massage.',
    50,
    380.00,
    650.00
) ON CONFLICT (id) DO NOTHING;

-- 5. Insert Services for Udaipur Branch (Different Pricing to test isolation!)
INSERT INTO services (
    id, salon_id, name, category, description, duration_minutes, in_salon_price, home_service_price
) VALUES 
(
    'u1111111-1111-1111-1111-111111111111',
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'Lake City Fade & Styling',
    'Hair',
    'Udaipur special scissor cut and organic hair wash.',
    35,
    300.00,
    500.00
),
(
    'u2222222-2222-2222-2222-222222222222',
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'Maharaja Beard Grooming',
    'Beard',
    'Luxury sandalwood beard wash and contour razor shaping.',
    30,
    220.00,
    380.00
) ON CONFLICT (id) DO NOTHING;
