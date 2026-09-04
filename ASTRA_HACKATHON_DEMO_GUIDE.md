# ASTRA — Hackathon Presentation Guide & Live Demo Protocol
> **Scenario**: *"Acute STEMI Emergency Referral — End-to-End Coordination Across Operations, Clinical Specialist, and Platform Governance in Under 3 Minutes"*  
> **Platform Version**: ASTRA Production Build v0.1.0 (Live Supabase Cloud Sync + Zero-Failure Offline Mock Fallback)  
> **Target Ports**: Local Preview (`http://localhost:4173`), Production (`Vercel / Cloudflare Pages`)

---

## ⏱️ Exact 3-Minute Live Presentation Script & Timestamped UI Actions

```
  [00:00 - 00:20]               [00:20 - 01:35]                [01:35 - 02:10]              [02:10 - 02:50]          [02:50 - 03:00]
Emergency Context & Pitch   Hospital Operations Command   Attending Clinical Portal   Platform Admin Governance   Value Proposition
 Fragmented Chaos ──►        Capacity Match & Bed Alloc   ──►   Cath Lab Clinical Auth   ──►   Live Audit Trail   ──►  Life Saved
```

---

### 00:00–00:20 | ASTRA Introduction & The Core Problem
* **Starting View**: `http://localhost:4173/login` (Role Selector Screen).
* **Exact UI Action**: Keep mouse cursor hovering over the three clear role tiles:
  - **Hospital Operations Command**
  - **Attending Emergency Specialist (Doctor)**
  - **State Platform Governance (Admin)**
* **Speaker Script**:
  > *"Every minute of delay in acute STEMI myocardial infarction increases myocardial necrosis and patient mortality. Today, inter-hospital emergency coordination relies on chaotic WhatsApp chats and unanswered phone calls. ASTRA replaces that fragmentation with a synchronized, real-time coordination engine uniting Hospital Operations, Attending Clinical Specialists, and Regulatory Governance into an automated pipeline."*
* **Judge Talking Point**: Notice that there is no public patient self-intake clutter. ASTRA is purpose-built for accredited health system operators and clinical teams.

---

### 00:20–00:50 | Hospital Operations Receives Emergency Referral
* **Exact UI Action**: Click **Hospital Operations** (`ops@astra.demo`).
  - Land on `/hospital/dashboard`.
  - Click **Incoming Referrals** (`/hospital/referrals`) in the sidebar.
  - Locate patient **`AST-1042`** (Rajesh Kumar, 54M, Acute STEMI).
* **Speaker Script**:
  > *"We begin in the command center of Apollo General Hospital. An incoming ambulance referral for patient AST-1042 has arrived with high acuity. Operations staff immediately view real-time vital telemetry: blood pressure 90 over 60, heart rate 112, with clear ST-segment elevation from V1 through V4."*
* **Key Feature Highlight**: Point out the automated capability match tags: `CARDIAC_CATH_LAB`, `ICU`, and `CARDIOLOGY`.

---

### 00:50–01:15 | Hospital Capability Match & Bed Verification
* **Exact UI Action**:
  1. Click **View Details** on case `AST-1042`.
  2. The **Hospital Referral Detail Modal** opens.
  3. Point to the **Facility Match Summary**: Apollo General Hospital has verified Catheterization Lab and emergency cardiology readiness.
  4. Scroll to the **Live Bed & Capacity Matrix**: Show available ICU beds (6 available, AC/Non-AC tariffs displayed).
* **Speaker Script**:
  > *"Before intake can be approved, ASTRA validates that our facility has verified operational readiness: active Cath Lab readiness and telemetry-monitored ICU beds. No emergency patient is transferred to a hospital that cannot treat them."*

---

### 01:15–01:35 | Bed Allocation & Route to Doctor
* **Exact UI Action**:
  1. Click **Accept Referral** button (transitions referral state to `ACCEPTED`).
  2. Click **Allocate Bed** -> Select **ICU Bed (AC)**.
  3. The bed counter decrements live (`available: 5, occupied: 19`).
  4. Click **Route to Doctor** -> Assign to **Dr. Ananya Mehta (DOC-2048 · Cardiology Lead)**.
  5. Close modal or click top-right avatar -> **Sign out**.
