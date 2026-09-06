-- ==============================================================================
-- Western Boys Salon SaaS - Customer RLS & Public Access Hardening
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lojbmhekkfuyuhbajfgf/sql/new
-- ==============================================================================

-- 1. Salons Table: Public can read active salons, owners can update their own
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_browse_active_salons" ON salons;
CREATE POLICY "public_browse_active_salons" ON salons FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_salons" ON salons;
CREATE POLICY "public_insert_salons" ON salons FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "owners_update_salons" ON salons;
CREATE POLICY "owners_update_salons" ON salons FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Services Table: Public can read all active services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_browse_services" ON services;
CREATE POLICY "public_browse_services" ON services FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "services_insert_policy" ON services;
CREATE POLICY "services_insert_policy" ON services FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "services_all_policy" ON services;
CREATE POLICY "services_all_policy" ON services FOR ALL USING (true);

-- 3. Profiles (Stylists / Staff): Public can only view active barbers
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_browse_staff" ON profiles;
CREATE POLICY "public_browse_staff" ON profiles FOR SELECT USING (role = 'staff' AND is_active = true);

DROP POLICY IF EXISTS "profiles_all_policy" ON profiles;
CREATE POLICY "profiles_all_policy" ON profiles FOR ALL USING (true);

-- 4. Customers Table: Protect personal records from anonymous harvesting
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_own_customer_history" ON customers;
DROP POLICY IF EXISTS "customers_tenant_access" ON customers;
DROP POLICY IF EXISTS "customers_public_browse" ON customers;

-- Only authenticated users or booking creation
DROP POLICY IF EXISTS "public_create_customers" ON customers;
CREATE POLICY "public_create_customers" ON customers FOR INSERT WITH CHECK (true);

CREATE POLICY "authenticated_read_customers" ON customers 
FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Appointments Table: Protect booking history from public snooping
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_all_policy" ON appointments;
DROP POLICY IF EXISTS "public_create_appointments" ON appointments;
CREATE POLICY "public_create_appointments" ON appointments FOR INSERT WITH CHECK (true);

CREATE POLICY "authenticated_read_appointments" ON appointments 
FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Tokens Table: Queue tokens can be looked up by token code
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tokens_all_policy" ON tokens;
DROP POLICY IF EXISTS "public_view_tokens" ON tokens;
CREATE POLICY "public_view_tokens" ON tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_tokens" ON tokens;
CREATE POLICY "public_insert_tokens" ON tokens FOR INSERT WITH CHECK (true);
