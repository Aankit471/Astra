export interface DoctorPatient {
  id: string
  name: string
  age: number
  gender: 'Male' | 'Female' | 'Other'
  acuity: 'CRITICAL' | 'URGENT' | 'STABLE'
  bedRoom: string
  reasonForVisit: string
  arrivalTime: string
  status: 'Waiting' | 'In Consultation' | 'Under Review' | 'Admitted' | 'Completed' | 'Urgent' | 'Discharged'
  lastUpdated: string
  vitals: {
    heartRate: number
    bloodPressure: string
    temperature: number
    spO2: number
    respiratoryRate: number
    isCritical?: boolean
  }
  overview: {
    chiefComplaint: string
    currentLocation: string
    assignedDoctor: string
    referringFacility: string
    currentFacility: string
  }
  medicalHistory: {
    conditions: string[]
    allergies: string[]
    medications: string[]
    procedures: string[]
    relevantHistory: string
  }
  clinicalInfo: {
    symptoms: string[]
    initialAssessment: string
    observations: string
    diagnosis: string
    riskIndicators: string[]
  }
  documents: Array<{
    id: string
    name: string
    type: 'LAB_REPORT' | 'IMAGING' | 'CLINICAL_DOC' | 'REFERRAL_DOC'
    uploadedDate: string
    size: string
  }>
  notes: Array<{
    id: string
    author: string
    role: string
    timestamp: string
    content: string
  }>
  timeline: Array<{
    title: string
    time: string
    actor: string
    completed: boolean
  }>
}

export interface DoctorClinicalReview {
  id: string
  patientId: string
  patientName: string
  referralId: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  assignedDoctor: string
  createdTime: string
  dueTime: string
  slaMinutesRemaining: number
  status: 'Pending' | 'In Review' | 'Completed' | 'Escalated'
  findings?: string
  requiredSpecialty: string
  referringFacility: string
}

export interface DoctorTask {
  id: string
  task: string
  patientId?: string
  patientName?: string
  referralId?: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  assignedDate: string
  dueDate: string
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue'
}

export interface DoctorAppointment {
  id: string
  time: string
  patientName: string
  patientId: string
  type: 'Consultation' | 'Clinical Review' | 'Procedure' | 'Follow-up' | 'Meeting'
  location: string
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Urgent'
  duration: string
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
}

export interface DoctorMedicalRecord {
  id: string
  patientName: string
  patientId: string
  recordType: 'Clinical Notes' | 'Lab Results' | 'Imaging' | 'Diagnoses' | 'Medications' | 'Procedures' | 'Discharge Summary'
  date: string
  author: string
  facility: string
  status: 'Verified' | 'Finalized' | 'Preliminary'
  summary: string
}

export interface DoctorMessage {
  id: string
  senderName: string
  senderRole: string
  senderFacility: string
  text: string
  timestamp: string
  isDoctor: boolean
}

export interface DoctorConversation {
  id: string
  contactName: string
  role: string
  facility: string
  patientContext?: {
    name: string
    id: string
    reason: string
  }
  unreadCount: number
  lastMessageTime: string
  messages: DoctorMessage[]
}

export interface DoctorNotificationItem {
  id: string
  type: 'NEW_REFERRAL' | 'URGENT_PATIENT' | 'REVIEW_ASSIGNED' | 'DEADLINE' | 'ESCALATION' | 'MESSAGE' | 'TASK_OVERDUE' | 'PATIENT_UPDATE'
  title: string
  description: string
  timestamp: string
  read: boolean
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO'
}

