-- ==============================================================================
-- Western Boys Salon SaaS - Supabase Database RLS & Function Fix
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lojbmhekkfuyuhbajfgf/sql/new
-- ==============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Salons Table RLS Policies (Allow registration and browsing)
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_browse_active_salons" ON salons;
CREATE POLICY "public_browse_active_salons" ON salons FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_salons" ON salons;
CREATE POLICY "public_insert_salons" ON salons FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "owners_update_salons" ON salons;
CREATE POLICY "owners_update_salons" ON salons FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Salon Owners Table RLS Policies
ALTER TABLE salon_owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon_owners_select_policy" ON salon_owners;
CREATE POLICY "salon_owners_select_policy" ON salon_owners FOR SELECT USING (true);

DROP POLICY IF EXISTS "salon_owners_insert_policy" ON salon_owners;
CREATE POLICY "salon_owners_insert_policy" ON salon_owners FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "salon_owners_all_policy" ON salon_owners;
CREATE POLICY "salon_owners_all_policy" ON salon_owners FOR ALL USING (true);

-- 4. Services Table RLS Policies
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_browse_services" ON services;
CREATE POLICY "public_browse_services" ON services FOR SELECT USING (true);

DROP POLICY IF EXISTS "services_insert_policy" ON services;
CREATE POLICY "services_insert_policy" ON services FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "services_all_policy" ON services;
CREATE POLICY "services_all_policy" ON services FOR ALL USING (true);

-- 5. Appointments Table RLS Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appointments_all_policy" ON appointments;
CREATE POLICY "appointments_all_policy" ON appointments FOR ALL USING (true);

-- 6. Tokens Table RLS Policies
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tokens_all_policy" ON tokens;
CREATE POLICY "tokens_all_policy" ON tokens FOR ALL USING (true);

-- 7. Platform Super Admin Table & Function
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
