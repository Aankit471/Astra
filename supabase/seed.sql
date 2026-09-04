-- ==============================================================================
-- ASTRA Emergency Healthcare Referral Coordination Platform
-- Safe Synthetic Seed Demo Data — Project: astra-production-demo
-- ==============================================================================

-- ── 1. PROFILES ─────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, email, name, role, hospital_id, hospital_name, avatar_initials, doctor_code, specialty, department)
VALUES
    ('user-001',  'user@astra.demo',    'Priya Sharma',       'USER',         NULL,   NULL,                          'PS', NULL,       NULL,                      NULL),
    ('ops-001',   'ops@astra.demo',     'Sarah Jenkins',      'HOSPITAL_OPS', 'H001', 'Apollo General Hospital',     'SJ', NULL,       NULL,                      'Hospital Operations'),
    ('doc-001',   'doctor@astra.demo',  'Dr. Ananya Mehta',   'DOCTOR',       'H001', 'Apollo General Hospital',     'AM', 'DOC-2048', 'Cardiology',              'Emergency Cardiac Care'),
    ('doc-002',   'doctor2@astra.demo', 'Dr. Suresh Menon',   'DOCTOR',       'H002', 'Government District Hospital','SM', 'DOC-2050', 'Orthopedics',             'Orthopedic Emergency'),
    ('doc-003',   'doctor3@astra.demo', 'Dr. Vikram Rao',     'DOCTOR',       'H001', 'Apollo General Hospital',     'VR', 'DOC-2049', 'Neurology',               'Emergency Neurology Unit'),
    ('doc-004',   'doctor4@astra.demo', 'Dr. Radhika Sen',    'DOCTOR',       'H003', 'St. Mary''s Mission Hospital','RS', 'DOC-2051', 'Emergency Medicine',     'Trauma & Emergency Care'),
    ('doc-005',   'doctor5@astra.demo', 'Dr. Kabir Anand',    'DOCTOR',       'H004', 'Manipal Trinity Hospital',    'KA', 'DOC-2052', 'Nephrology',              'Renal Critical Care'),
    ('doc-006',   'doctor6@astra.demo', 'Dr. Tanvi Joshi',    'DOCTOR',       'H001', 'Apollo General Hospital',     'TJ', 'DOC-2053', 'General Medicine',        'Internal Medicine & Acute Care'),
    ('admin-001', 'admin@astra.demo',   'Vikram Nair',        'ADMIN',        NULL,   NULL,                          'VN', NULL,       NULL,                      'Platform Governance')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- ── 2. HOSPITALS ────────────────────────────────────────────────────────────
