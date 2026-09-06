-- ==============================================================================
-- Western Boys Salon SaaS Platform - Complete Schema & Seed
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lojbmhekkfuyuhbajfgf/sql/new
-- ==============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running (safe order)
DROP TABLE IF EXISTS notifications_log CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS salon_owners CASCADE;
DROP TABLE IF EXISTS salons CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS service_location CASCADE;
DROP TYPE IF EXISTS booking_channel CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS token_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_gateway CASCADE;
DROP TYPE IF EXISTS subscription_plan_type CASCADE;
DROP TYPE IF EXISTS subscription_status_type CASCADE;

-- 3. Custom Types
CREATE TYPE user_role AS ENUM ('super_admin', 'salon_owner', 'manager', 'staff', 'customer');
CREATE TYPE service_location AS ENUM ('in_salon', 'home_service');
CREATE TYPE booking_channel AS ENUM ('whatsapp', 'web', 'walk_in');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'serving', 'completed', 'cancelled', 'no_show');
CREATE TYPE token_status AS ENUM ('waiting', 'serving', 'completed', 'skipped');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_gateway AS ENUM ('mock_razorpay', 'razorpay', 'cash', 'upi');
CREATE TYPE subscription_plan_type AS ENUM ('base_monthly', 'half_yearly', 'yearly');
CREATE TYPE subscription_status_type AS ENUM ('trial', 'active', 'past_due', 'expired');

-- ==============================================================================
-- 3b. Platform Super Admins Table & Audit Log
-- ==============================================================================
CREATE TABLE IF NOT EXISTS platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_salon_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. Salons Table (Tenants)
-- ==============================================================================
CREATE TABLE salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Jaipur',
    state VARCHAR(100) DEFAULT 'Rajasthan',
    pincode VARCHAR(10),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    logo_url TEXT,
    currency VARCHAR(10) DEFAULT 'INR',
    currency_symbol VARCHAR(5) DEFAULT '₹',
    upi_id VARCHAR(100) DEFAULT 'westernboys@upi',
    upi_qr_url TEXT,
    subscription_plan subscription_plan_type DEFAULT 'base_monthly',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    subscription_status subscription_status_type DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    subscription_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. Salon Owners Relationship Table (Multi-Salon Ownership)
-- ==============================================================================
CREATE TABLE salon_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, salon_id)
);

CREATE INDEX idx_salon_owners_user ON salon_owners(user_id);
CREATE INDEX idx_salon_owners_salon ON salon_owners(salon_id);

-- ==============================================================================
-- 6. Profiles (Staff, Managers, Super Admins, Customers)
-- ==============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'staff',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    specialties TEXT[],
    rating NUMERIC(2,1) DEFAULT 4.9,
    commission_rate NUMERIC(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_salon_id ON profiles(salon_id);
CREATE INDEX idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ==============================================================================
-- 7. Services & Dual Pricing
-- ==============================================================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    in_salon_price NUMERIC(10, 2) NOT NULL,
    home_service_price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_salon_id ON services(salon_id);

-- ==============================================================================
-- 8. Customers & Hair History
-- ==============================================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL, -- Compulsory identifier across platform
    email VARCHAR(255),
    address TEXT,
    allergy_notes TEXT,
    hair_preference_notes TEXT,
    behavior_notes TEXT,
    preferred_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    total_visits INT DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    last_visited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, phone)
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- ==============================================================================
-- 9. Appointments
-- ==============================================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    service_type service_location NOT NULL DEFAULT 'in_salon',
    booking_channel booking_channel NOT NULL DEFAULT 'web',
    appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_slot VARCHAR(20) NOT NULL,
    status appointment_status NOT NULL DEFAULT 'confirmed',
    amount NUMERIC(10, 2) NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_gateway payment_gateway NOT NULL DEFAULT 'mock_razorpay',
    payment_screenshot_url TEXT,
    payment_verified_at TIMESTAMPTZ,
    payment_verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    transaction_ref VARCHAR(255),
    notes TEXT,
    home_service_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_salon ON appointments(salon_id, appointment_date);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);

-- ==============================================================================
-- 10. Live Queue Tokens
-- ==============================================================================
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    stylist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    token_number INT NOT NULL,
    token_code VARCHAR(50) NOT NULL,
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status token_status NOT NULL DEFAULT 'waiting',
    estimated_wait_minutes INT DEFAULT 15,
    called_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, queue_date, token_number)
);

