-- ==============================================================================
-- Project F.A.H.I.M. — Row Level Security (RLS) Remediation & Access Policies
-- Target: public.facilities, public.ward_capacity, public.ed_boarding,
--         public.discharge_cases, public.referrals
-- ==============================================================================

-- 1. Enable Row Level Security across all 5 clinical operations tables
ALTER TABLE "public"."facilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ward_capacity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ed_boarding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."discharge_cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing conflicting policies if re-running
DROP POLICY IF EXISTS "Allow read on facilities" ON "public"."facilities";
DROP POLICY IF EXISTS "Allow read on ward_capacity" ON "public"."ward_capacity";
DROP POLICY IF EXISTS "Allow read on ed_boarding" ON "public"."ed_boarding";
DROP POLICY IF EXISTS "Allow read on discharge_cases" ON "public"."discharge_cases";
DROP POLICY IF EXISTS "Allow read on referrals" ON "public"."referrals";

DROP POLICY IF EXISTS "Allow write on ed_boarding" ON "public"."ed_boarding";
DROP POLICY IF EXISTS "Allow write on ward_capacity" ON "public"."ward_capacity";
DROP POLICY IF EXISTS "Allow write on discharge_cases" ON "public"."discharge_cases";
DROP POLICY IF EXISTS "Allow write on referrals" ON "public"."referrals";

-- 3. Read Access Policies: Grant Read-Only access to anon & authenticated roles
CREATE POLICY "Allow read on facilities" ON "public"."facilities"
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow read on ward_capacity" ON "public"."ward_capacity"
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow read on ed_boarding" ON "public"."ed_boarding"
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow read on discharge_cases" ON "public"."discharge_cases"
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow read on referrals" ON "public"."referrals"
    FOR SELECT TO anon, authenticated USING (true);

-- 4. Mutation Access Policies: Grant full CRUD on clinical tables for operations
CREATE POLICY "Allow write on ed_boarding" ON "public"."ed_boarding"
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write on ward_capacity" ON "public"."ward_capacity"
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write on discharge_cases" ON "public"."discharge_cases"
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write on referrals" ON "public"."referrals"
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
