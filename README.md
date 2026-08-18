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
| Front desk | priya@demo.physio | demo123 | — |
| Doctor | james@demo.physio | demo123 | DOC-1001 |
| Doctor | aisha@demo.physio | demo123 | DOC-1002 |
| Patient | maya@demo.physio | demo123 | — |

## What’s included

- Front desk **New booking** (patient details, doctor, date/time, reason)
- Automatic assignment: bookings appear on that doctor’s dashboard and clinic ID
- Doctor directory: add doctors with login, specialty, and clinic ID
- Cross-tab sync so a booking made at reception shows on the doctor’s open session
- Patient onboarding (condition + goals)
- Exercise library grouped by condition, with video and steps
- Clinician-assigned programs from the patient chart
- Video visit room (camera/mic on this device)
- Progress dashboard (completion + pain trend)
- Reminders with optional browser notifications
- Exercise ratings and session feedback
- AES-GCM encryption at rest in the browser, export/delete, audit log

This is a front-end demo. Production HIPAA/GDPR use needs a secured backend, TLS, identity provider, BAA-covered video, and clinical governance.