// ── Mock Patients ─────────────────────────────────────────────────────────
export const MOCK_DOCTOR_PATIENTS: DoctorPatient[] = [
  {
    id: 'PAT-8801',
    name: 'Rajesh Kumar',
    age: 54,
    gender: 'Male',
    acuity: 'CRITICAL',
    bedRoom: 'CICU Bed C-04',
    reasonForVisit: 'Acute ST-Elevation Myocardial Infarction (STEMI)',
    arrivalTime: 'Today, 07:42 AM',
    status: 'Urgent',
    lastUpdated: '10 mins ago',
    vitals: {
      heartRate: 114,
      bloodPressure: '86/54 mmHg',
      temperature: 37.1,
      spO2: 92,
      respiratoryRate: 24,
      isCritical: true,
    },
    overview: {
      chiefComplaint: 'Severe retrosternal crushing chest pain radiating to left mandible and left shoulder.',
      currentLocation: 'Coronary Care Intensive Care Unit (CICU)',
      assignedDoctor: 'Dr. Sarah Jenkins, MD, FACC',
      referringFacility: 'Indiranagar 108 Emergency Ambulance #14',
      currentFacility: 'Metro Central Hospital / Apollo General',
    },
    medicalHistory: {
      conditions: ['Hypertension (10 yrs)', 'Type 2 Diabetes Mellitus', 'Dyslipidemia'],
      allergies: ['Penicillin (Anaphylactoid rash)'],
      medications: ['Metformin 500mg BD', 'Telmisartan 40mg OD', 'Atorvastatin 20mg HS'],
      procedures: ['Appendectomy (2014)'],
      relevantHistory: 'Non-smoker, strong family history of premature CAD (father died of MI age 52).',
    },
    clinicalInfo: {
      symptoms: ['Diaphoresis', 'Pallor', 'Substernal pressure', 'Dyspnea at rest', 'Lightheadedness'],
      initialAssessment: 'Acute coronary syndrome with cardiogenic hypoperfusion. Immediate Primary Percutaneous Coronary Intervention (PCI) required.',
      observations: 'S3 gallop present, bilateral basilar fine inspiratory crackles. Peripheral pulses weak.',
      diagnosis: 'Acute Anterior STEMI with Killip Class II heart failure.',
      riskIndicators: ['TIMI Score 6 (High)', 'GRACE Score 184 (High Risk)', 'Cardiogenic shock threat'],
    },
    documents: [
      { id: 'DOC-101', name: '12-Lead Emergency ECG Trace (V1-V4 STE)', type: 'LAB_REPORT', uploadedDate: 'Today, 07:45 AM', size: '1.4 MB' },
      { id: 'DOC-102', name: 'Point-of-Care Troponin-I (>50 ng/L)', type: 'LAB_REPORT', uploadedDate: 'Today, 07:50 AM', size: '420 KB' },
      { id: 'DOC-103', name: 'Emergency Referral Transfer Protocol', type: 'REFERRAL_DOC', uploadedDate: 'Today, 07:35 AM', size: '890 KB' },
    ],
    notes: [
      {
        id: 'NOTE-01',
        author: 'Dr. Sarah Jenkins, MD',
        role: 'Attending Interventional Cardiologist',
        timestamp: 'Today, 08:05 AM',
        content: 'Patient transferred directly to Cath Lab Table 1. Activated STEMI code team. Dual antiplatelet loading dose confirmed.',
      },
    ],
    timeline: [
      { title: 'Referral Created (EMS)', time: '07:20 AM', actor: 'Paramedic Team 108', completed: true },
      { title: 'Referral Accepted by Dr. Jenkins', time: '07:26 AM', actor: 'Dr. Sarah Jenkins', completed: true },
      { title: 'Patient Arrived at Hospital Bay', time: '07:42 AM', actor: 'Emergency Triage', completed: true },
      { title: 'Clinical Review & Bed Prep', time: '07:45 AM', actor: 'Dr. Sarah Jenkins', completed: true },
      { title: 'Doctor Assessment & Angiography', time: '08:00 AM', actor: 'Cath Lab Team', completed: true },
      { title: 'Primary Stenting / PCI Decision', time: 'In Progress', actor: 'Dr. Sarah Jenkins', completed: false },
      { title: 'CICU Monitoring & Recovery', time: 'Pending', actor: 'CICU Staff', completed: false },
    ],
  },
  {
    id: 'PAT-8802',
    name: 'Meena Pillai',
    age: 62,
    gender: 'Female',
    acuity: 'URGENT',
    bedRoom: 'CSD Room 12',
    reasonForVisit: 'Non-STEMI / Unstable Angina',
    arrivalTime: 'Today, 06:15 AM',
    status: 'In Consultation',
    lastUpdated: '25 mins ago',
    vitals: {
      heartRate: 84,
      bloodPressure: '138/88 mmHg',
      temperature: 36.8,
      spO2: 97,
      respiratoryRate: 18,
      isCritical: false,
    },
    overview: {
      chiefComplaint: 'Intermittent retrosternal tightness on minimal exertion since yesterday evening.',
      currentLocation: 'Cardiology Step-Down Ward',
      assignedDoctor: 'Dr. Sarah Jenkins, MD, FACC',
      referringFacility: 'Apollo Clinic Koramangala',
      currentFacility: 'Metro Central Hospital / Apollo General',
    },
    medicalHistory: {
      conditions: ['Osteoarthritis', 'Hyperlipidemia', 'Mild Bronchial Asthma'],
      allergies: ['Sulfa drugs'],
      medications: ['Rosuvastatin 10mg OD', 'Paracetamol PRN'],
      procedures: ['Total Knee Arthroplasty (2021)'],
      relevantHistory: 'Former smoker (quit 12 years ago).',
    },
    clinicalInfo: {
      symptoms: ['Exertional chest tightness', 'Mild nausea', 'Fatigue'],
      initialAssessment: 'Non-ST elevation ACS. Stable hemodynamics. Diagnostic angiogram scheduled for morning list.',
      observations: 'Heart sounds normal (S1, S2), no murmurs. Lungs clear to auscultation.',
      diagnosis: 'NSTEMI with positive troponin trend.',
      riskIndicators: ['TIMI Score 3 (Intermediate)', 'Stable vitals'],
    },
    documents: [
      { id: 'DOC-201', name: 'Cardiac Serum Enzymes & Troponin Trend', type: 'LAB_REPORT', uploadedDate: 'Today, 06:30 AM', size: '650 KB' },
      { id: 'DOC-202', name: 'Baseline 12-Lead ECG (T-wave inversions V5-V6)', type: 'IMAGING', uploadedDate: 'Today, 06:20 AM', size: '1.2 MB' },
    ],
    notes: [
      {
        id: 'NOTE-02',
        author: 'Dr. Sarah Jenkins, MD',
        role: 'Attending Cardiologist',
        timestamp: 'Today, 07:10 AM',
        content: 'Initiated Fondaparinux 2.5mg sc and Aspirin/Clopidogrel. Scheduled for diagnostic coronarography at 11:30 AM.',
      },
    ],
    timeline: [
      { title: 'Referral Created', time: '05:45 AM', actor: 'Dr. Ramesh (Apollo Clinic)', completed: true },
      { title: 'Referral Accepted', time: '05:55 AM', actor: 'Dr. Sarah Jenkins', completed: true },
      { title: 'Patient Arrived', time: '06:15 AM', actor: 'Intake Staff', completed: true },
      { title: 'Clinical Review Completed', time: '06:35 AM', actor: 'Dr. Sarah Jenkins', completed: true },
      { title: 'Doctor Assessment', time: '07:10 AM', actor: 'Dr. Sarah Jenkins', completed: true },
      { title: 'Angiography Procedure', time: '11:30 AM', actor: 'Cath Lab Team', completed: false },
      { title: 'Post-Procedure Recovery', time: 'Pending', actor: 'Step-Down Nursing', completed: false },
    ],
  },
  {
    id: 'PAT-8803',
    name: 'Vikramaditya Rao',
    age: 42,
    gender: 'Male',
    acuity: 'CRITICAL',
    bedRoom: 'ER Trauma Bay 2',
    reasonForVisit: 'Acute Right Hemiparesis / Acute Ischemic Stroke',
    arrivalTime: 'Today, 08:10 AM',
    status: 'Urgent',
    lastUpdated: '5 mins ago',
    vitals: {
      heartRate: 98,
      bloodPressure: '172/104 mmHg',
      temperature: 37.0,
      spO2: 98,
      respiratoryRate: 20,
      isCritical: true,
    },
    overview: {
      chiefComplaint: 'Sudden onset right facial droop, right arm weakness, and expressive aphasia (onset 1.5h ago).',
      currentLocation: 'Emergency Resuscitation Bay 2',
      assignedDoctor: 'Dr. Sarah Jenkins, MD (Cardio-Vascular Review)',
      referringFacility: 'St. John Trauma Centre',
      currentFacility: 'Metro Central Hospital',
    },
    medicalHistory: {
      conditions: ['Atrial Fibrillation (Paroxysmal)', 'Hypertension'],
      allergies: ['No Known Drug Allergies (NKDA)'],
      medications: ['Diltiazem 60mg TDS'],
      procedures: ['None'],
      relevantHistory: 'History of palpitations not fully investigated.',
    },
    clinicalInfo: {
      symptoms: ['Right arm power 1/5', 'Right leg power 2/5', 'Expressive motor aphasia'],
      initialAssessment: 'Acute Left MCA ischemic territory thromboembolism likely cardioembolic source (AF). Within IV r-tPA window.',
      observations: 'NIHSS Score 14. Non-contrast head CT rules out intracerebral hemorrhage.',
      diagnosis: 'Acute Left MCA Ischemic Stroke secondary to Non-valvular Atrial Fibrillation.',
      riskIndicators: ['NIHSS 14', 'Bleeding precautions during thrombolysis'],
    },
    documents: [
      { id: 'DOC-301', name: 'Brain Non-Contrast CT Scan & Angiography', type: 'IMAGING', uploadedDate: 'Today, 08:22 AM', size: '14.2 MB' },
      { id: 'DOC-302', name: 'Stat Blood Gas, INR, & Platelet Count', type: 'LAB_REPORT', uploadedDate: 'Today, 08:18 AM', size: '510 KB' },
    ],
    notes: [
      {
        id: 'NOTE-03',
        author: 'Dr. Sarah Jenkins, MD',
        role: 'Consulting Cardiologist',
        timestamp: 'Today, 08:30 AM',
        content: 'Holter telemetry confirms fast AF rhythm (rate 120-140 bpm). Concurred with Neurology for IV tenecteplase bolus. Scheduled for bedside Transthoracic Echo to rule out LA appendage thrombus.',
      },
    ],
    timeline: [
      { title: 'Referral Created', time: '07:40 AM', actor: 'St. John Stroke Desk', completed: true },
      { title: 'Accepted by Neuro-Cardio Team', time: '07:48 AM', actor: 'Dr. Sarah Jenkins', completed: true },
      { title: 'Patient Arrived', time: '08:10 AM', actor: 'ER Stroke Bay', completed: true },
      { title: 'CT Scan & Thrombolysis Checklist', time: '08:25 AM', actor: 'Neuro-Radiology', completed: true },
      { title: 'Thrombolysis Infusion Initiated', time: '08:35 AM', actor: 'Dr. Jenkins / Neuro', completed: true },
      { title: 'Neuro ICU Monitoring', time: 'In Progress', actor: 'ICU Nursing', completed: false },
      { title: 'Secondary Prevention Workup', time: 'Pending', actor: 'Cardiology', completed: false },
    ],
  },
  {
    id: 'PAT-8804',
    name: 'Someshwar Hegde',
    age: 71,
    gender: 'Male',
    acuity: 'STABLE',
    bedRoom: 'Gen Med Room 21',
    reasonForVisit: 'Decompensated Heart Failure & Cellulitis',
    arrivalTime: 'Yesterday, 04:30 PM',
    status: 'Admitted',
    lastUpdated: '1 hour ago',
    vitals: {
      heartRate: 72,
      bloodPressure: '124/76 mmHg',
      temperature: 36.6,
      spO2: 96,
      respiratoryRate: 16,
      isCritical: false,
    },
    overview: {
      chiefComplaint: 'Bilateral pedal edema, orthopnea, and lower extremity erythema.',
      currentLocation: 'General Medicine Ward',
      assignedDoctor: 'Dr. Sarah Jenkins, MD',
      referringFacility: 'Direct Intake Triage',
      currentFacility: 'Metro Central Hospital',
    },
    medicalHistory: {
      conditions: ['HFrEF (EF 35%)', 'Chronic Kidney Disease Stage 3a', 'Type 2 Diabetes'],
      allergies: ['Ciprofloxacin'],
      medications: ['Furosemide 40mg OD', 'Empagliflozin 10mg OD', 'Carvedilol 6.25mg BD'],
      procedures: ['Coronary Stenting (2018)'],
      relevantHistory: 'Compliant with fluid restriction, caught recent skin abrasion leading to cellulitis.',
    },
    clinicalInfo: {
      symptoms: ['Trace pedal edema', 'Resolving erythema on left calf', 'No dyspnea at rest'],
      initialAssessment: 'Heart failure stabilized following IV diuresis. Cellulitis responding well to IV Cefazolin.',
      observations: 'JVP not elevated. Soft bilateral wheezes cleared.',
      diagnosis: 'Compensated Ischemic Cardiomyopathy + Resolving Left Leg Cellulitis.',
      riskIndicators: ['Stable trend', 'Creatinine 1.4 mg/dL'],
    },
    documents: [
      { id: 'DOC-401', name: 'Serum Electrolytes, BUN, & Creatinine', type: 'LAB_REPORT', uploadedDate: 'Today, 06:00 AM', size: '380 KB' },
      { id: 'DOC-402', name: 'Transthoracic Echocardiogram Report (EF 38%)', type: 'CLINICAL_DOC', uploadedDate: 'Yesterday, 05:45 PM', size: '2.1 MB' },
    ],
    notes: [
      {
        id: 'NOTE-04',
        author: 'Dr. Sarah Jenkins, MD',
        role: 'Attending Physician',
        timestamp: 'Today, 08:15 AM',
        content: 'Switched diuresis to oral Furosemide 40mg. Complete oral switch for antibiotics tomorrow. Expected discharge within 48h.',
      },
    ],
    timeline: [
      { title: 'Admitted from Triage', time: 'Yesterday 04:30 PM', actor: 'ER Admissions', completed: true },
      { title: 'Inpatient Cardiology Review', time: 'Yesterday 05:30 PM', actor: 'Dr. Sarah Jenkins', completed: true },
      { title: 'Diuresis & Antibiotics Initiated', time: 'Yesterday 06:00 PM', actor: 'Ward Staff', completed: true },
      { title: 'Morning Round & Assessment', time: 'Today 08:15 AM', actor: 'Dr. Sarah Jenkins', completed: true },
      { title: 'Oral Switch & Ambulation Test', time: 'In Progress', actor: 'Physical Therapy', completed: false },
      { title: 'Discharge Summary & Prescription', time: 'Pending', actor: 'Dr. Sarah Jenkins', completed: false },
    ],
  },
]

