# Patient Medication & Pharmacy Sync System — Starter

A prototype scaffold for Lovable + Supabase. It uses fictional/sample data and a mock pharmacy adapter. It is **not approved for clinical use** and must not be used with real patient data until security, privacy, clinical, and operational reviews are completed.

## Architecture
- React + TypeScript + Vite frontend
- Supabase Auth + PostgreSQL + Row Level Security (RLS)
- Supabase Edge Function for trusted server-side operations
- Mock pharmacy adapter now; replace it with a documented, authorized provider adapter later
- No real SMS or push notifications are sent by this scaffold

## Automated tests and security review
Run the demo UI tests with:
```bash
npm test
```

The current automated tests cover local UI behavior only; they do not verify Supabase authorization or production security. See [the data-flow and security review](docs/data-flow-security-review.md) for current data flows, limitations, and pre-pilot requirements.

## Quick start
1. Create a Supabase project.
2. In Lovable, create/import a React + TypeScript project, or run this project locally.
3. Copy `.env.example` to `.env.local` and set your Supabase project URL and publishable/anon key.
4. In Supabase SQL Editor, run `supabase/migrations/001_initial_schema.sql`.
5. Enable phone authentication in Supabase only after configuring an SMS provider. For early UI work, use fictional demo data and do not collect real patient details.
6. Install and run:
   ```bash
   npm install
   npm run dev
   ```
7. Deploy the Edge Function with the Supabase CLI after linking your project:
   ```bash
   supabase functions deploy pharmacy-sync
   ```
   Set required secrets only after you have a real, authorized API contract. The included function is a mock/demo flow.

## Important design rules
- The browser must never call the pharmacy API directly or receive its credentials.
- Do not use a phone number as the only proof that a pharmacy record belongs to a person.
- Do not use real patient information in demos, screenshots, seed data, or issue trackers.
- The mock sync endpoint is for development only. Add stronger role checks, rate limits, audit review, idempotency, and a provider contract before production.
- RLS policies are essential but are not a complete security program.
- Dose times shown in the UI are demo suggestions, not prescribing instructions.
- “Marked as taken” means patient-reported, not independently verified ingestion.
- Dose changes and activity history are held in browser memory for the current session only; they are not saved to Supabase and disappear on reload.

## Suggested next stages
1. UI and usability testing with sample data.
2. Auth and RLS testing with separate test accounts.
3. Dose event model, idempotent writes, and timezone handling.
4. Background job queue and notification provider sandbox.
5. Pharmacy sandbox adapter and reconciliation process.
6. Clinical, privacy, security, and regulatory review before any live pilot.
