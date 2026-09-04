# ASTRA — Hackathon Presentation Runbook & Production Guide
> **Scenario**: *"Acute STEMI Emergency Referral — From Intake to Interventional CCU in Under 3 Minutes"*  
> **Target Deployments**: Vercel (`vercel.json`), Cloudflare Pages (`public/_redirects`), Local Preview (`http://localhost:4173`)  
> **Platform Version**: ASTRA Production Build v0.1.0 (Connected to Supabase `astra-production-demo` with Offline Mock Fallback)

---

## 🚀 Quick Setup & Launch

### Local Run (Production Preview)
```bash
npm run build
npm run preview
# Open http://localhost:4173 in browser
```

### Production Hosting Verification
- **Vercel**: SPA catch-all rewrites configured in `vercel.json` (`/(.*) -> /index.html`).
- **Cloudflare Pages**: SPA catch-all configured in `public/_redirects` (`/* /index.html 200`).
- **Environment Variables**:
  - `VITE_USE_MOCK_API=false` + valid `VITE_SUPABASE_URL` connects directly to live Supabase cloud database.
  - If offline or Supabase connection drops, ASTRA automatically falls back to in-memory reactive `MockDatabase` without crashing or showing blank screens.

---

## ⏱️ 3-Minute Interactive Demo Script

```
   [0:00 - 0:30]                   [0:30 - 1:45]                     [1:45 - 2:30]                   [2:30 - 3:00]
Emergency Context          Hospital Operations Intake          Doctor Clinical Review          Platform Audit Trace
The Problem & Pitch    ──►     Bed & PCI Coordination     ──►    Cath Lab Decision Auth   ──►    Immutable Governance
```

---

### Phase 1: The Pitch & Emergency Context (0:00 - 0:30)
* **Action**: Start at the Login Screen (`http://localhost:4173/login`).
* **Speaker Script**:
  > *"Every minute of delay in acute STEMI myocardial infarction increases mortality. Today, emergency referral coordination across hospitals relies on fragmented WhatsApp groups and frantic phone calls. ASTRA solves this by uniting Hospital Operations, Attending Clinical Specialists, and Healthcare Governance into a single, real-time coordination engine."*
* **Visual Cue**: Point to the clean role-based login cards:
  - **Hospital Operations Command**
  - **Attending Emergency Specialist (Doctor)**
  - **State Platform Governance (Admin)**

---

### Phase 2: Hospital Operations Command Center (0:30 - 1:45)
* **Action**: Click the **Hospital Operations** persona (`ops@astra.demo`).
* **Speaker Script**:
  > *"We begin in the command center of Apollo General Hospital. Operations staff immediately have live telemetry across ICU, HDU, and Emergency beds — including AC/Non-AC breakdown and daily tariffs — alongside live blood bank inventories."*
* **Steps**:
  1. **Locate the Incoming Referral**:
     - Locate patient **`AST-1042`** (54M, Acute STEMI, 4mm ST Elevation, O+ blood required).
     - Point out the capability match tags: `CARDIAC_CATH_LAB`, `ICU`, `CARDIOLOGY`.
  2. **Capacity Pre-Check & Acceptance**:
     - Click **Accept Referral**.
     - Point out: *"ASTRA validates live CCU capacity before allowing intake."*
  3. **Allocate Bed**:
     - Click **Allocate Bed** -> Select **ICU Bed (AC)**.
     - Notice live inventory immediately decrements available beds and increments occupied beds with mathematical validation (`available + occupied + reserved <= total`).
  4. **Route to Clinical Specialist**:
     - Click **Route to Clinical Team** (Assign to **Dr. Ananya Mehta · Cardiology**).
     - State instantly updates to `REVIEWING`.

---

### Phase 3: Doctor / Clinical Decision Support (1:45 - 2:30)
* **Action**: Click **Logout** or switch to `doctor@astra.demo` on the Login page.
* **Speaker Script**:
  > *"Now we switch to Dr. Ananya Mehta, Interventional Cardiologist on duty. The case has arrived in her prioritized clinical queue without friction."*
* **Steps**:
  1. **Open Clinical Case**:
     - Select patient `AST-1042`.
     - Point out the structured clinical intake: blood pressure (90/60), heart rate (112), ECG telemetry, and blood group compatibility.
  2. **Add Clinical Note**:
     - In the Clinical Progress Notes box, type:
       ```text
       Cath Lab 1 activated. Heparin bolus administered. Primary PCI team on standby.
       ```
     - Click **Save Note** -> Note appears in chronological referral timeline.
  3. **Authorize Clinical Intake**:
     - Click **Accept Case / Authorize Intake**.
     - Status transitions to `ACCEPTED`. Point out: *"Clinical authority is bound to the doctor's identity (DOC-2048) and permanently stamped."*

---

### Phase 4: Platform Governance & Realtime Audit Trace (2:30 - 3:00)
* **Action**: Switch to **Admin / Governance** (`admin@astra.demo`).
* **Speaker Script**:
  > *"Finally, state health authorities and hospital administrators monitor compliance in real time through the ASTRA Governance Portal."*
* **Steps**:
  1. **Hospital Verification & Capability Matrix**:
     - Point out the capability registry (ICU, Cath Lab, Trauma, Blood Bank) with verification status badges (`VERIFIED`, `SELF_REPORTED`).
  2. **Audit Trail**:
     - Click on the **Audit Trail** tab.
     - Show the complete, immutable chronological trace of our 3-minute referral:
       1. `REFERRAL_ACCEPTED` — Ops Command (`ops@astra.demo`)
       2. `BED_ALLOCATED` — ICU Bed Allocated
       3. `REFERRAL_ROUTED_TO_CLINICAL` — Assigned to Dr. Ananya Mehta
       4. `CLINICAL_NOTE_ADDED` — Progress note logged
       5. `CLINICAL_ACCEPTED` — Attending Specialist authorization
  3. **Wrap-up Punchline**:
     > *"ASTRA replaces uncertainty with verified clinical action: beds allocated, specialists dispatched, and an immutable governance trail — in under three minutes."*

---

## 🛡️ Failsafe & Demo Safety Checklist

| Scenario | Behavior | Failsafe Protection |
| :--- | :--- | :--- |
| **No WiFi / Flaky Internet** | App continues running seamlessly | `MockDatabase` localStorage sync activates automatically |
| **Accidental Refresh** | Current role & state preserved | Session persistence in Zustand store |
| **Non-Admin Route Tampering** | URL `/admin/*` entered as doctor | Instant redirect to `/unauthorized` |
| **Invalid Bed Allocation** | Available beds depleted to 0 | Button disables with `"Required capacity unavailable"` |
| **Decline Without Reason** | Doctor or Ops declines case | Form validation requires documented clinical reason |

---

## 🔑 Demo Credentials Cheat-Sheet

| Persona | Role | Email | Password | Primary Demo Action |
| :--- | :--- | :--- | :--- | :--- |
| **Hospital Operations** | `HOSPITAL_OPS` | `ops@astra.demo` | *(One-click demo card)* | Bed allocation, capacity verification, routing |
| **Emergency Specialist** | `DOCTOR` | `doctor@astra.demo` | *(One-click demo card)* | Clinical review, progress notes, decision auth |
| **Platform Administrator** | `ADMIN` | `admin@astra.demo` | *(One-click demo card)* | Capability verification, realtime audit logs |
