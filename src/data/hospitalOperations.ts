export interface HospitalWard {
  id: string
  name: string
  code: string
  floor: string
  totalBeds: number
  availableBeds: number
  occupiedBeds: number
  reservedBeds: number
  cleaningBeds: number
  outOfServiceBeds: number
  headNurse: string
  phoneExt: string
  specialty: string
  status: 'OPTIMAL' | 'NEAR_CAPACITY' | 'CRITICAL'
}

export interface HospitalPatient {
  id: string
  name: string
  age: number
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  acuity: 'CRITICAL' | 'EMERGENT' | 'URGENT' | 'STABLE'
  ward: string
  room: string
  bed: string
  comfort: 'AC' | 'NON_AC'
  assignedDoctor: string
  assignedDoctorSpecialty: string
  primaryNurse: string
  admissionTime: string
  estimatedDischarge?: string
  status: 'EMERGENCY' | 'ADMITTED' | 'WAITING' | 'IN_TRANSIT' | 'CRITICAL' | 'DISCHARGE_PENDING' | 'TRANSFERRED'
  chiefComplaint: string
  diagnosis: string
  referralId?: string
  referringFacility?: string
}

export interface HospitalAdmission {
  id: string
  patientName: string
  patientId: string
  age: number
  gender: 'MALE' | 'FEMALE'
  acuity: 'CRITICAL' | 'EMERGENT' | 'URGENT'
  admissionType: 'EMERGENCY_REFERRAL' | 'DIRECT_INTAKE' | 'SCHEDULED_TRANSFER'
  referringFacility: string
  targetWard: string
  assignedBed?: string
  status: 'PENDING_BED' | 'BED_ASSIGNED' | 'CHECKING_IN' | 'ADMITTED' | 'CANCELLED'
  intakeTime: string
  etaMinutes?: number
  specialRequirements: string[]
}

export interface HospitalTransfer {
  id: string
  patientName: string
  patientId: string
  direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL_WARD'
  origin: string
  destination: string
  acuity: 'CRITICAL' | 'URGENT' | 'STABLE'
  transportMode: 'ALS_AMBULANCE' | 'BLS_AMBULANCE' | 'INTERNAL_STRETCHER'
  etaMinutes: number
  status: 'REQUESTED' | 'DISPATCHED' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED'
  clinicalLead: string
}

export interface HospitalTask {
  id: string
  title: string
  category: 'BED_PREP' | 'PATIENT_TRANSPORT' | 'EQUIPMENT_CHECK' | 'SANITIZATION' | 'CLINICAL_COORDINATION'
  ward: string
  assignedTo: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  dueTime: string
}

export interface HospitalStaffMember {
  id: string
  name: string
  role: 'CHARGE_NURSE' | 'WARD_COORDINATOR' | 'INTAKE_CLERK' | 'OPERATIONS_SUPERVISOR' | 'BED_MANAGER'
  department: string
  shift: 'MORNING' | 'EVENING' | 'NIGHT'
  status: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY'
  phone: string
  extension: string
}

const now = Date.now()
const mins = (m: number) => new Date(now - m * 60_000).toISOString()
const hours = (h: number) => new Date(now - h * 3600_000).toISOString()

