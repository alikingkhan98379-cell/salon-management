-- ==============================================================================
-- Western Boys Salon SaaS - Staff & Manager RLS Policies and Role Scoping
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lojbmhekkfuyuhbajfgf/sql/new
-- ==============================================================================

-- 1. Profiles Table: Public can read active staff for booking; Owners manage their salon; Managers manage staff
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
    salon_id IN (
        SELECT salon_id FROM salon_owners WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "managers_view_salon_team" ON profiles;
CREATE POLICY "managers_view_salon_team" ON profiles 
FOR SELECT USING (
    salon_id IN (
        SELECT salon_id FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager' AND is_active = true
    )
);

DROP POLICY IF EXISTS "managers_insert_staff" ON profiles;
CREATE POLICY "managers_insert_staff" ON profiles 
FOR INSERT WITH CHECK (
    salon_id IN (
        SELECT salon_id FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager' AND is_active = true
    )
    AND role = 'staff' -- Managers can ONLY add Staff, never Managers
);

DROP POLICY IF EXISTS "managers_update_staff" ON profiles;
CREATE POLICY "managers_update_staff" ON profiles 
FOR UPDATE USING (
    salon_id IN (
        SELECT salon_id FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager' AND is_active = true
    )
    AND role = 'staff' -- Managers can ONLY modify Staff
) WITH CHECK (
    role = 'staff' -- Cannot elevate to Manager
);

-- 2. Appointments Table: Staff can ONLY see and update their assigned appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_view_assigned_appointments" ON appointments;
CREATE POLICY "staff_view_assigned_appointments" ON appointments 
FOR SELECT USING (
    staff_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid() AND is_active = true
    )
    OR
    salon_id IN (
        SELECT salon_id FROM salon_owners WHERE user_id = auth.uid()
    )
    OR
    salon_id IN (
        SELECT salon_id FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager' AND is_active = true
    )
);

DROP POLICY IF EXISTS "staff_update_assigned_appointments" ON appointments;
CREATE POLICY "staff_update_assigned_appointments" ON appointments 
FOR UPDATE USING (
    staff_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid() AND is_active = true
    )
    OR
    salon_id IN (
        SELECT salon_id FROM salon_owners WHERE user_id = auth.uid()
    )
    OR
    salon_id IN (
        SELECT salon_id FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager' AND is_active = true
    )
);

-- 3. Invoices Table: Strictly restricted to Owners, Managers, and Super Admin (Staff has 0 access)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_management_access" ON invoices;
CREATE POLICY "invoices_management_access" ON invoices 
FOR ALL USING (
    salon_id IN (
        SELECT salon_id FROM salon_owners WHERE user_id = auth.uid()
    )
    OR
    salon_id IN (
        SELECT salon_id FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager' AND is_active = true
    )
);
