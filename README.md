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

James may also be configured as the admin operator via `ADMIN_EMAIL` / `ADMIN_UID`. Login sends doctors to `/doctor/dashboard` by default; open `/admin/dashboard` (or `?next=/admin/...`) only when you intentionally need admin.

## Production env (high priority)

Copy `.env.example`. Notable keys:

| Area | Variables | Notes |
| --- | --- | --- |
| Password / Auth | `NEXT_PUBLIC_FIREBASE_*` | Local vault stores PBKDF2 `passwordHash` only. Firebase Auth syncs on login/register when configured. |
| Payments | `PAYMENT_SIGNING_SECRET` (or `ADMIN_SESSION_SECRET`), `FIREBASE_SERVICE_ACCOUNT_JSON`, Razorpay keys | Orders get a signed `persistenceToken` and optional Firestore `payment_orders`. Without signing **and** Admin SDK, orders are memory-only and lost on restart. |
| Video TURN | `TURN_URL` or `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` | `GET /api/ice` always returns public STUN. TURN is appended only when env is set; without it, many mobile/NAT networks fail. |
| Reminders | `CRON_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `RESEND_API_KEY` | Vercel hourly cron hits `/api/cron/reminders`. Needs Admin SDK to read `bookings`; email/FCM need Resend / FCM tokens. |
| Admin | `ADMIN_EMAIL`, `ADMIN_UID`, `ADMIN_SESSION_SECRET` | Server-gated `/admin/*`. |

## What’s included

- Two self-serve portals (patient and doctor) with no front desk
- Detailed self-registration that creates a unique profile automatically
- Patients browse doctors, specialties, and live open slots, then book
- Bookings appear on the doctor’s dashboard immediately (including across tabs)
- Patient onboarding (condition + goals)
- Exercise library grouped by condition, with video and steps
- Clinician-assigned programs from the patient chart
- Video visit room (camera/mic on this device; STUN + optional TURN via `/api/ice`)
- Progress dashboard (completion + pain trend)
- Reminders with optional browser notifications and hourly server cron
- Exercise ratings and session feedback
- AES-GCM encryption at rest in the browser, export/delete, audit log

This is a front-end demo. Production HIPAA/GDPR use needs a secured backend, TLS, identity provider, BAA-covered video, and clinical governance.