// ── Mock Clinical Reviews ──────────────────────────────────────────────────
export const MOCK_CLINICAL_REVIEWS: DoctorClinicalReview[] = [
  {
    id: 'REV-901',
    patientId: 'PAT-8801',
    patientName: 'Rajesh Kumar',
    referralId: 'REF-2026-001',
    priority: 'CRITICAL',
    assignedDoctor: 'Dr. Sarah Jenkins, MD',
    createdTime: '25 mins ago',
    dueTime: 'In 5 mins',
    slaMinutesRemaining: 5,
    status: 'Pending',
    requiredSpecialty: 'Interventional Cardiology / Cath Lab',
    referringFacility: 'Indiranagar 108 Emergency Ambulance',
  },
  {
    id: 'REV-902',
    patientId: 'PAT-8802',
    patientName: 'Meena Pillai',
    referralId: 'REF-2026-002',
    priority: 'HIGH',
    assignedDoctor: 'Dr. Sarah Jenkins, MD',
    createdTime: '1.5 hours ago',
    dueTime: 'In 28 mins',
    slaMinutesRemaining: 28,
    status: 'In Review',
    requiredSpecialty: 'Cardiology / Angiogram Evaluation',
    referringFacility: 'Apollo Clinic Koramangala',
  },
  {
    id: 'REV-903',
    patientId: 'PAT-8805',
    patientName: 'Kavita Chawla',
    referralId: 'REF-2026-006',
    priority: 'MEDIUM',
    assignedDoctor: 'Dr. Sarah Jenkins, MD',
    createdTime: '2 hours ago',
    dueTime: 'In 55 mins',
    slaMinutesRemaining: 55,
    status: 'Pending',
    requiredSpecialty: 'Cardio-Pulmonary Clearance',
    referringFacility: 'St. Mary Mission Hospital',
  },
  {
    id: 'REV-904',
    patientId: 'PAT-8806',
    patientName: 'Farida Begum',
    referralId: 'REF-2026-004',
    priority: 'HIGH',
    assignedDoctor: 'Dr. Sarah Jenkins, MD',
    createdTime: '3 hours ago',
    dueTime: 'Completed',
    slaMinutesRemaining: 0,
    status: 'Completed',
    findings: 'Pre-operative cardiovascular evaluation completed. Low perioperative cardiac risk. Cleared for elective laparoscopic appendectomy.',
    requiredSpecialty: 'Pre-operative Cardiac Clearance',
    referringFacility: 'Sunrise Polyclinic',
  },
]

