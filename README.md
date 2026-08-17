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

| Role | Email | Password |
| --- | --- | --- |
| Patient | maya@demo.physio | demo123 |
| Physiotherapist | james@demo.physio | demo123 |

## What’s included

- Registration and login for patients and clinicians, with HIPAA/GDPR consent
- Patient onboarding (condition + goals)
- Exercise library grouped by condition, with video and steps
- Clinician-assigned programs from the patient chart
- Video visit room (camera/mic on this device)
- Progress dashboard (completion + pain trend)
- Reminders with optional browser notifications
- Exercise ratings and session feedback
- AES-GCM encryption at rest in the browser, export/delete, audit log

This is a front-end demo. Production HIPAA/GDPR use needs a secured backend, TLS, identity provider, BAA-covered video, and clinical governance.
