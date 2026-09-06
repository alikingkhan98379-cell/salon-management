-- ==============================================================================
-- Western Boys Salon SaaS - Multi-Tenant Database Schema with Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE user_role AS ENUM ('super_admin', 'salon_owner', 'manager', 'staff');
CREATE TYPE service_location AS ENUM ('in_salon', 'home_service');
CREATE TYPE booking_channel AS ENUM ('whatsapp', 'web', 'walk_in');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'serving', 'completed', 'cancelled', 'no_show');
CREATE TYPE token_status AS ENUM ('waiting', 'serving', 'completed', 'skipped');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_gateway AS ENUM ('mock_razorpay', 'razorpay', 'cash', 'upi');
CREATE TYPE subscription_plan_type AS ENUM ('base_monthly', 'half_yearly', 'yearly');
CREATE TYPE subscription_status_type AS ENUM ('trial', 'active', 'past_due', 'expired');

-- ==============================================================================
-- 1. Salons (Tenants)
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
    logo_url TEXT,
    currency VARCHAR(10) DEFAULT 'INR',
    currency_symbol VARCHAR(5) DEFAULT '₹',
    subscription_plan subscription_plan_type DEFAULT 'base_monthly',
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, 6_months, 1_year
    subscription_status subscription_status_type DEFAULT 'trial',
    subscription_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. Salon Owners Relationship Table (Multi-Salon Ownership)
-- ==============================================================================
CREATE TABLE salon_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- references auth.users(id)
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, salon_id)
);

CREATE INDEX idx_salon_owners_user ON salon_owners(user_id);
CREATE INDEX idx_salon_owners_salon ON salon_owners(salon_id);

-- ==============================================================================
-- 3. Profiles / Staff Users (Scoped to Salon)
-- ==============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- references auth.users(id)
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'staff',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    specialties TEXT[],
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "21:00", "days": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}'::jsonb,
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
-- 4. Services & Dual-Pricing (In-Salon vs Home Service)
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
-- 5. Customers & CRM
-- ==============================================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    allergy_notes TEXT,
    hair_preference_notes TEXT,
    preferred_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    total_visits INT DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    last_visited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, phone)
);

CREATE INDEX idx_customers_salon_phone ON customers(salon_id, phone);

-- ==============================================================================
-- 6. Appointments & Bookings
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
    transaction_ref VARCHAR(255),
    notes TEXT,
    home_service_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_salon_date ON appointments(salon_id, appointment_date);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);

-- ==============================================================================
-- 7. Live Token / Queue Management
-- ==============================================================================
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
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
CREATE INDEX idx_tokens_code ON tokens(token_code);

-- ==============================================================================
-- 8. Inventory Management
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
    supplier_info TEXT,
    last_restocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_salon ON inventory(salon_id);

-- ==============================================================================
-- 9. Invoices & Receipts
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
-- 10. WhatsApp Notifications Log
-- ==============================================================================
CREATE TABLE notifications_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(255),
    notification_type VARCHAR(50) NOT NULL,
    message_content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    whatsapp_message_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_salon ON notifications_log(salon_id);

-- ==============================================================================
-- Functions for Dynamic Multi-Tenant Scoping
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_user_salon_ids()
RETURNS TABLE (salon_id UUID) AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;

    -- Super Admin can access all salons
    IF user_role_val = 'super_admin' THEN
        RETURN QUERY SELECT id FROM salons;
    -- Salon Owner can access all salons linked in salon_owners
    ELSIF user_role_val = 'salon_owner' THEN
        RETURN QUERY SELECT so.salon_id FROM salon_owners so WHERE so.user_id = auth.uid();
    -- Manager or Staff can access their assigned salon from profile
    ELSE
        RETURN QUERY SELECT p.salon_id FROM profiles p WHERE p.auth_user_id = auth.uid() AND p.salon_id IS NOT NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_salons_update BEFORE UPDATE ON salons FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_profiles_update BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_services_update BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_customers_update BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_appointments_update BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_tokens_update BEFORE UPDATE ON tokens FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_inventory_update BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- 1. Salons RLS
CREATE POLICY super_admin_all_salons ON salons FOR ALL
    USING ((SELECT role FROM profiles WHERE auth_user_id = auth.uid()) = 'super_admin');