// ── Wards Data ─────────────────────────────────────────────────────────────
export const MOCK_WARDS: HospitalWard[] = [
  {
    id: 'W-EMER',
    name: 'Emergency Resuscitation Bay',
    code: 'ER-BAY',
    floor: 'Ground Floor (Wing A)',
    totalBeds: 16,
    availableBeds: 4,
    occupiedBeds: 10,
    reservedBeds: 1,
    cleaningBeds: 1,
    outOfServiceBeds: 0,
    headNurse: 'Sr. Sunita Sharma, RN',
    phoneExt: 'Ext 101',
    specialty: 'Emergency & Trauma',
    status: 'NEAR_CAPACITY',
  },
  {
    id: 'W-ICU',
    name: 'Intensive Coronary & Cardiac ICU',
    code: 'CICU',
    floor: '1st Floor (Wing C)',
    totalBeds: 24,
    availableBeds: 5,
    occupiedBeds: 16,
    reservedBeds: 2,
    cleaningBeds: 1,
    outOfServiceBeds: 0,
    headNurse: 'Sr. Mary Kurian, RN',
    phoneExt: 'Ext 204',
    specialty: 'Cardiac Intensive Care',
    status: 'OPTIMAL',
  },
  {
    id: 'W-CARD',
    name: 'Cardiology Step-Down Ward',
    code: 'CARD-SD',
    floor: '2nd Floor (Wing B)',
    totalBeds: 20,
    availableBeds: 6,
    occupiedBeds: 12,
    reservedBeds: 1,
    cleaningBeds: 1,
    outOfServiceBeds: 0,
    headNurse: 'Sr. Deepa Nair, RN',
    phoneExt: 'Ext 310',
    specialty: 'Interventional Cardiology',
    status: 'OPTIMAL',
  },
  {
    id: 'W-MED',
    name: 'General Medicine Ward',
    code: 'GEN-MED',
    floor: '3rd Floor (Wing A)',
    totalBeds: 35,
    availableBeds: 8,
    occupiedBeds: 24,
    reservedBeds: 1,
    cleaningBeds: 2,
    outOfServiceBeds: 0,
    headNurse: 'Sr. Lakshmi Prasad, RN',
    phoneExt: 'Ext 415',
    specialty: 'Internal Medicine',
    status: 'OPTIMAL',
  },
  {
    id: 'W-PED',
    name: 'Pediatrics Acute Ward',
    code: 'PED-AC',
    floor: '2nd Floor (Wing D)',
    totalBeds: 18,
    availableBeds: 6,
    occupiedBeds: 10,
    reservedBeds: 1,
    cleaningBeds: 1,
    outOfServiceBeds: 0,
    headNurse: 'Sr. Bhavna Joshi, RN',
    phoneExt: 'Ext 222',
    specialty: 'Pediatric Care',
    status: 'OPTIMAL',
  },
  {
    id: 'W-SURG',
    name: 'Post-Operative Surgery Ward',
    code: 'SURG-PO',
    floor: '4th Floor (Wing B)',
    totalBeds: 28,
    availableBeds: 3,
    occupiedBeds: 22,
    reservedBeds: 2,
    cleaningBeds: 1,
    outOfServiceBeds: 0,
    headNurse: 'Sr. Ritu Sen, RN',
    phoneExt: 'Ext 512',
    specialty: 'General & Vascular Surgery',
    status: 'CRITICAL',
  },
]

