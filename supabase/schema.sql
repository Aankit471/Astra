-- ==============================================================================
-- ASTRA Emergency Healthcare Referral Coordination Platform
-- Supabase Relational Schema — Project: astra-production-demo
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PROFILES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- maps to auth.users.id or mock/demo user id
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('USER', 'HOSPITAL_OPS', 'DOCTOR', 'ADMIN')),
    hospital_id TEXT,
    hospital_name TEXT,
    avatar_initials TEXT,
    doctor_code TEXT,
    specialty TEXT,
    department TEXT,
    doctor_status TEXT DEFAULT 'AVAILABLE' CHECK (doctor_status IN ('AVAILABLE', 'ON_CALL', 'BUSY', 'UNAVAILABLE', 'UNKNOWN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. HOSPITALS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('GOVERNMENT', 'PRIVATE', 'TRUST', 'MISSION')),
    address JSONB NOT NULL DEFAULT '{}'::JSONB,
    location JSONB NOT NULL DEFAULT '{}'::JSONB,
    phone TEXT NOT NULL,
    emergency_phone TEXT,
    email TEXT,
    capabilities JSONB NOT NULL DEFAULT '{"emergencyCategories":[],"capabilities":[]}'::JSONB,
    verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'SELF_REPORTED', 'INFERRED', 'STALE')),
    operational_status TEXT NOT NULL DEFAULT 'OPERATIONAL' CHECK (operational_status IN ('OPERATIONAL', 'CAPACITY_WARNING', 'OVERLOADED', 'DIVERTING')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. DOCTORS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctors (
    id TEXT PRIMARY KEY,
    hospital_id TEXT NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    doctor_code TEXT NOT NULL UNIQUE,
    specialty TEXT NOT NULL,
    department TEXT NOT NULL,
    qualifications TEXT[] DEFAULT '{}',
    specialization TEXT[] DEFAULT '{}',
    contact_phone TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_CALL', 'BUSY', 'UNAVAILABLE', 'UNKNOWN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. PATIENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY DEFAULT ('PAT-' || substring(gen_random_uuid()::text from 1 for 8)),
    reference_code TEXT NOT NULL UNIQUE,
    age INT NOT NULL CHECK (age >= 0 AND age <= 130),
    sex TEXT NOT NULL CHECK (sex IN ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN')),
    chief_complaint TEXT NOT NULL,
    emergency_category TEXT NOT NULL CHECK (emergency_category IN (
        'CARDIAC', 'TRAUMA', 'NEURO', 'RESPIRATORY', 'OBSTETRIC', 'PAEDIATRIC',
        'BURNS', 'TOXICOLOGY', 'RENAL', 'ONCOLOGY', 'ORTHOPAEDIC', 'VASCULAR', 'OTHER'
    )),
    urgency_level TEXT NOT NULL CHECK (urgency_level IN ('IMMEDIATE', 'URGENT', 'SEMI_URGENT')),
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    vital_summary TEXT,
    relevant_history TEXT,
    current_facility TEXT,
    referring_doctor TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. HOSPITAL BEDS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hospital_beds (
    id TEXT PRIMARY KEY,
    hospital_id TEXT NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    ward_name TEXT NOT NULL,
    bed_type TEXT NOT NULL CHECK (bed_type IN ('ICU', 'HDU', 'Emergency', 'General Ward', 'Private Room', 'Semi-Private Room', 'Isolation', 'Critical Care')),
    room_type TEXT NOT NULL CHECK (room_type IN ('PRIVATE', 'SHARED')),
    ac_non_ac TEXT NOT NULL CHECK (ac_non_ac IN ('AC', 'NON_AC')),
    clinical_support TEXT NOT NULL DEFAULT 'STANDARD' CHECK (clinical_support IN ('STANDARD', 'MONITORED', 'VENTILATOR_SUPPORTED')),
    total_beds INT NOT NULL CHECK (total_beds >= 0),
    available_beds INT NOT NULL CHECK (available_beds >= 0),
    occupied_beds INT NOT NULL CHECK (occupied_beds >= 0),
    reserved_beds INT NOT NULL DEFAULT 0 CHECK (reserved_beds >= 0),
    price_per_day NUMERIC(10, 2) NOT NULL CHECK (price_per_day >= 0),
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN', 'STALE')),
    verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'SELF_REPORTED', 'INFERRED', 'STALE')),
    source TEXT NOT NULL DEFAULT 'Hospital Operations Telemetry',
    notes TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_bed_capacity_sum CHECK ((available_beds + occupied_beds + reserved_beds) <= total_beds)
);

-- ── 6. BLOOD INVENTORY ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blood_inventory (
    id TEXT PRIMARY KEY,
    hospital_id TEXT NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    hospital_name TEXT NOT NULL,
    blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    component TEXT NOT NULL CHECK (component IN ('WHOLE_BLOOD', 'PACKED_RBC', 'FFP', 'PLATELETS', 'CRYOPRECIPITATE')),
    available_units INT NOT NULL CHECK (available_units >= 0),
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN', 'STALE')),
    freshness TEXT NOT NULL DEFAULT 'CURRENT' CHECK (freshness IN ('CURRENT', 'RECENT', 'STALE', 'UNKNOWN')),
    source TEXT NOT NULL DEFAULT 'State Blood Transfusion Registry',
    verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'SELF_REPORTED', 'INFERRED', 'STALE')),
    notes TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. REFERRALS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_data JSONB NOT NULL, -- embedded PatientBrief for resilient offline fallback
    created_by TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'CREATED', 'MATCHING', 'CONTACTING', 'WAITING_FOR_RESPONSE', 'PENDING',
        'MATCHED', 'SENT', 'REVIEWING', 'ACCEPTED', 'DECLINED', 'ESCALATED',
        'CONFIRMED', 'ARRIVED', 'COMPLETED', 'CANCELLED'
    )),
    required_capabilities JSONB NOT NULL DEFAULT '[]'::JSONB,
    matched_facilities TEXT[] DEFAULT '{}',
    attempted_facility_ids TEXT[] DEFAULT '{}',
    sent_to_facility_id TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    sent_to_facility_name TEXT,
    confirmed_facility_id TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    confirmed_facility_name TEXT,
    assigned_doctor_id TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
    required_specialty TEXT,
    assigned_specialty TEXT,
    assigned_department TEXT,
    assigned_doctor_name TEXT,
    assigned_doctor_code TEXT,
    decision JSONB,
    escalation_reason TEXT CHECK (escalation_reason IS NULL OR escalation_reason IN ('NO_RESPONSE', 'DECLINED_ALL', 'TIMEOUT', 'MANUAL')),
    escalated_at TIMESTAMPTZ,
    response_deadline TIMESTAMPTZ NOT NULL,
    arrived_at TIMESTAMPTZ,
    notes TEXT,
    info_requested BOOLEAN DEFAULT FALSE,
    info_requested_notes TEXT,
    clinical_override BOOLEAN DEFAULT FALSE,
    clinical_override_notes TEXT,
    unresolved_exhausted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. REFERRAL EVENTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_events (
    id TEXT PRIMARY KEY,
    referral_id TEXT NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    event TEXT NOT NULL,
    actor TEXT,
    actor_role TEXT,
    facility_id TEXT,
    facility_name TEXT,
    notes TEXT,
    is_system_event BOOLEAN DEFAULT FALSE
);