CREATE INDEX idx_tokens_salon_date ON tokens(salon_id, queue_date, status);

-- ==============================================================================
-- 11. Inventory
-- ==============================================================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'units',
    low_stock_threshold INT NOT NULL DEFAULT 5,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_salon ON inventory(salon_id);

-- ==============================================================================
-- 12. Invoices
-- ==============================================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_percent NUMERIC(5, 2) DEFAULT 18.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status payment_status DEFAULT 'completed',
    payment_method VARCHAR(50) DEFAULT 'Cash',
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_salon ON invoices(salon_id);

-- ==============================================================================
-- 13. WhatsApp & Notifications Log
-- ==============================================================================
CREATE TABLE notifications_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(255),
    notification_type VARCHAR(50) NOT NULL,
    message_content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 14. Server-Side Security Functions: Super Admin Check & Tenant Scoping
-- ==============================================================================
CREATE OR REPLACE FUNCTION is_platform_admin(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF check_email IS NULL OR check_email = '' THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM platform_admins WHERE LOWER(email) = LOWER(check_email)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_salon_ids()
RETURNS TABLE (salon_id UUID) AS $$
DECLARE
    user_role_val user_role;
    user_email_val TEXT;
BEGIN
    user_email_val := auth.jwt() ->> 'email';

    IF is_platform_admin(user_email_val) THEN
        RETURN QUERY SELECT id FROM salons;
    ELSE
        SELECT role INTO user_role_val FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
        IF user_role_val = 'super_admin' THEN
            RETURN QUERY SELECT id FROM salons;
        ELSIF user_role_val = 'salon_owner' THEN
            RETURN QUERY SELECT so.salon_id FROM salon_owners so WHERE so.user_id = auth.uid();
        ELSE
            RETURN QUERY SELECT p.salon_id FROM profiles p WHERE p.auth_user_id = auth.uid() AND p.salon_id IS NOT NULL;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 15. Row Level Security (RLS) Activation
-- ==============================================================================
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Public read for marketplace browsing
CREATE POLICY public_browse_active_salons ON salons FOR SELECT USING (true);
CREATE POLICY public_browse_services ON services FOR SELECT USING (is_active = true);
CREATE POLICY public_browse_staff ON profiles FOR SELECT USING (role = 'staff' AND is_active = true);
CREATE POLICY public_view_tokens ON tokens FOR SELECT USING (true);

-- Salon Owner / Manager / Staff Tenant Access
CREATE POLICY salon_owners_policy ON salon_owners FOR ALL USING (user_id = auth.uid());
CREATE POLICY profiles_tenant_access ON profiles FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()) OR auth_user_id = auth.uid());
CREATE POLICY services_tenant_access ON services FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()));
CREATE POLICY customers_tenant_access ON customers FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()));
CREATE POLICY appointments_tenant_access ON appointments FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()));
CREATE POLICY tokens_tenant_access ON tokens FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()));
CREATE POLICY inventory_tenant_access ON inventory FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()));
CREATE POLICY invoices_tenant_access ON invoices FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()));
CREATE POLICY notifications_tenant_access ON notifications_log FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()));

-- Customer can create bookings & appointments
CREATE POLICY public_create_customers ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY public_create_appointments ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY public_read_own_customer_history ON customers FOR SELECT USING (true);
CREATE POLICY public_read_own_appointments ON appointments FOR SELECT USING (true);

-- ==============================================================================
-- 16. Seed Data (Two Salons for Multi-Tenant Isolation Testing)
-- ==============================================================================

-- Salon A: Jaipur Flagship
INSERT INTO salons (
    id, name, slug, phone, email, address, city, state,
    subscription_plan, billing_cycle, subscription_status
) VALUES (
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
);

-- Salon B: Udaipur Branch
INSERT INTO salons (
    id, name, slug, phone, email, address, city, state,
    subscription_plan, billing_cycle, subscription_status
) VALUES (
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
);

-- Profiles & Platform Admins
-- 1. Super Admin Seed
INSERT INTO platform_admins (email) VALUES ('saifaliansari983790@gmail.com') ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, auth_user_id, salon_id, role, full_name, phone, email, specialties, rating)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'super_admin', 'Platform Super Admin', '+91 99999 00000', 'saifaliansari983790@gmail.com', ARRAY['Platform Overseer'], 5.0);