CREATE POLICY user_view_allowed_salons ON salons FOR SELECT
    USING (id IN (SELECT get_user_salon_ids()));

CREATE POLICY owner_update_salons ON salons FOR UPDATE
    USING (id IN (SELECT salon_id FROM salon_owners WHERE user_id = auth.uid()));

CREATE POLICY public_view_salons ON salons FOR SELECT
    USING (true);

-- 2. Salon Owners Table RLS
CREATE POLICY super_admin_salon_owners ON salon_owners FOR ALL
    USING ((SELECT role FROM profiles WHERE auth_user_id = auth.uid()) = 'super_admin');

CREATE POLICY owner_view_own_memberships ON salon_owners FOR SELECT
    USING (user_id = auth.uid());

-- 3. Profiles RLS
CREATE POLICY super_admin_profiles ON profiles FOR ALL
    USING ((SELECT role FROM profiles WHERE auth_user_id = auth.uid()) = 'super_admin');

CREATE POLICY owner_manage_salon_profiles ON profiles FOR ALL
    USING (salon_id IN (SELECT salon_id FROM salon_owners WHERE user_id = auth.uid()));

CREATE POLICY manager_view_staff ON profiles FOR SELECT
    USING (salon_id IN (SELECT get_user_salon_ids()));

CREATE POLICY user_view_own_profile ON profiles FOR SELECT
    USING (auth_user_id = auth.uid());

-- 4. Services RLS
CREATE POLICY user_view_salon_services ON services FOR SELECT
    USING (salon_id IN (SELECT get_user_salon_ids()) OR is_active = true);

CREATE POLICY owner_manager_modify_services ON services FOR ALL
    USING (
        salon_id IN (SELECT get_user_salon_ids())
        AND (SELECT role FROM profiles WHERE auth_user_id = auth.uid()) IN ('salon_owner', 'manager', 'super_admin')
    );

-- 5. Customers RLS
CREATE POLICY tenant_customer_access ON customers FOR ALL
    USING (salon_id IN (SELECT get_user_salon_ids()));

CREATE POLICY public_customer_create ON customers FOR INSERT
    WITH CHECK (true);

-- 6. Appointments RLS
CREATE POLICY super_admin_appointments ON appointments FOR ALL
    USING ((SELECT role FROM profiles WHERE auth_user_id = auth.uid()) = 'super_admin');

CREATE POLICY owner_manager_appointments ON appointments FOR ALL
    USING (
        salon_id IN (SELECT get_user_salon_ids())
        AND (SELECT role FROM profiles WHERE auth_user_id = auth.uid()) IN ('salon_owner', 'manager')
    );

-- Staff can ONLY view their assigned appointments
CREATE POLICY staff_assigned_appointments ON appointments FOR SELECT
    USING (
        salon_id IN (SELECT get_user_salon_ids())
        AND staff_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY staff_update_assigned_appointments ON appointments FOR UPDATE
    USING (
        salon_id IN (SELECT get_user_salon_ids())
        AND staff_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY public_create_appointment ON appointments FOR INSERT
    WITH CHECK (true);

-- 7. Tokens RLS
CREATE POLICY public_view_tokens ON tokens FOR SELECT
    USING (true);

CREATE POLICY staff_manage_tokens ON tokens FOR ALL
    USING (salon_id IN (SELECT get_user_salon_ids()));

-- 8. Inventory RLS (Owner & Manager only)
CREATE POLICY owner_manager_inventory ON inventory FOR ALL
    USING (
        salon_id IN (SELECT get_user_salon_ids())
        AND (SELECT role FROM profiles WHERE auth_user_id = auth.uid()) IN ('salon_owner', 'manager', 'super_admin')
    );

-- 9. Invoices RLS (Owner & Manager only - Staff cannot view)
CREATE POLICY owner_manager_invoices ON invoices FOR ALL
    USING (
        salon_id IN (SELECT get_user_salon_ids())
        AND (SELECT role FROM profiles WHERE auth_user_id = auth.uid()) IN ('salon_owner', 'manager', 'super_admin')
    );

-- 10. Notifications Log RLS
CREATE POLICY tenant_notifications_log ON notifications_log FOR ALL
    USING (salon_id IN (SELECT get_user_salon_ids()));