// ── Mock Tasks ─────────────────────────────────────────────────────────────
export const MOCK_DOCTOR_TASKS: DoctorTask[] = [
  {
    id: 'TSK-D01',
    task: 'Review 12-lead ECG & Cath Lab activation for Rajesh Kumar',
    patientId: 'PAT-8801',
    patientName: 'Rajesh Kumar',
    referralId: 'REF-2026-001',
    priority: 'CRITICAL',
    assignedDate: 'Today, 07:45 AM',
    dueDate: 'Today, 08:15 AM',
    status: 'In Progress',
  },
  {
    id: 'TSK-D02',
    task: 'Complete diagnostic angiogram review for Meena Pillai',
    patientId: 'PAT-8802',
    patientName: 'Meena Pillai',
    priority: 'HIGH',
    assignedDate: 'Today, 07:15 AM',
    dueDate: 'Today, 11:30 AM',
    status: 'Pending',
  },
  {
    id: 'TSK-D03',
    task: 'Sign and finalize inpatient discharge summary for Someshwar Hegde',
    patientId: 'PAT-8804',
    patientName: 'Someshwar Hegde',
    priority: 'MEDIUM',
    assignedDate: 'Today, 08:30 AM',
    dueDate: 'Tomorrow, 10:00 AM',
    status: 'Pending',
  },
  {
    id: 'TSK-D04',
    task: 'Respond to referring EMS regarding patient transit anticoagulant protocol',
    referralId: 'REF-2026-001',
    priority: 'HIGH',
    assignedDate: 'Today, 07:25 AM',
    dueDate: 'Today, 08:00 AM',
    status: 'Completed',
  },
  {
    id: 'TSK-D05',
    task: 'Review repeat serum Troponin-I and Potassium results',
    patientId: 'PAT-8802',
    patientName: 'Meena Pillai',
    priority: 'MEDIUM',
    assignedDate: 'Yesterday, 11:00 PM',
    dueDate: 'Today, 06:00 AM',
    status: 'Overdue',
  },
]