* **Speaker Script**:
  > *"Operations commits the intake, reserves an ICU bed, and dispatches the case directly to Dr. Ananya Mehta, Lead Interventional Cardiologist on duty. The state machine transitions immediately to clinical review."*

---

### 01:35–02:10 | Doctor Clinical Portal (Specialty, Blood & Decision)
* **Exact UI Action**:
  1. Click **Doctor** persona (`doctor@astra.demo`) -> Lands on `/doctor/dashboard`.
  2. Click on **Patient Queue** (`/doctor/referrals`) -> Click on **AST-1042**.
  3. Show the **Clinical Review Modal**:
     - Review vitals and cardiology telemetry.
     - Click **Blood Availability** tab (`/doctor/blood`) -> Show live hospital blood inventory across all 8 groups with minimum thresholds (`O+ Available: 14 units`).
     - Return to case `AST-1042`.
  4. In the **Clinical Progress Note** box, enter:
     ```text
     STEMI Code Team activated. Heparin bolus confirmed. Primary PCI catheterization prep underway.
     ```
  5. Click **Add Progress Note** -> The note immediately timestamps with Dr. Mehta's credentials.
  6. Click **Record Clinical Decision** -> Select **ACCEPT / TREATMENT READY** -> Click **Confirm Decision**.
* **Speaker Script**:
  > *"Dr. Mehta receives the routed emergency in her clinical queue. She validates O+ blood availability in the on-site blood bank, logs an official progress note, and stamps the clinical intake decision under her medical registration. Operational routing is now sealed with specialist clinical authority."*

---

### 02:10–02:35 | Admin Governance (Hospital Verification & Full Audit Trail)
* **Exact UI Action**:
  1. Click **Sign out** -> Click **Platform Admin** (`admin@astra.demo`).
  2. Land on `/admin/dashboard` (Platform Governance & Network).
  3. Click **Capability Verification** in the sidebar -> Show hospital verification statuses (`VERIFIED`, `SELF_REPORTED`) with telemetry freshness indicators.
  4. Click **Audit Logs** in the sidebar (`/admin/audit`).
  5. Scroll through the chronological, immutable event timeline:
     - `REFERRAL_ACCEPTED` by `ops@astra.demo`
     - `BED_ALLOCATED` (`H001 ICU Bed`)
     - `ROUTED_TO_CLINICAL_TEAM` (Dr. Ananya Mehta)
     - `CLINICAL_NOTE_ADDED` by `doc-001`
     - `CLINICAL_DECISION_RECORDED` (`ACCEPTED / TREATMENT READY`)
* **Speaker Script**:
  > *"Every single touchpoint across operations and clinical staff is captured in this tamper-evident audit trail. Regulatory bodies and hospital management can trace the entire lifecycle: who authorized the referral, which bed was locked, what clinical note was written, and the exact second the doctor consented."*

---

### 02:35–02:50 | Realtime Synchronization & Architecture Explanation
* **Exact UI Action**: Keep the Audit Stream visible (highlight the pulsing **LIVE AUDIT STREAM** badge in the top right).
* **Speaker Script**:
  > *"Under the hood, ASTRA utilizes a hybrid architecture: Supabase PostgreSQL with Row Level Security and Realtime broadcast channels for live multi-portal synchrony. If cloud connectivity drops or latency spikes in the field, ASTRA automatically falls back to an in-memory, zero-latency reactive database—meaning healthcare teams never experience downtime or data loss."*

---

### 02:50–03:00 | Final Value Proposition
* **Exact UI Action**: Bring cursor to the brand logo.
* **Speaker Script**:
  > *"From emergency referral to catheterization bed allocation in less than three minutes—with zero phone tag, validated capacity, and full audit governance. That is the power of ASTRA."*

---

## 🔑 A. Demo Credentials Cheat-Sheet

| Portal Role | Persona Name | Demo Email | Password | Access Level | Primary Demo Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hospital Operations** | Sarah Jenkins | `ops@astra.demo` | *(One-Click Tile)* | Apollo General (H001) | Intake triage, bed capacity, route to doctor |
| **Doctor / Specialist** | Dr. Ananya Mehta | `doctor@astra.demo` | *(One-Click Tile)* | Emergency Cardiology (DOC-2048) | Vitals review, blood check, clinical note, intake auth |
| **Platform Admin** | Platform Governance | `admin@astra.demo` | *(One-Click Tile)* | Global Network Audit | Capability verification, audit trail, **DEMO RESET** |

