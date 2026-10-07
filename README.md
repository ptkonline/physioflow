# PhysioFlow

A Physitrack-style physiotherapy web app: programs, exercise videos, telehealth, progress, reminders, and privacy controls.

## Run

```bash
cd physioflow
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## UAT Aja testing (physioflow-uat)

Sign-in and sign-up use **Firebase Auth email + password only**. There is no OTP step and no phone code. Copy `.env.uat.example` for the Preview / UAT environment and keep `LOCAL_TEST_ACCOUNTS=false`, `AUTH_OTP_ENABLED=false`, and `PHONE_OTP_ENABLED=false`.

| Who | URL |
| --- | --- |
| Patient or doctor | `/login` and `/register` |
| Clinic admin | `/admin/login` then `/admin/dashboard` |

Admin is a separate page. It checks `ADMIN_EMAIL` and `ADMIN_UID` (the Firebase Auth UID) and does not use the patient/doctor form. Doctors add named treatments and prices under `/doctor/services`. Those prices are stored on `doctors_public.services` and shown when a patient books.

## Production env (high priority)

Copy `.env.example`. Notable keys:

| Area | Variables | Notes |
| --- | --- | --- |
| Password / Auth | `NEXT_PUBLIC_FIREBASE_*` | UAT login and signup use Firebase email + password. OTP stays off (`AUTH_OTP_ENABLED=false`). |
| Password reset | `FIREBASE_SERVICE_ACCOUNT_JSON`, `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL` | `/forgot-password` asks `POST /api/auth/password-reset` to email a Firebase reset link through Resend. Without those, the page falls back to Firebase’s built-in mail. Add the site host under Firebase Auth authorized domains. Optional `NEXT_PUBLIC_APP_URL` sets the continue URL. |
| Payments | `PAYMENT_SIGNING_SECRET` (or `ADMIN_SESSION_SECRET`), `FIREBASE_SERVICE_ACCOUNT_JSON`, Razorpay keys | Orders get a signed `persistenceToken` and optional Firestore `payment_orders`. Without signing **and** Admin SDK, orders are memory-only and lost on restart. |
| Video TURN | `TURN_URL` or `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` | `GET /api/ice` always returns public STUN. TURN is appended only when env is set; without it, many mobile/NAT networks fail. |
| Reminders | `CRON_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `RESEND_API_KEY` | Vercel hourly cron hits `/api/cron/reminders`. Needs Admin SDK to read `bookings`; email/FCM need Resend / FCM tokens. |
| Admin | `ADMIN_EMAIL`, `ADMIN_UID`, `ADMIN_SESSION_SECRET` | Separate `/admin/login`. `ADMIN_UID` is the Firebase Auth UID. |

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