// ── Hospital Patients ──────────────────────────────────────────────────────
export const MOCK_HOSPITAL_PATIENTS: HospitalPatient[] = [
  {
    id: 'PAT-1042',
    name: 'Rajesh Kumar',
    age: 54,
    gender: 'MALE',
    acuity: 'CRITICAL',
    ward: 'Intensive Coronary & Cardiac ICU',
    room: 'CICU-04',
    bed: 'Bed C-04 (AC)',
    comfort: 'AC',
    assignedDoctor: 'Dr. Ananya Mehta',
    assignedDoctorSpecialty: 'Cardiology Lead',
    primaryNurse: 'Sr. Mary Kurian',
    admissionTime: hours(3),
    status: 'CRITICAL',
    chiefComplaint: 'Acute Anterior STEMI / Cardiogenic Shock',
    diagnosis: 'Occlusive CAD · Post Primary PCI with drug-eluting stent',
    referralId: 'REF-2026-001',
    referringFacility: 'Indiranagar 108 Emergency Ambulance',
  },
  {
    id: 'PAT-1043',
    name: 'Meena Pillai',
    age: 62,
    gender: 'FEMALE',
    acuity: 'EMERGENT',
    ward: 'Cardiology Step-Down Ward',
    room: 'CSD-12',
    bed: 'Bed B-12 (AC Private)',
    comfort: 'AC',
    assignedDoctor: 'Dr. Rahul Verma',
    assignedDoctorSpecialty: 'Interventional Cardiology',
    primaryNurse: 'Sr. Deepa Nair',
    admissionTime: hours(8),
    estimatedDischarge: 'Tomorrow, 14:00',
    status: 'ADMITTED',
    chiefComplaint: 'Non-STEMI with episodic angina and diaphoresis',
    diagnosis: 'Subacute myocardial ischemia · Conservative medical management',
    referralId: 'REF-2026-002',
    referringFacility: 'Apollo Clinic Koramangala',
  },
  {
    id: 'PAT-1044',
    name: 'Vikramaditya Rao',
    age: 42,
    gender: 'MALE',
    acuity: 'CRITICAL',
    ward: 'Emergency Resuscitation Bay',
    room: 'ER-BAY-02',
    bed: 'Bay 2 Trauma Bed (AC)',
    comfort: 'AC',
    assignedDoctor: 'Dr. Vikram Rao',
    assignedDoctorSpecialty: 'Emergency Neurology',
    primaryNurse: 'Sr. Sunita Sharma',
    admissionTime: mins(45),
    status: 'EMERGENCY',
    chiefComplaint: 'Acute right-sided hemiparesis with expressive aphasia (onset 1.5h)',
    diagnosis: 'Hyperacute Left MCA Ischemic Stroke · IV Thrombolysis in progress',
    referralId: 'REF-2026-003',
    referringFacility: 'St. John Trauma Centre',
  },
  {
    id: 'PAT-1045',
    name: 'Farida Begum',
    age: 38,
    gender: 'FEMALE',
    acuity: 'URGENT',
    ward: 'Post-Operative Surgery Ward',
    room: 'SURG-08',
    bed: 'Bed S-08 (AC Private)',
    comfort: 'AC',
    assignedDoctor: 'Dr. Priya Nair',
    assignedDoctorSpecialty: 'General Surgery',
    primaryNurse: 'Sr. Ritu Sen',
    admissionTime: hours(14),
    estimatedDischarge: 'In 2 days',
    status: 'ADMITTED',
    chiefComplaint: 'Perforated acute appendicitis',
    diagnosis: 'Laparoscopic appendectomy · Stable surgical wound healing',
    referralId: 'REF-2026-004',
    referringFacility: 'Sunrise Polyclinic',
  },
  {
    id: 'PAT-1046',
    name: 'Aarav Gupta',
    age: 7,
    gender: 'MALE',
    acuity: 'URGENT',
    ward: 'Pediatrics Acute Ward',
    room: 'PED-03',
    bed: 'Bed P-03 (AC Pediatric)',
    comfort: 'AC',
    assignedDoctor: 'Dr. Sneha Kulkarni',
    assignedDoctorSpecialty: 'Pediatric Care',
    primaryNurse: 'Sr. Bhavna Joshi',
    admissionTime: hours(18),
    estimatedDischarge: 'Today, 18:00',
    status: 'DISCHARGE_PENDING',
    chiefComplaint: 'Acute bronchiolitis with respiratory distress',
    diagnosis: 'Viral bronchiolitis · Wheeze resolved on nebulization',
  },
  {
    id: 'PAT-1047',
    name: 'Someshwar Hegde',
    age: 71,
    gender: 'MALE',
    acuity: 'STABLE',
    ward: 'General Medicine Ward',
    room: 'MED-21',
    bed: 'Bed M-21 (Non-AC Shared)',
    comfort: 'NON_AC',
    assignedDoctor: 'Dr. Arvind Kejriwal',
    assignedDoctorSpecialty: 'Internal Medicine',
    primaryNurse: 'Sr. Lakshmi Prasad',
    admissionTime: hours(36),
    status: 'ADMITTED',
    chiefComplaint: 'Decompensated Type 2 Diabetes with cellulitis',
    diagnosis: 'Lower extremity cellulitis under targeted IV cephalosporin',
  },
  {
    id: 'PAT-1048',
    name: 'Kavita Chawla',
    age: 29,
    gender: 'FEMALE',
    acuity: 'EMERGENT',
    ward: 'Emergency Resuscitation Bay',
    room: 'ER-WAIT',
    bed: 'Stretcher T-04 (Awaiting Bed Assignment)',
    comfort: 'NON_AC',
    assignedDoctor: 'Dr. Suresh Menon',
    assignedDoctorSpecialty: 'Orthopedic Trauma',
    primaryNurse: 'Sr. Sunita Sharma',
    admissionTime: mins(25),
    status: 'WAITING',
    chiefComplaint: 'Closed femur fracture sustained in two-wheeler accident',
    diagnosis: 'Right mid-shaft femur fracture · Traction applied · Awaiting Ortho Bed',
  },
  {
    id: 'PAT-1049',
    name: 'Harish Chandra',
    age: 59,
    gender: 'MALE',
    acuity: 'CRITICAL',
    ward: 'In Transit',
    room: 'En Route',
    bed: '108 ALS Ambulance #KA-04-1288',
    comfort: 'AC',
    assignedDoctor: 'Dr. Ananya Mehta',
    assignedDoctorSpecialty: 'Cardiology Reviewer',
    primaryNurse: 'Paramedic Team Alpha',
    admissionTime: mins(15),
    status: 'IN_TRANSIT',
    chiefComplaint: 'Third-degree complete heart block with syncopal attack',
    diagnosis: 'Complete AV Dissociation · Temporary pacemaker wire queued',
    referralId: 'REF-2026-005',
    referringFacility: 'Government District Hospital',
  },
  {
    id: 'PAT-1050',
    name: 'Sunita Deshmukh',
    age: 51,
    gender: 'FEMALE',
    acuity: 'STABLE',
    ward: 'General Medicine Ward',
    room: 'MED-14',
    bed: 'Bed M-14 (Non-AC)',
    comfort: 'NON_AC',
    assignedDoctor: 'Dr. Arvind Kejriwal',
    assignedDoctorSpecialty: 'Internal Medicine',
    primaryNurse: 'Sr. Lakshmi Prasad',
    admissionTime: hours(48),
    status: 'DISCHARGE_PENDING',
    chiefComplaint: 'Community acquired lobar pneumonia',
    diagnosis: 'Pneumonia resolved · Oral switch completed · Pending pharmacy discharge',
  },
  {
    id: 'PAT-1051',
    name: 'Rohan Banerjee',
    age: 33,
    gender: 'MALE',
    acuity: 'STABLE',
    ward: 'Transferred',
    room: 'Transferred Out',
    bed: 'Tertiary Burn Centre Bed',
    comfort: 'AC',
    assignedDoctor: 'Dr. Priya Nair',
    assignedDoctorSpecialty: 'Trauma Specialist',
    primaryNurse: 'Sr. Ritu Sen',
    admissionTime: hours(60),
    status: 'TRANSFERRED',
    chiefComplaint: 'Specialized 40% TBSA burns management transfer',
    diagnosis: 'Transferred to Victoria Burn Center for dedicated laminar airflow suite',
  },
]