---

## 🖥️ B. Recommended Browser Setup

1. **Resolution**: 1920x1080 or 1440x900 full screen. Clean browser window (Chrome or Edge recommended).
2. **Tabs**:
   - **Tab 1**: Presentation app (`http://localhost:4173`).
   - *(Optional multi-window demo)*: Split screen with Hospital Ops on the left and Doctor Portal on the right to demonstrate live realtime synchronization across windows.
3. **Audio / Video**: Zoom level at 100% or 90% for high-density dashboard visibility.

---

## 🔄 C. One-Click Demo Reset Procedure

Evaluators and judges frequently ask to rerun the scenario from scratch. ASTRA features an integrated, production-safe **DEMO RESET** control:

1. Log into the **Platform Admin** portal (`admin@astra.demo`).
2. In the topbar header (or sidebar bottom), click **Reset Demo** (icon with amber badge).
3. The **Reset Demo Baseline Modal** appears, detailing:
   - Reset of synthetic emergency case `AST-1042` to default inbound state.
   - Restoration of Apollo General Hospital bed capacities (6 available ICU beds).
   - Restoration of all 8 blood inventory levels.
   - Recording of a `DEMO_STATE_RESET` audit log.
4. Click **Confirm Demo Reset**.
5. The system resets in under 500ms and returns a success confirmation. The presentation can immediately restart from 00:00!

> **Safety Notice**: Demo Reset is strictly guarded by RBAC (`ADMIN` only). It never exposes service-role keys, never deletes database schemas, tables, or real user accounts.

---

## 🌐 D. Offline / Mock Fallback Protocol

ASTRA includes bulletproof fallback mechanisms:
- If `VITE_USE_MOCK_API=true` or network disconnects, the app operates entirely in-memory with local storage persistence.
- Click the **Simulate Offline** button in the sidebar bottom to demonstrate resilience to judges: a warning bar appears indicating cached telemetry, while routing and notes continue to work without a single crash.

---

## 💡 E. What to Say to Judges (Key Talking Points)

1. **"Why not just use WhatsApp or telephone calls?"**
   > *"WhatsApp provides zero verification of bed availability, no clinical authentication, no mathematical capacity guards, and zero medico-legal auditability. ASTRA eliminates patient transfer rejection at the hospital doorstep."*
2. **"How does ASTRA handle patient privacy and data governance?"**
   > *"ASTRA uses strict Role-Based Access Control (RBAC) and Row Level Security (RLS). Hospital operations staff see intake and beds; doctors see clinical vitals and treatment notes; state regulators see governance and audit logs. No single role has unchecked access."*
3. **"What happens if hospital telemetry is out of date?"**
   > *"ASTRA tracks capability data freshness down to the minute. Telemetry older than 24 hours is automatically flagged as STALE with visual warning banners, prompting manual re-validation before patients are dispatched."*

---

## ⚡ F. Key Technical Differentiators

* **Strict 3-Role Separation**: Hospital Operations, Clinical Specialist, and State Governance.
* **Deterministic Mathematical Guards**: Available + Occupied + Reserved beds cannot exceed total capacity.
* **Complete 8-Group Blood Bank Telemetry**: A+, A-, B+, B-, AB+, AB-, O+, O- with live stock thresholds.
* **Immutable Event Sourcing**: Every bed lock, clinical note, and triage action records an immutable audit log.
* **Zero-Downtime Resilience**: Seamless dual-engine design (Supabase Cloud + In-Memory Fallback).

---

## 🚨 G. Backup Flow if Supabase / Network Fails

1. If the live internet connection drops during presentation:
   - The app automatically switches to the offline in-memory reactive database.
   - All actions (accepting referrals, allocating beds, writing notes, resetting demo) continue working seamlessly.
2. If a network timeout warning appears:
   - Simply proceed with the presentation; state remains preserved in local memory.

---

## ⚠️ H. "Do Not Click" / Risky Actions During Presentation