-- 2. Multi-Salon Owner: Kabir Khan (owns BOTH Jaipur and Udaipur)
INSERT INTO profiles (id, auth_user_id, salon_id, role, full_name, phone, email, specialties, rating)
VALUES ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'salon_owner', 'Kabir Khan', '+91 98765 00001', 'kabir@westernboyssalon.com', ARRAY['Founder & Master Stylist'], 5.0);

-- 3. Single-Salon Owner: Rishi Mehra (owns ONLY Udaipur)
INSERT INTO profiles (id, auth_user_id, salon_id, role, full_name, phone, email, specialties, rating)
VALUES ('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'salon_owner', 'Rishi Mehra', '+91 98290 00006', 'rishi@udaipurlounge.com', ARRAY['Franchise Partner'], 5.0);

-- 4. Jaipur Manager: Aman Sharma
INSERT INTO profiles (id, auth_user_id, salon_id, role, full_name, phone, email, specialties, rating)
VALUES ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'manager', 'Aman Sharma', '+91 98765 00002', 'aman@westernboyssalon.com', ARRAY['Operations Lead'], 4.9);

-- 5. Jaipur Staff Barber: Farhan Akhtar
INSERT INTO profiles (id, auth_user_id, salon_id, role, full_name, phone, email, specialties, rating, commission_rate)
VALUES ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'staff', 'Farhan Akhtar', '+91 98765 00003', 'farhan@westernboyssalon.com', ARRAY['Skin Fade', 'Beard Sculpting'], 4.9, 20.00);

-- 6. Udaipur Staff Barber: Devendra Rajput
INSERT INTO profiles (id, auth_user_id, salon_id, role, full_name, phone, email, specialties, rating, commission_rate)
VALUES ('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'staff', 'Devendra Rajput', '+91 98290 00007', 'devendra@udaipurlounge.com', ARRAY['Royal Shave', 'Beard Contour'], 4.8, 18.00);

-- Salon Ownership Links (Proper relationship table!)
-- Kabir owns both Jaipur & Udaipur
INSERT INTO salon_owners (user_id, salon_id, is_primary) VALUES
('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', TRUE),
('11111111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', FALSE);

-- Rishi owns ONLY Udaipur
INSERT INTO salon_owners (user_id, salon_id, is_primary) VALUES
('66666666-6666-6666-6666-666666666666', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', TRUE);

-- Jaipur Services
INSERT INTO services (id, salon_id, name, category, description, duration_minutes, in_salon_price, home_service_price) VALUES
('10000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Jaipur Signature Fade & Scissor Cut', 'Hair', 'Precision fade tailored to face structure, wash and matte styling.', 30, 250.00, 450.00),
('10000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Royal Beard Sculpt & Hot Towel', 'Beard', 'Straight razor detailing, beard oil conditioning, and hot steam therapy.', 25, 180.00, 320.00),
('10000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Gentlemen Combo (Hair + Beard)', 'Combo', 'Haircut + beard shaping + relaxing express head massage.', 50, 380.00, 650.00);

-- Udaipur Services (Distinct Pricing & Names to prove isolation!)
INSERT INTO services (id, salon_id, name, category, description, duration_minutes, in_salon_price, home_service_price) VALUES
('20000000-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Lake City Premium Scissor Cut & Spa', 'Hair', 'Udaipur special scissor cut and organic hair spa wash.', 35, 300.00, 500.00),
('20000000-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Maharaja Sandalwood Beard Detailing', 'Beard', 'Luxury sandalwood beard wash and contour razor shaping.', 30, 220.00, 380.00);

-- Seed Customers
INSERT INTO customers (id, salon_id, name, phone, email, allergy_notes, hair_preference_notes, behavior_notes, total_visits, total_spent) VALUES
('c0000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Sameer Khan', '+91 98290 11223', 'sameer@gmail.com', 'Sensitive skin on neck', 'Low skin taper fade, matte clay', 'Always punctual, prefers quiet service', 4, 1520.00),
('c0000000-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Prateek Jain', '+91 98290 33445', 'prateek@gmail.com', 'None', 'Pompadour, scissor-cut sides', 'Loves coffee while getting haircut', 2, 720.00);