// ── Mock Schedule ──────────────────────────────────────────────────────────
export const MOCK_DOCTOR_SCHEDULE: DoctorAppointment[] = [
  {
    id: 'SCH-01',
    time: '08:00 - 08:30 AM',
    patientName: 'Rajesh Kumar',
    patientId: 'PAT-8801',
    type: 'Procedure',
    location: 'Cath Lab Suite 1',
    status: 'Urgent',
    duration: '30 mins',
    dayOfWeek: 'Monday',
  },
  {
    id: 'SCH-02',
    time: '09:00 - 10:00 AM',
    patientName: 'CICU Ward Inpatient Rounds',
    patientId: 'WARD-CICU',
    type: 'Clinical Review',
    location: 'Cardiac Intensive Care Unit',
    status: 'Scheduled',
    duration: '60 mins',
    dayOfWeek: 'Monday',
  },
  {
    id: 'SCH-03',
    time: '11:00 - 11:45 AM',
    patientName: 'Meena Pillai',
    patientId: 'PAT-8802',
    type: 'Procedure',
    location: 'Angiography Room 2',
    status: 'Scheduled',
    duration: '45 mins',
    dayOfWeek: 'Monday',
  },
  {
    id: 'SCH-04',
    time: '01:30 - 02:00 PM',
    patientName: 'Someshwar Hegde',
    patientId: 'PAT-8804',
    type: 'Consultation',
    location: 'Consulting Room 4B',
    status: 'Scheduled',
    duration: '30 mins',
    dayOfWeek: 'Monday',
  },
  {
    id: 'SCH-05',
    time: '03:00 - 04:00 PM',
    patientName: 'Inter-Hospital Trauma Mortality & Morbidity Committee',
    patientId: 'CONF-ROOM-A',
    type: 'Meeting',
    location: 'Auditorium Hall C',
    status: 'Scheduled',
    duration: '60 mins',
    dayOfWeek: 'Monday',
  },
  {
    id: 'SCH-06',
    time: '09:30 - 10:30 AM',
    patientName: 'Post-CABG Outpatient Follow-up Clinic',
    patientId: 'CLINIC-OPD',
    type: 'Follow-up',
    location: 'OPD Chamber 12',
    status: 'Scheduled',
    duration: '60 mins',
    dayOfWeek: 'Tuesday',
  },
  {
    id: 'SCH-07',
    time: '02:00 - 03:30 PM',
    patientName: 'Elective Transcatheter Aortic Valve Implantation (TAVI)',
    patientId: 'PAT-8810',
    type: 'Procedure',
    location: 'Hybrid OR 2',
    status: 'Scheduled',
    duration: '90 mins',
    dayOfWeek: 'Wednesday',
  },
]