* ❌ **Do not click** random browser navigation to non-existent URLs.
* ❌ **Do not attempt** to login as a patient (the patient portal was deliberately removed to focus on institutional healthcare coordination).
* ❌ **Do not manually edit** database tables in the Supabase console during the 3-minute pitch; use the built-in **Reset Demo** button instead.

---

## 🏗️ I. Final 30-Second Architecture Explanation

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                 ASTRA FRONTEND                                    │
│       Hospital Operations         Doctor Clinical           Admin Governance      │
│      [Bed Matrix / Triage]      [Vitals & Cath Notes]     [Verification & Audit]  │
└─────────────────────────┬───────────────────┬───────────────────┬─────────────────┘
                          │                   │                   │
                          ▼                   ▼                   ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                            UNIFIED REPOSITORY LAYER                               │
│     referralRepository    bedRepository    hospitalRepository    auditRepository  │
└─────────────────────────┬───────────────────────────────────────┬─────────────────┘
                          │                                       │
            ┌─────────────┴─────────────┐           ┌─────────────┴─────────────┐
            ▼                           ▼           ▼                           ▼
  [ Supabase Realtime ]       [ PostgreSQL RLS ]  [ MockDatabase Singleton ]  [ Local Storage ]
    Live Sync & Events         Secure Cloud DB        Zero-Latency Fallback     Session Cache
```

> *"ASTRA separates UI components from data access through an abstracted repository pattern. Portals interface with typed repositories (`referralRepository`, `bedRepository`, `auditRepository`) that intelligently route to Supabase with Row Level Security when online, and instantly fall back to a reactive in-memory database if connectivity fails. This guarantees high reliability in life-or-death emergency operations."*

---

## 📊 Complete Referral Lifecycle Status & Audit Trace Matrix

| Stage | Triggering Portal | Actor | Expected Status | Recorded Audit Event | Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Inbound Referral** | Dispatch System | Paramedic / System | `REVIEWING` / `PENDING` | `REFERRAL_CREATED` | Referral `REF-001` (`AST-1042`) |
| **2. Capability Verified** | Hospital Operations | Sarah Jenkins (`ops@astra.demo`) | `REVIEWING` | `CAPABILITY_VERIFIED` | Apollo General (`H001`) |
| **3. Bed Allocated** | Hospital Operations | Sarah Jenkins (`ops@astra.demo`) | `REVIEWING` | `BED_ALLOCATED` | ICU Bed (AC) |
| **4. Route to Doctor** | Hospital Operations | Sarah Jenkins (`ops@astra.demo`) | `REVIEWING` | `REFERRAL_ROUTED_TO_CLINICAL` | Dr. Ananya Mehta (`doc-001`) |
| **5. Clinical Note** | Doctor Specialist | Dr. Ananya Mehta (`doctor@astra.demo`) | `REVIEWING` | `CLINICAL_NOTE_ADDED` | Referral `REF-001` |
| **6. Clinical Acceptance** | Doctor Specialist | Dr. Ananya Mehta (`doctor@astra.demo`) | `ACCEPTED` | `CLINICAL_ACCEPTED` | Referral `REF-001` |
| **7. Governance Reset** | Platform Admin | Administrator (`admin@astra.demo`) | `REVIEWING` (Baseline) | `DEMO_STATE_RESET` | Hackathon Demo Baseline |

---

## 📋 Pre-Demo Presenter Checklist

- [x] **Dev/Preview Server**: `npm run preview -- --port 4173` running and accessible.
- [x] **Login Test**: Verify all 3 one-click persona tiles (`ops@astra.demo`, `doctor@astra.demo`, `admin@astra.demo`) log in instantly.
- [x] **Primary Case Ready**: Case `AST-1042` (Acute STEMI, 54M) present in incoming queue.
- [x] **Beds Primed**: Apollo General Hospital has 6 available ICU beds.
- [x] **Blood Stock Verified**: 8 blood groups visible under `/doctor/blood` with O+ stock >= 10 units.
- [x] **Demo Reset Tested**: Admin **Reset Demo** button restores baseline state in < 1 second.
- [x] **Network Fallback**: Offline mode tested via sidebar **Simulate Offline** toggle.