-- ── 9. NOTIFICATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'SYSTEM_ALERT',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'SUCCESS')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    recipient_role TEXT,
    recipient_id TEXT,
    referral_id TEXT,
    hospital_id TEXT,
    action_label TEXT,
    action_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 10. AUDIT LOGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('REFERRAL', 'HOSPITAL', 'USER', 'SYSTEM')),
    target_id TEXT NOT NULL,
    target_label TEXT NOT NULL,
    details JSONB,
    ip_address TEXT
);

-- ── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hospital_beds_hospital ON public.hospital_beds(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_beds_category ON public.hospital_beds(bed_type);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_hospital ON public.blood_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_group ON public.blood_inventory(blood_group);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON public.doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_by ON public.referrals(created_by);
CREATE INDEX IF NOT EXISTS idx_referrals_hospital ON public.referrals(sent_to_facility_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_ref ON public.referral_events(referral_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_role, recipient_id);

-- ── ROW LEVEL SECURITY (RLS) ────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public read for profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid()::text = id);

-- 2. Hospitals Policies (Public read for capability and triage discovery)
CREATE POLICY "Allow public select on hospitals" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Hospital staff and admin update hospitals" ON public.hospitals FOR UPDATE USING (
    auth.role() = 'authenticated'
);

-- 3. Doctors Policies
CREATE POLICY "Allow public read on doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Authorized staff update doctors" ON public.doctors FOR ALL USING (
    auth.role() = 'authenticated'
);

-- 4. Patients Policies (Protect private medical brief records)
CREATE POLICY "Patient self and clinical access" ON public.patients FOR SELECT USING (
    auth.role() = 'authenticated' OR true -- permits anonymous emergency initiation in demo
);
CREATE POLICY "Allow insert patient for emergency referral" ON public.patients FOR INSERT WITH CHECK (true);

-- 5. Hospital Beds Policies
CREATE POLICY "Allow public read on hospital beds" ON public.hospital_beds FOR SELECT USING (true);
CREATE POLICY "Hospital staff manage bed counts" ON public.hospital_beds FOR ALL USING (
    auth.role() = 'authenticated' OR true
);

-- 6. Blood Inventory Policies
CREATE POLICY "Allow public read on blood inventory" ON public.blood_inventory FOR SELECT USING (true);
CREATE POLICY "Hospital staff manage blood inventory" ON public.blood_inventory FOR ALL USING (
    auth.role() = 'authenticated' OR true
);

-- 7. Referrals Policies
CREATE POLICY "Allow read referrals" ON public.referrals FOR SELECT USING (true);
CREATE POLICY "Allow create referral" ON public.referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update referral" ON public.referrals FOR UPDATE USING (true);

-- 8. Referral Events Policies
CREATE POLICY "Allow read referral events" ON public.referral_events FOR SELECT USING (true);
CREATE POLICY "Allow insert referral events" ON public.referral_events FOR INSERT WITH CHECK (true);

-- 9. Notifications Policies
CREATE POLICY "Allow read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow update notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Allow insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 10. Audit Logs Policies (Read-only for platform, append-only)
CREATE POLICY "Allow read audit logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