// ── Mock Medical Records ───────────────────────────────────────────────────
export const MOCK_MEDICAL_RECORDS: DoctorMedicalRecord[] = [
  {
    id: 'REC-501',
    patientName: 'Rajesh Kumar',
    patientId: 'PAT-8801',
    recordType: 'Imaging',
    date: 'Today, 07:48 AM',
    author: 'Dr. Sarah Jenkins, MD',
    facility: 'Metro Central Hospital / Apollo',
    status: 'Finalized',
    summary: 'Coronary Angiography: 95% proximal LAD thrombotic occlusion with TIMI-0 distal flow. Successful balloon dilatation and deployment of 3.5 x 24mm DES.',
  },
  {
    id: 'REC-502',
    patientName: 'Rajesh Kumar',
    patientId: 'PAT-8801',
    recordType: 'Lab Results',
    date: 'Today, 07:52 AM',
    author: 'Central Pathology Laboratory',
    facility: 'Metro Central Hospital',
    status: 'Verified',
    summary: 'High-Sensitivity Troponin-T: 1,420 ng/L (Elevated, Ref <14). Serum Potassium: 4.1 mmol/L. Serum Creatinine: 1.02 mg/dL.',
  },
  {
    id: 'REC-503',
    patientName: 'Meena Pillai',
    patientId: 'PAT-8802',
    recordType: 'Clinical Notes',
    date: 'Today, 07:12 AM',
    author: 'Dr. Sarah Jenkins, MD',
    facility: 'Metro Central Hospital',
    status: 'Finalized',
    summary: 'Cardiology Admission Progress Note: Patient admitted with accelerated angina. Baseline ECG demonstrates symmetrical T-wave inversions. Plan for coronarography.',
  },
  {
    id: 'REC-504',
    patientName: 'Someshwar Hegde',
    patientId: 'PAT-8804',
    recordType: 'Diagnoses',
    date: 'Yesterday, 06:15 PM',
    author: 'Dr. Sarah Jenkins, MD',
    facility: 'Metro Central Hospital',
    status: 'Finalized',
    summary: 'Primary: Acute on Chronic Decompensated Heart Failure (NYHA Class III). Secondary: Left Lower Extremity Cellulitis.',
  },
  {
    id: 'REC-505',
    patientName: 'Farida Begum',
    patientId: 'PAT-8806',
    recordType: 'Discharge Summary',
    date: 'Yesterday, 02:30 PM',
    author: 'Dr. Sarah Jenkins, MD',
    facility: 'Sunrise Polyclinic / Metro Central',
    status: 'Verified',
    summary: 'Pre-operative Cardiac Evaluation Summary: Patient has low cardiovascular risk indices. Cleared for general anesthesia with routine intra-op hemodynamic monitoring.',
  },
]