// ── Admissions Queue ───────────────────────────────────────────────────────
export const MOCK_ADMISSIONS_QUEUE: HospitalAdmission[] = [
  {
    id: 'ADM-801',
    patientName: 'Harish Chandra',
    patientId: 'PAT-1049',
    age: 59,
    gender: 'MALE',
    acuity: 'CRITICAL',
    admissionType: 'EMERGENCY_REFERRAL',
    referringFacility: 'Government District Hospital',
    targetWard: 'Intensive Coronary & Cardiac ICU',
    assignedBed: 'CICU Bed C-06 (AC)',
    status: 'BED_ASSIGNED',
    intakeTime: mins(15),
    etaMinutes: 12,
    specialRequirements: ['Cardiac Monitor', 'Transvenous Pacing Tray', '100% O2 Support'],
  },
  {
    id: 'ADM-802',
    patientName: 'Kavita Chawla',
    patientId: 'PAT-1048',
    age: 29,
    gender: 'FEMALE',
    acuity: 'EMERGENT',
    admissionType: 'DIRECT_INTAKE',
    referringFacility: 'Emergency Bay Triage',
    targetWard: 'Post-Operative Surgery Ward',
    status: 'PENDING_BED',
    intakeTime: mins(25),
    specialRequirements: ['Thomas Splint Traction', 'Pain Management IV', 'Ortho Pre-op Prep'],
  },
  {
    id: 'ADM-803',
    patientName: 'Geeta Varma',
    patientId: 'PAT-1052',
    age: 48,
    gender: 'FEMALE',
    acuity: 'URGENT',
    admissionType: 'SCHEDULED_TRANSFER',
    referringFacility: 'St. Mary Mission Hospital',
    targetWard: 'Cardiology Step-Down Ward',
    assignedBed: 'Bed CSD-08 (AC Private)',
    status: 'CHECKING_IN',
    intakeTime: hours(1),
    specialRequirements: ['Telemetry telemetry lead', 'Low sodium cardiac diet'],
  },
]

// ── Patient Transfers ──────────────────────────────────────────────────────
export const MOCK_TRANSFERS: HospitalTransfer[] = [
  {
    id: 'TRF-301',
    patientName: 'Harish Chandra',
    patientId: 'PAT-1049',
    direction: 'INBOUND',
    origin: 'Government District Hospital',
    destination: 'Apollo General Hospital · CICU',
    acuity: 'CRITICAL',
    transportMode: 'ALS_AMBULANCE',
    etaMinutes: 12,
    status: 'IN_TRANSIT',
    clinicalLead: 'Dr. Suresh Menon (Govt) → Dr. Ananya Mehta (Apollo)',
  },
  {
    id: 'TRF-302',
    patientName: 'Meena Pillai',
    patientId: 'PAT-1043',
    direction: 'INTERNAL_WARD',
    origin: 'Emergency Resuscitation Bay',
    destination: 'Cardiology Step-Down Ward (CSD-12)',
    acuity: 'URGENT',
    transportMode: 'INTERNAL_STRETCHER',
    etaMinutes: 0,
    status: 'COMPLETED',
    clinicalLead: 'Sr. Sunita Sharma → Sr. Deepa Nair',
  },
  {
    id: 'TRF-303',
    patientName: 'Rohan Banerjee',
    patientId: 'PAT-1051',
    direction: 'OUTBOUND',
    origin: 'Apollo General Hospital',
    destination: 'Victoria Tertiary Burn Specialty Center',
    acuity: 'CRITICAL',
    transportMode: 'ALS_AMBULANCE',
    etaMinutes: 0,
    status: 'COMPLETED',
    clinicalLead: 'Dr. Priya Nair → Dr. K. Raman (Victoria)',
  },
]

