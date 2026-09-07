-- ==============================================================================
-- Western Boys Salon SaaS - Combined Production Migration Script
-- Idempotent: Safe to run multiple times in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lojbmhekkfuyuhbajfgf/sql/new
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enums (Idempotent creation)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'salon_owner', 'manager', 'staff', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE service_location AS ENUM ('in_salon', 'home_service');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE booking_channel AS ENUM ('whatsapp', 'web', 'walk_in');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'serving', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE token_status AS ENUM ('waiting', 'serving', 'completed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_gateway AS ENUM ('mock_razorpay', 'razorpay', 'cash', 'upi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_plan_type AS ENUM ('base_monthly', 'half_yearly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status_type AS ENUM ('trial', 'active', 'past_due', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Super Admin Table & Function
CREATE TABLE IF NOT EXISTS platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_admins (email) 
VALUES ('saifaliansari983790@gmail.com')
ON CONFLICT (email) DO NOTHING;

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

-- 4. Tables Creation

-- Salons (Tenants)
CREATE TABLE IF NOT EXISTS salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Jaipur',
    state VARCHAR(100) DEFAULT 'Rajasthan',
    pincode VARCHAR(20),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    logo_url TEXT,
    upi_id VARCHAR(100) DEFAULT 'westernboys@okhdfcbank',
    upi_qr_url TEXT,
    owner_name VARCHAR(255),
    owner_email VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'INR',
    currency_symbol VARCHAR(5) DEFAULT '₹',
    subscription_plan subscription_plan_type DEFAULT 'base_monthly',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    subscription_status subscription_status_type DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    subscription_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salon Owners Mapping
CREATE TABLE IF NOT EXISTS salon_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, salon_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_owners_user ON salon_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_salon_owners_salon ON salon_owners(salon_id);

-- Profiles (Staff / Stylists / Managers)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'staff',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    specialties TEXT[],
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "21:00", "days": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}'::jsonb,
    rating NUMERIC(2,1) DEFAULT 5.0,
    commission_rate NUMERIC(5,2) DEFAULT 15.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_salon_id ON profiles(salon_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Services
CREATE TABLE IF NOT EXISTS services (
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

CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_customers_salon_phone ON customers(salon_id, phone);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    staff_name VARCHAR(255),
    service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
    service_name VARCHAR(255) NOT NULL,
    service_type service_location NOT NULL DEFAULT 'in_salon',
    booking_channel booking_channel NOT NULL DEFAULT 'web',
    appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_slot VARCHAR(20) NOT NULL,
    status appointment_status NOT NULL DEFAULT 'pending',
    amount NUMERIC(10, 2) NOT NULL,
    full_service_price NUMERIC(10, 2),
    token_fee NUMERIC(10, 2),
    balance_due NUMERIC(10, 2),
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_gateway payment_gateway NOT NULL DEFAULT 'upi',
    payment_screenshot_url TEXT,
    payment_verified_at TIMESTAMPTZ,
    payment_verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    transaction_ref VARCHAR(255),
    notes TEXT,
    home_service_address TEXT,
    token_code VARCHAR(50),
    token_number INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade existing appointments table columns and constraints idempotently
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_name VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS token_code VARCHAR(50);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS token_number INT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS full_service_price NUMERIC(10, 2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS token_fee NUMERIC(10, 2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10, 2);
ALTER TABLE appointments ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_salon_date ON appointments(salon_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(staff_id);

-- Structural Unique Constraint: No two appointments in the same salon on the same date can share a token number
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_salon_date_token 
ON appointments (salon_id, appointment_date, token_number)
WHERE token_number IS NOT NULL;

-- Atomic Daily Token Counter Table (Row-Level Locked)
CREATE TABLE IF NOT EXISTS salon_daily_token_counters (
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_token_number INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (salon_id, queue_date)
);

-- Atomic Token Number Generator Function (Zero race conditions under concurrency)
CREATE OR REPLACE FUNCTION generate_next_token_number(p_salon_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INT AS $$
DECLARE
    next_num INT;
BEGIN
    INSERT INTO salon_daily_token_counters (salon_id, queue_date, last_token_number)
    VALUES (p_salon_id, p_date, 1)
    ON CONFLICT (salon_id, queue_date)
    DO UPDATE SET 
        last_token_number = salon_daily_token_counters.last_token_number + 1,
        updated_at = NOW()
    RETURNING last_token_number INTO next_num;
    
    RETURN next_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_next_token_number(UUID, DATE) TO anon, authenticated, service_role;

-- Tokens
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    stylist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    token_number INT NOT NULL,
    token_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status token_status NOT NULL DEFAULT 'waiting',
    is_verified BOOLEAN DEFAULT FALSE,
    estimated_wait_minutes INT DEFAULT 15,
    called_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, queue_date, token_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tokens_salon_date_number ON tokens(salon_id, queue_date, token_number);
CREATE INDEX IF NOT EXISTS idx_tokens_salon_date ON tokens(salon_id, queue_date, status);
CREATE INDEX IF NOT EXISTS idx_tokens_code ON tokens(token_code);

-- Notification Logs (Salon Scoped)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_salon ON notification_logs(salon_id, created_at DESC);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'units',
    low_stock_threshold INT NOT NULL DEFAULT 5,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    supplier_info TEXT,
    last_restocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_percent NUMERIC(5, 2) DEFAULT 18.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status payment_status DEFAULT 'completed',
    payment_method VARCHAR(50) DEFAULT 'UPI',
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id TEXT PRIMARY KEY,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_salon_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_salon ON admin_audit_logs(target_salon_id);

-- 5. Dynamic Multi-Tenant Helper Function
CREATE OR REPLACE FUNCTION get_user_salon_ids()
RETURNS TABLE (salon_id UUID) AS $$
DECLARE
    u_role user_role;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN;
    END IF;

    -- Check if Super Admin
    IF EXISTS (
        SELECT 1 FROM platform_admins pa 
        JOIN auth.users au ON LOWER(pa.email) = LOWER(au.email) 
        WHERE au.id = auth.uid()
    ) THEN
        RETURN QUERY SELECT id FROM salons;
        RETURN;
    END IF;

    -- Check profile role
    SELECT role INTO u_role FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;

    IF u_role = 'super_admin' THEN
        RETURN QUERY SELECT id FROM salons;
    ELSIF u_role = 'salon_owner' THEN
        RETURN QUERY SELECT so.salon_id FROM salon_owners so WHERE so.user_id = auth.uid();
    ELSIF u_role IN ('manager', 'staff') THEN
        RETURN QUERY SELECT p.salon_id FROM profiles p WHERE p.auth_user_id = auth.uid() AND p.salon_id IS NOT NULL;
    ELSE
        -- Fallback check in salon_owners directly
        RETURN QUERY SELECT so.salon_id FROM salon_owners so WHERE so.user_id = auth.uid();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security Definer helper to prevent infinite recursion in profiles RLS
CREATE OR REPLACE FUNCTION get_manager_salon_ids()
RETURNS TABLE (salon_id UUID) AS $$
BEGIN
    RETURN QUERY SELECT p.salon_id FROM profiles p WHERE p.auth_user_id = auth.uid() AND p.role = 'manager' AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

-- Salons Table RLS
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_browse_active_salons" ON salons;
CREATE POLICY "public_browse_active_salons" ON salons 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_salons" ON salons;
CREATE POLICY "public_insert_salons" ON salons 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "owners_update_salons" ON salons;
CREATE POLICY "owners_update_salons" ON salons 
FOR UPDATE USING (
    id IN (SELECT get_user_salon_ids())
);

-- Salon Owners Table RLS
ALTER TABLE salon_owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon_owners_select_policy" ON salon_owners;
CREATE POLICY "salon_owners_select_policy" ON salon_owners 
FOR SELECT USING (user_id = auth.uid() OR is_platform_admin((SELECT email FROM auth.users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "salon_owners_insert_policy" ON salon_owners;
CREATE POLICY "salon_owners_insert_policy" ON salon_owners 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "salon_owners_all_policy" ON salon_owners;
CREATE POLICY "salon_owners_all_policy" ON salon_owners 
FOR ALL USING (user_id = auth.uid() OR is_platform_admin((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Profiles Table RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_browse_staff" ON profiles;
CREATE POLICY "public_browse_staff" ON profiles 
FOR SELECT USING (role = 'staff' AND is_active = true);

DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
CREATE POLICY "users_read_own_profile" ON profiles 
FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "owners_manage_salon_profiles" ON profiles;
CREATE POLICY "owners_manage_salon_profiles" ON profiles 
FOR ALL USING (
    salon_id IN (SELECT salon_id FROM salon_owners WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "managers_view_salon_team" ON profiles;
CREATE POLICY "managers_view_salon_team" ON profiles 
FOR SELECT USING (
    salon_id IN (SELECT get_manager_salon_ids())
);

DROP POLICY IF EXISTS "managers_insert_staff" ON profiles;
CREATE POLICY "managers_insert_staff" ON profiles 
FOR INSERT WITH CHECK (
    salon_id IN (SELECT get_manager_salon_ids())
    AND role = 'staff'
);

DROP POLICY IF EXISTS "managers_update_staff" ON profiles;
CREATE POLICY "managers_update_staff" ON profiles 
FOR UPDATE USING (
    salon_id IN (SELECT get_manager_salon_ids())
    AND role = 'staff'
) WITH CHECK (role = 'staff');

-- Services Table RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_browse_services" ON services;
CREATE POLICY "public_browse_services" ON services 
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "management_manage_services" ON services;
CREATE POLICY "management_manage_services" ON services 
FOR ALL USING (
    salon_id IN (SELECT get_user_salon_ids())
);

-- Customers Table RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_create_customers" ON customers;
CREATE POLICY "public_create_customers" ON customers 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "management_view_customers" ON customers;
CREATE POLICY "management_view_customers" ON customers 
FOR ALL USING (
    salon_id IN (SELECT get_user_salon_ids())
);

-- Appointments Table RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_create_appointments" ON appointments;
CREATE POLICY "public_create_appointments" ON appointments 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "staff_view_assigned_appointments" ON appointments;
CREATE POLICY "staff_view_assigned_appointments" ON appointments 
FOR SELECT USING (
    staff_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid() AND is_active = true)
    OR salon_id IN (SELECT get_user_salon_ids())
);

DROP POLICY IF EXISTS "staff_update_assigned_appointments" ON appointments;
CREATE POLICY "staff_update_assigned_appointments" ON appointments 
FOR UPDATE USING (
    staff_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid() AND is_active = true)
    OR salon_id IN (SELECT get_user_salon_ids())
);

-- Tokens Table RLS
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_view_tokens" ON tokens;
CREATE POLICY "public_view_tokens" ON tokens 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_create_tokens" ON tokens;
CREATE POLICY "public_create_tokens" ON tokens 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "management_manage_tokens" ON tokens;
CREATE POLICY "management_manage_tokens" ON tokens 
FOR ALL USING (
    salon_id IN (SELECT get_user_salon_ids())
);

-- Invoices Table RLS (Strictly Owners & Managers - Staff excluded)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_management_access" ON invoices;
CREATE POLICY "invoices_management_access" ON invoices 
FOR ALL USING (
    salon_id IN (SELECT get_user_salon_ids())
    AND (
        (SELECT role FROM profiles WHERE auth_user_id = auth.uid()) IN ('salon_owner', 'manager', 'super_admin')
        OR auth.uid() IN (SELECT user_id FROM salon_owners)
    )
);

-- Audit Logs Table RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_public_insert" ON admin_audit_logs;
CREATE POLICY "audit_logs_public_insert" ON admin_audit_logs 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "audit_logs_super_admin_select" ON admin_audit_logs;
CREATE POLICY "audit_logs_super_admin_select" ON admin_audit_logs 
FOR SELECT USING (true);

-- Salon Daily Token Counters RLS
ALTER TABLE salon_daily_token_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_token_counters_select" ON salon_daily_token_counters;
CREATE POLICY "public_token_counters_select" ON salon_daily_token_counters 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_token_counters_all" ON salon_daily_token_counters;
CREATE POLICY "public_token_counters_all" ON salon_daily_token_counters 
FOR ALL USING (true) WITH CHECK (true);

-- Notification Logs RLS (Strict Salon Scoping)
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_logs_public_insert" ON notification_logs;
CREATE POLICY "notification_logs_public_insert" ON notification_logs 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "notification_logs_salon_scope" ON notification_logs;
CREATE POLICY "notification_logs_salon_scope" ON notification_logs 
FOR SELECT USING (
    salon_id IN (SELECT get_user_salon_ids())
);

-- 7. Private Supabase Storage Bucket & Storage RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-receipts',
    'payment-receipts',
    false, -- Strictly private
    5242880, -- 5 MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Allow public / customer to upload their payment screenshot to payment-receipts
DROP POLICY IF EXISTS "allow_receipt_upload" ON storage.objects;
CREATE POLICY "allow_receipt_upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payment-receipts');

-- Allow only owners and managers of that salon or super admin to read/sign URLs
DROP POLICY IF EXISTS "allow_receipt_read_management" ON storage.objects;
CREATE POLICY "allow_receipt_read_management" ON storage.objects
FOR SELECT USING (
    bucket_id = 'payment-receipts'
    AND (
        -- Super Admin
        is_platform_admin((SELECT email FROM auth.users WHERE id = auth.uid()))
        OR (SELECT role FROM profiles WHERE auth_user_id = auth.uid()) = 'super_admin'
        -- Or user owns or manages this salon folder
        OR (storage.foldername(name))[1]::uuid IN (
            SELECT salon_id FROM salon_owners WHERE user_id = auth.uid()
        )
        OR (storage.foldername(name))[1]::uuid IN (
            SELECT salon_id FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager' AND is_active = true
        )
    )
);