// ── Mock Clinical Messages ─────────────────────────────────────────────────
export const MOCK_DOCTOR_CONVERSATIONS: DoctorConversation[] = [
  {
    id: 'CONV-01',
    contactName: 'Dr. K. S. Murthy',
    role: 'Lead EMS Emergency Physician',
    facility: 'Indiranagar 108 ALS Ambulance',
    patientContext: {
      name: 'Rajesh Kumar',
      id: 'PAT-8801',
      reason: 'Acute Anterior STEMI',
    },
    unreadCount: 1,
    lastMessageTime: '07:44 AM',
    messages: [
      {
        id: 'M-101',
        senderName: 'Dr. K. S. Murthy',
        senderRole: 'EMS Physician',
        senderFacility: '108 Ambulance Unit 14',
        text: 'Dr. Jenkins, patient administered 325mg Aspirin and 180mg Ticagrelor at 07:22. Heparin 5000 IU IV given.',
        timestamp: '07:30 AM',
        isDoctor: false,
      },
      {
        id: 'M-102',
        senderName: 'Dr. Sarah Jenkins, MD',
        senderRole: 'Cardiology Lead',
        senderFacility: 'Metro Central Hospital',
        text: 'Received Dr. Murthy. Cath Lab Table 1 is prepped and scrubbed. Transfer directly to Bay 2 on arrival.',
        timestamp: '07:33 AM',
        isDoctor: true,
      },
      {
        id: 'M-103',
        senderName: 'Dr. K. S. Murthy',
        senderRole: 'EMS Physician',
        senderFacility: '108 Ambulance Unit 14',
        text: 'Ambulance is turning into your emergency entrance now. BP holding 88/54 on low-dose dopamine.',
        timestamp: '07:44 AM',
        isDoctor: false,
      },
    ],
  },
  {
    id: 'CONV-02',
    contactName: 'Sr. Mary Kurian, RN',
    role: 'CICU Charge Nurse',
    facility: 'Coronary Intensive Care Unit',
    patientContext: {
      name: 'Rajesh Kumar',
      id: 'PAT-8801',
      reason: 'Post-PCI CICU Bed Allocation',
    },
    unreadCount: 0,
    lastMessageTime: '08:02 AM',
    messages: [
      {
        id: 'M-201',
        senderName: 'Sr. Mary Kurian, RN',
        senderRole: 'CICU Charge Nurse',
        senderFacility: 'CICU Wing C',
        text: 'Dr. Jenkins, Bed C-04 monitor and arterial line transducer are zeroed and ready for post-PCI transfer.',
        timestamp: '08:02 AM',
        isDoctor: false,
      },
    ],
  },
  {
    id: 'CONV-03',
    contactName: 'Dr. Suresh Menon, MD',
    role: 'Trauma Surgery Director',
    facility: 'Government District Hospital',
    unreadCount: 0,
    lastMessageTime: 'Yesterday',
    messages: [
      {
        id: 'M-301',
        senderName: 'Dr. Suresh Menon, MD',
        senderRole: 'Trauma Director',
        senderFacility: 'Govt District Hospital',
        text: 'Thanks for the quick clinical override on the polytrauma case yesterday, Sarah. Patient stabilized post-op.',
        timestamp: 'Yesterday 05:40 PM',
        isDoctor: false,
      },
    ],
  },
]