// ── Operational Tasks ──────────────────────────────────────────────────────
export const MOCK_OPERATIONAL_TASKS: HospitalTask[] = [
  {
    id: 'TSK-101',
    title: 'Sanitize and prep CICU Bed C-06 with cardiac monitor for incoming transfer',
    category: 'BED_PREP',
    ward: 'Intensive Coronary & Cardiac ICU',
    assignedTo: 'Orderly Ramesh K.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueTime: '10 mins',
  },
  {
    id: 'TSK-102',
    title: 'Transfer 2 units Packed RBC (O+ Rh positive) from Blood Bank to Trauma Bay 2',
    category: 'CLINICAL_COORDINATION',
    ward: 'Emergency Resuscitation Bay',
    assignedTo: 'Nurse Technician Ajay',
    priority: 'HIGH',
    status: 'COMPLETED',
    dueTime: 'Done 15m ago',
  },
  {
    id: 'TSK-103',
    title: 'Post-op Surgery Ward Bed S-08 discharge sanitization & bedding change',
    category: 'SANITIZATION',
    ward: 'Post-Operative Surgery Ward',
    assignedTo: 'Housekeeping Lead Priya',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueTime: '30 mins',
  },
  {
    id: 'TSK-104',
    title: 'Daily calibration check of transport ventilator in ALS Ambulance Unit #1',
    category: 'EQUIPMENT_CHECK',
    ward: 'Hospital Fleet Station',
    assignedTo: 'BioMed Engg. Naveen',
    priority: 'LOW',
    status: 'COMPLETED',
    dueTime: 'Done 1h ago',
  },
  {
    id: 'TSK-105',
    title: 'Escort patient Aarav Gupta to Pediatric Pharmacy for discharge packet',
    category: 'PATIENT_TRANSPORT',
    ward: 'Pediatrics Acute Ward',
    assignedTo: 'Ward Clerk Sneha',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueTime: '45 mins',
  },
]

// ── Hospital Staff Directory ───────────────────────────────────────────────
export const MOCK_HOSPITAL_STAFF: HospitalStaffMember[] = [
  {
    id: 'STF-01',
    name: 'Anita Roy',
    role: 'OPERATIONS_SUPERVISOR',
    department: 'Hospital Central Command',
    shift: 'MORNING',
    status: 'ON_DUTY',
    phone: '+91 98450 11223',
    extension: 'Ext 100',
  },
  {
    id: 'STF-02',
    name: 'Sr. Sunita Sharma, RN',
    role: 'CHARGE_NURSE',
    department: 'Emergency & Trauma Bay',
    shift: 'MORNING',
    status: 'ON_DUTY',
    phone: '+91 98450 22334',
    extension: 'Ext 101',
  },
  {
    id: 'STF-03',
    name: 'Sr. Mary Kurian, RN',
    role: 'CHARGE_NURSE',
    department: 'Intensive Coronary & Cardiac ICU',
    shift: 'MORNING',
    status: 'ON_DUTY',
    phone: '+91 98450 33445',
    extension: 'Ext 204',
  },
  {
    id: 'STF-04',
    name: 'Karthik Subramanian',
    role: 'BED_MANAGER',
    department: 'Bed Allocation & Admissions Bureau',
    shift: 'MORNING',
    status: 'ON_DUTY',
    phone: '+91 98450 44556',
    extension: 'Ext 115',
  },
  {
    id: 'STF-05',
    name: 'Pooja Hegde',
    role: 'INTAKE_CLERK',
    department: 'Patient Referral Registration',
    shift: 'MORNING',
    status: 'ON_DUTY',
    phone: '+91 98450 55667',
    extension: 'Ext 112',
  },
  {
    id: 'STF-06',
    name: 'Sr. Deepa Nair, RN',
    role: 'CHARGE_NURSE',
    department: 'Cardiology Step-Down Ward',
    shift: 'MORNING',
    status: 'ON_DUTY',
    phone: '+91 98450 66778',
    extension: 'Ext 310',
  },
]
