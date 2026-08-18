# PhysioFlow

A Physitrack-style physiotherapy web app: programs, exercise videos, telehealth, progress, reminders, and privacy controls.

## Run

```bash
cd physioflow
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

| Role | Email | Password | Clinic ID |
| --- | --- | --- | --- |
| Patient | maya@demo.physio | demo123 | — |
| Doctor | james@demo.physio | demo123 | DOC-1001 |
| Doctor | aisha@demo.physio | demo123 | DOC-1002 |

## What’s included

- Two self-serve portals (patient and doctor) with no front desk
- Detailed self-registration that creates a unique profile automatically
- Patients browse doctors, specialties, and live open slots, then book
- Bookings appear on the doctor’s dashboard immediately (including across tabs)
- Patient onboarding (condition + goals)
- Exercise library grouped by condition, with video and steps
- Clinician-assigned programs from the patient chart
- Video visit room (camera/mic on this device)
- Progress dashboard (completion + pain trend)
- Reminders with optional browser notifications
- Exercise ratings and session feedback
- AES-GCM encryption at rest in the browser, export/delete, audit log

This is a front-end demo. Production HIPAA/GDPR use needs a secured backend, TLS, identity provider, BAA-covered video, and clinical governance.