// ── Mock Notifications ─────────────────────────────────────────────────────
export const MOCK_DOCTOR_NOTIFICATIONS: DoctorNotificationItem[] = [
  {
    id: 'DN-01',
    type: 'URGENT_PATIENT',
    title: 'Emergency STEMI Alert: Rajesh Kumar (54M)',
    description: 'Patient arriving in Cath Lab Table 1. 12-lead ECG demonstrates acute anterior ST-elevation. Immediate intervention protocol active.',
    timestamp: '15 mins ago',
    read: false,
    priority: 'CRITICAL',
  },
  {
    id: 'DN-02',
    type: 'DEADLINE',
    title: 'Clinical Review SLA Approaching: Referral #REF-2026-001',
    description: 'Review response deadline expiring in 5 minutes. Please complete or escalate.',
    timestamp: '25 mins ago',
    read: false,
    priority: 'HIGH',
  },
  {
    id: 'DN-03',
    type: 'NEW_REFERRAL',
    title: 'New Inpatient Referral: Meena Pillai (NSTEMI)',
    description: 'Transferred from Koramangala Clinic for diagnostic coronarography evaluation.',
    timestamp: '1.5 hours ago',
    read: true,
    priority: 'MEDIUM',
  },
  {
    id: 'DN-04',
    type: 'TASK_OVERDUE',
    title: 'Task Overdue: Serum Troponin-I Repeat Review',
    description: 'Repeat Troponin-I report pending clinical signature for 2 hours.',
    timestamp: '2 hours ago',
    read: true,
    priority: 'MEDIUM',
  },
]