INSERT INTO public.hospitals (id, name, short_name, type, address, location, phone, emergency_phone, email, verification_status, operational_status)
VALUES
    (
        'H001',
        'Apollo General Hospital',
        'Apollo Indiranagar',
        'PRIVATE',
        '{"line1":"154/11 HAL Old Airport Rd","line2":"Indiranagar","city":"Bengaluru","state":"Karnataka","pincode":"560008"}'::JSONB,
        '{"lat":12.9602,"lng":77.6483}'::JSONB,
        '+91 80 2502 4444',
        '+91 80 2502 4499',
        'emergency@apollo-blr.demo',
        'VERIFIED',
        'OPERATIONAL'
    ),
    (
        'H002',
        'Government District Hospital',
        'Govt District Victoria',
        'GOVERNMENT',
        '{"line1":"Fort Road, Near City Market","city":"Bengaluru","state":"Karnataka","pincode":"560002"}'::JSONB,
        '{"lat":12.9634,"lng":77.5741}'::JSONB,
        '+91 80 2670 1150',
        '+91 80 2670 1199',
        'triage@district-hosp.gov.demo',
        'VERIFIED',
        'OPERATIONAL'
    ),
    (
        'H003',
        'St. Mary''s Mission Hospital',
        'St. Mary''s Mission',
        'MISSION',
        '{"line1":"8 Hosur Road, Richmond Town","city":"Bengaluru","state":"Karnataka","pincode":"560025"}'::JSONB,
        '{"lat":12.9610,"lng":77.6080}'::JSONB,
        '+91 80 2221 3344',
        '+91 80 2221 3399',
        'er@stmarys-mission.demo',
        'VERIFIED',
        'OPERATIONAL'
    ),
    (
        'H004',
        'Manipal Trinity Super Specialty Hospital',
        'Manipal Trinity',
        'PRIVATE',
        '{"line1":"98 Rustam Bagh, Old Airport Road","city":"Bengaluru","state":"Karnataka","pincode":"560017"}'::JSONB,
        '{"lat":12.9576,"lng":77.6534}'::JSONB,
        '+91 80 4016 4500',
        '+91 80 4016 4599',
        'er@manipal-trinity.demo',
        'VERIFIED',
        'OPERATIONAL'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    verification_status = EXCLUDED.verification_status;

-- ── 3. DOCTORS ──────────────────────────────────────────────────────────────
INSERT INTO public.doctors (id, hospital_id, name, doctor_code, specialty, department, contact_phone, is_available, status)
VALUES
    ('DOC-H1-01', 'H001', 'Dr. Ananya Mehta',   'DOC-2048', 'Cardiology',          'Emergency Cardiac Care',   '+91 98450 11201', TRUE, 'AVAILABLE'),
    ('DOC-H1-02', 'H001', 'Dr. Vikram Rao',     'DOC-2049', 'Neurology',           'Emergency Neurology Unit', '+91 98450 11202', TRUE, 'AVAILABLE'),
    ('DOC-H1-03', 'H001', 'Dr. Tanvi Joshi',    'DOC-2053', 'General Medicine',    'Internal Medicine Desk',   '+91 98450 11203', TRUE, 'AVAILABLE'),
    ('DOC-H2-01', 'H002', 'Dr. Suresh Menon',   'DOC-2050', 'Orthopedics',         'Orthopedic Emergency',     '+91 98450 11204', TRUE, 'AVAILABLE'),
    ('DOC-H3-01', 'H003', 'Dr. Radhika Sen',    'DOC-2051', 'Emergency Medicine', 'Trauma & Emergency Care', '+91 98450 11205', TRUE, 'AVAILABLE'),
    ('DOC-H4-01', 'H004', 'Dr. Kabir Anand',    'DOC-2052', 'Nephrology',          'Renal Critical Care',      '+91 98450 11206', TRUE, 'AVAILABLE')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    specialty = EXCLUDED.specialty;

-- ── 4. PATIENTS (Synthetic Anonymized) ──────────────────────────────────────
INSERT INTO public.patients (id, reference_code, age, sex, chief_complaint, emergency_category, urgency_level, blood_group, vital_summary)
VALUES
    ('PAT-001', 'CASE-1042', 58, 'MALE',   'Severe crushing chest pain, diaphoresis, acute STEMI', 'CARDIAC',     'IMMEDIATE', 'O-', 'BP 90/60, HR 112, SpO2 91%'),
    ('PAT-002', 'CASE-2081', 34, 'FEMALE', 'Compound femur fracture and pelvic trauma',          'TRAUMA',      'IMMEDIATE', 'A+', 'BP 105/70, HR 98, SpO2 97%'),
    ('PAT-003', 'CASE-3094', 67, 'MALE',   'Sudden onset right-sided hemiplegia and dysphasia',  'NEURO',       'IMMEDIATE', 'B+', 'BP 160/95, HR 84, SpO2 96%'),
    ('PAT-004', 'CASE-4012', 45, 'MALE',   'Acute pulmonary edema and severe dyspnea',           'RESPIRATORY', 'URGENT',    'AB+','BP 140/90, HR 105, SpO2 88%'),
    ('PAT-005', 'CASE-5109', 28, 'FEMALE', 'Eclampsia with hyper-reflexia and seizure activity', 'OBSTETRIC',   'IMMEDIATE', 'O+', 'BP 175/110, HR 94, FHR 140'),
    ('PAT-006', 'CASE-6120',  6, 'MALE',   'Severe status asthmaticus refractory to nebulizer',  'PAEDIATRIC',  'IMMEDIATE', 'A-', 'RR 48, SpO2 89%, Subcostal retractions'),
    ('PAT-007', 'CASE-7231', 52, 'MALE',   'Anuria, hyperkalemia, acute metabolic acidosis',     'RENAL',       'URGENT',    'B-', 'K+ 6.8 mmol/L, HCO3 12'),
    ('PAT-008', 'CASE-8342', 61, 'FEMALE', 'Acute ischemic lower limb with pallor and loss of pulse','VASCULAR', 'URGENT',    'O-', 'No distal Doppler signals'),
    ('PAT-009', 'CASE-9453', 40, 'MALE',   'Multiple rib fractures and suspected pneumothorax',  'TRAUMA',      'IMMEDIATE', 'AB-','BP 110/72, HR 104, Tracheal shift'),
    ('PAT-010', 'CASE-1054', 72, 'FEMALE', 'Cardiogenic shock secondary to acute inferior MI',   'CARDIAC',     'IMMEDIATE', 'O+', 'BP 80/50 on inotropes')
ON CONFLICT (id) DO NOTHING;

-- ── 5. HOSPITAL BEDS ────────────────────────────────────────────────────────
INSERT INTO public.hospital_beds (id, hospital_id, ward_name, bed_type, room_type, ac_non_ac, clinical_support, total_beds, available_beds, occupied_beds, reserved_beds, price_per_day, status)
VALUES
    -- Apollo General Hospital (H001)
    ('BED-H1-ICU-AC',    'H001', 'Cardiac ICU Wing',           'ICU',               'SHARED',  'AC',     'VENTILATOR_SUPPORTED', 10, 3, 6, 1, 8500.00, 'AVAILABLE'),
    ('BED-H1-EMER-AC',   'H001', 'Emergency Resuscitation Bay','Emergency',         'SHARED',  'AC',     'MONITORED',            12, 4, 7, 1, 3500.00, 'AVAILABLE'),
    ('BED-H1-GEN-NONAC', 'H001', 'General Medical Ward',       'General Ward',      'SHARED',  'NON_AC', 'STANDARD',             30, 9, 20, 1,  850.00, 'AVAILABLE'),
    ('BED-H1-PVT-AC',    'H001', 'Executive Private Suites',   'Private Room',      'PRIVATE', 'AC',     'MONITORED',             8, 3,  5, 0, 4800.00, 'AVAILABLE'),
    ('BED-H1-SEMI-AC',   'H001', 'Step-down Semi-Private',     'Semi-Private Room', 'SHARED',  'AC',     'MONITORED',            12, 5,  6, 1, 2800.00, 'AVAILABLE'),
    ('BED-H1-ISOL-AC',   'H001', 'Negative Pressure Isolation','Isolation',         'PRIVATE', 'AC',     'VENTILATOR_SUPPORTED',  4, 2,  2, 0, 7200.00, 'AVAILABLE'),

    -- Government District Hospital (H002)
    ('BED-H2-ICU-AC',    'H002', 'Trauma Critical Care ICU',   'ICU',               'SHARED',  'AC',     'VENTILATOR_SUPPORTED', 12, 1, 10, 1,  500.00, 'LIMITED'),
    ('BED-H2-EMER-NONAC','H002', 'Casualty Emergency Ward',   'Emergency',         'SHARED',  'NON_AC', 'MONITORED',            20, 6, 13, 1,  250.00, 'AVAILABLE'),
    ('BED-H2-GEN-NONAC', 'H002', 'Public General Ward',        'General Ward',      'SHARED',  'NON_AC', 'STANDARD',             60,18, 40, 2,    0.00, 'AVAILABLE'),
    ('BED-H2-HDU-AC',    'H002', 'High Dependency Unit',       'HDU',               'SHARED',  'AC',     'MONITORED',             8, 2,  6, 0,  400.00, 'AVAILABLE'),

    -- St. Mary's Mission Hospital (H003)
    ('BED-H3-ICU-AC',    'H003', 'Intensive Care Unit',        'ICU',               'SHARED',  'AC',     'VENTILATOR_SUPPORTED',  8, 2,  5, 1, 4200.00, 'AVAILABLE'),
    ('BED-H3-EMER-AC',   'H003', 'Acute Care Emergency',       'Emergency',         'SHARED',  'AC',     'MONITORED',            10, 3,  6, 1, 1800.00, 'AVAILABLE'),
    ('BED-H3-GEN-NONAC', 'H003', 'Charity General Ward',       'General Ward',      'SHARED',  'NON_AC', 'STANDARD',             24, 7, 16, 1,  450.00, 'AVAILABLE'),
    ('BED-H3-PVT-NONAC', 'H003', 'Single Recovery Ward',       'Private Room',      'PRIVATE', 'NON_AC', 'STANDARD',              6, 2,  4, 0, 1200.00, 'AVAILABLE'),

    -- Manipal Trinity Hospital (H004)
    ('BED-H4-ICU-AC',    'H004', 'Multi-organ Transplant ICU', 'ICU',               'SHARED',  'AC',     'VENTILATOR_SUPPORTED', 14, 5,  8, 1, 9500.00, 'AVAILABLE'),
    ('BED-H4-EMER-AC',   'H004', 'Level 1 Trauma Triage',      'Emergency',         'SHARED',  'AC',     'MONITORED',            15, 6,  8, 1, 4200.00, 'AVAILABLE'),
    ('BED-H4-GEN-AC',    'H004', 'Air-Conditioned General',    'General Ward',      'SHARED',  'AC',     'STANDARD',             25, 8, 16, 1, 1800.00, 'AVAILABLE'),
    ('BED-H4-PVT-AC',    'H004', 'Deluxe Private Suite',       'Private Room',      'PRIVATE', 'AC',     'MONITORED',            10, 4,  6, 0, 6500.00, 'AVAILABLE')
ON CONFLICT (id) DO UPDATE SET
    available_beds = EXCLUDED.available_beds,
    occupied_beds = EXCLUDED.occupied_beds;

-- ── 6. BLOOD INVENTORY (All 8 Groups Supported) ─────────────────────────────
INSERT INTO public.blood_inventory (id, hospital_id, hospital_name, blood_group, component, available_units, status, freshness)
VALUES
    -- Apollo General (H001)
    ('BLD-H1-O-NEG', 'H001', 'Apollo General Hospital', 'O-',  'PACKED_RBC',   3, 'LIMITED',   'CURRENT'),
    ('BLD-H1-O-POS', 'H001', 'Apollo General Hospital', 'O+',  'PACKED_RBC',  14, 'AVAILABLE', 'CURRENT'),
    ('BLD-H1-A-POS', 'H001', 'Apollo General Hospital', 'A+',  'PACKED_RBC',  18, 'AVAILABLE', 'CURRENT'),
    ('BLD-H1-A-NEG', 'H001', 'Apollo General Hospital', 'A-',  'PACKED_RBC',   4, 'AVAILABLE', 'CURRENT'),
    ('BLD-H1-B-POS', 'H001', 'Apollo General Hospital', 'B+',  'PACKED_RBC',  12, 'AVAILABLE', 'CURRENT'),
    ('BLD-H1-B-NEG', 'H001', 'Apollo General Hospital', 'B-',  'PACKED_RBC',   2, 'LIMITED',   'CURRENT'),
    ('BLD-H1-AB-POS','H001', 'Apollo General Hospital', 'AB+', 'PACKED_RBC',   8, 'AVAILABLE', 'CURRENT'),
    ('BLD-H1-AB-NEG','H001', 'Apollo General Hospital', 'AB-', 'PACKED_RBC',   1, 'LIMITED',   'RECENT'),

    -- Government District Hospital (H002)
    ('BLD-H2-O-POS', 'H002', 'Government District Hospital', 'O+',  'WHOLE_BLOOD', 22, 'AVAILABLE', 'CURRENT'),
    ('BLD-H2-O-NEG', 'H002', 'Government District Hospital', 'O-',  'PACKED_RBC',   5, 'AVAILABLE', 'CURRENT'),
    ('BLD-H2-B-POS', 'H002', 'Government District Hospital', 'B+',  'WHOLE_BLOOD', 16, 'AVAILABLE', 'CURRENT'),
    ('BLD-H2-A-POS', 'H002', 'Government District Hospital', 'A+',  'WHOLE_BLOOD', 12, 'AVAILABLE', 'CURRENT'),

    -- Manipal Trinity (H004)
    ('BLD-H4-O-NEG', 'H004', 'Manipal Trinity Hospital',     'O-',  'PACKED_RBC',   6, 'AVAILABLE', 'CURRENT'),
    ('BLD-H4-AB-NEG','H004', 'Manipal Trinity Hospital',     'AB-', 'PLATELETS',    4, 'AVAILABLE', 'CURRENT')
ON CONFLICT (id) DO UPDATE SET
    available_units = EXCLUDED.available_units;

-- ── 7. REFERRALS ────────────────────────────────────────────────────────────
INSERT INTO public.referrals (
    id, patient_id, patient_data, created_by, status,
    required_capabilities, matched_facilities, sent_to_facility_id, sent_to_facility_name,
    assigned_doctor_id, required_specialty, assigned_specialty, assigned_doctor_name, assigned_doctor_code,
    response_deadline
)
VALUES
    (
        'REF-001',
        'PAT-001',
        '{"referenceCode":"CASE-1042","age":58,"sex":"MALE","chiefComplaint":"Severe crushing chest pain, diaphoresis, acute STEMI","emergencyCategory":"CARDIAC","urgencyLevel":"IMMEDIATE","bloodGroup":"O-"}'::JSONB,
        'user-001',
        'REVIEWING',
        '[{"capabilityItem":"ICU","label":"Intensive Care Unit","isMandatory":true},{"capabilityItem":"CARDIAC_CATH_LAB","label":"Cardiac Catheterisation Lab","isMandatory":true},{"capabilityItem":"CARDIOLOGY","label":"Cardiology Specialist","isMandatory":true}]'::JSONB,
        ARRAY['H001', 'H004'],
        'H001',
        'Apollo General Hospital',
        'DOC-H1-01',
        'Cardiology',
        'Cardiology',
        'Dr. Ananya Mehta',
        'DOC-2048',
        NOW() + INTERVAL '8 minutes'
    ),
    (
        'REF-002',
        'PAT-002',
        '{"referenceCode":"CASE-2081","age":34,"sex":"FEMALE","chiefComplaint":"Compound femur fracture and pelvic trauma","emergencyCategory":"TRAUMA","urgencyLevel":"IMMEDIATE","bloodGroup":"A+"}'::JSONB,
        'user-001',
        'ACCEPTED',
        '[{"capabilityItem":"ICU","label":"Intensive Care Unit","isMandatory":true},{"capabilityItem":"TRAUMA_SURGERY","label":"Trauma Surgery","isMandatory":true}]'::JSONB,
        ARRAY['H001', 'H002'],
        'H001',
        'Apollo General Hospital',
        'DOC-H1-01',
        'Orthopedics',
        'Orthopedics',
        'Dr. Ananya Mehta',
        'DOC-2048',
        NOW() + INTERVAL '12 minutes'
    ),
    (
        'REF-003',
        'PAT-003',
        '{"referenceCode":"CASE-3094","age":67,"sex":"MALE","chiefComplaint":"Sudden onset right-sided hemiplegia and dysphasia","emergencyCategory":"NEURO","urgencyLevel":"IMMEDIATE","bloodGroup":"B+"}'::JSONB,
        'user-001',
        'CONFIRMED',
        '[{"capabilityItem":"CT_SCAN","label":"CT Scan","isMandatory":true},{"capabilityItem":"ICU","label":"Intensive Care Unit","isMandatory":true}]'::JSONB,
        ARRAY['H001', 'H003'],
        'H001',
        'Apollo General Hospital',
        'DOC-H1-02',
        'Neurology',
        'Neurology',
        'Dr. Vikram Rao',
        'DOC-2049',
        NOW() + INTERVAL '2 minutes'
    )
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

-- ── 8. REFERRAL EVENTS ──────────────────────────────────────────────────────
INSERT INTO public.referral_events (id, referral_id, event, actor, actor_role, facility_name, is_system_event)
VALUES
    ('EVT-001', 'REF-001', 'Emergency intake and automatic capability matching completed', 'Priya Sharma', 'USER', NULL, FALSE),
    ('EVT-002', 'REF-001', 'Referral request dispatched to Apollo General Hospital', 'ASTRA Router', 'SYSTEM', 'Apollo General Hospital', TRUE),
    ('EVT-003', 'REF-001', 'Assigned to Dr. Ananya Mehta for priority clinical review', 'Sarah Jenkins', 'HOSPITAL_OPS', 'Apollo General Hospital', FALSE)
ON CONFLICT (id) DO NOTHING;

-- ── 9. NOTIFICATIONS ────────────────────────────────────────────────────────
INSERT INTO public.notifications (id, type, title, body, severity, is_read, recipient_role, recipient_id, referral_id, hospital_id, action_label, action_path)
VALUES
    ('N001', 'NEW_REFERRAL', 'New Critical Inbound Referral', 'STEMI case CASE-1042 incoming. Cath lab and CICU required.', 'CRITICAL', FALSE, 'HOSPITAL_OPS', 'ops-001', 'REF-001', 'H001', 'Review Inbound', '/hospital/referrals/REF-001'),
    ('N002', 'CLINICAL_REVIEW_REQUIRED', 'Priority Clinical Decision Needed', 'CASE-1042 (58M STEMI) awaiting clinical acceptance.', 'CRITICAL', FALSE, 'DOCTOR', 'doc-001', 'REF-001', 'H001', 'Review Case', '/doctor/referrals/REF-001'),
    ('N003', 'REFERRAL_ACCEPTED', 'Clinical Acceptance Confirmed', 'Dr. Ananya Mehta accepted CASE-2081. Awaiting bed allocation confirmation.', 'SUCCESS', FALSE, 'HOSPITAL_OPS', 'ops-001', 'REF-002', 'H001', 'Confirm Bed', '/hospital/referrals/REF-002')
ON CONFLICT (id) DO NOTHING;

-- ── 10. AUDIT LOGS ──────────────────────────────────────────────────────────
INSERT INTO public.audit_logs (id, action, actor_id, actor_name, actor_role, target_type, target_id, target_label, details)
VALUES
    ('AUD-001', 'REFERRAL_CREATED', 'user-001', 'Priya Sharma', 'USER', 'REFERRAL', 'REF-001', 'CASE-1042 — Acute STEMI', '{"matchedFacilitiesCount":2}'::JSONB),
    ('AUD-002', 'TRIAGE_ROUTED',   'ops-001',  'Sarah Jenkins', 'HOSPITAL_OPS', 'REFERRAL', 'REF-001', 'CASE-1042', '{"assignedDoctor":"Dr. Ananya Mehta"}'::JSONB)
ON CONFLICT (id) DO NOTHING;
