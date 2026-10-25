# Data-flow and security review

**Scope:** Repository review of the starter as implemented, not a penetration test or a clinical, privacy, legal, or regulatory approval. The app must remain demo-only and use fictional data.

## Current data flow

```text
Browser
  ├─ React UI and fictional sample medication records in src/App.tsx
  │    └─ Dose changes, summary values, sync message, and activity stay in component memory
  ├─ Google Fonts stylesheet request from src/styles.css
  └─ Optional Supabase client construction from VITE_* build-time variables
       └─ No current UI code calls the client or reads/writes Supabase data

Optional, separate Edge Function endpoint (not called by the current UI)
  └─ pharmacy-sync
       ├─ accepts POST with a bearer token; resolves caller through Supabase Auth
       ├─ uses the caller token and anon key so database RLS applies
       └─ attempts to insert a mock sync_jobs row; contacts no pharmacy

Supabase database
  └─ schema and RLS policies are defined in 001_initial_schema.sql
```

The demo dose state and activity log are volatile browser memory. They are not
persisted in local storage, sent to Supabase, or retained after unmount/reload.
The sync button only waits briefly and displays a demo completion message; it
does not call the Edge Function. `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are public client configuration, not secrets. Their
presence currently affects only client initialization and the footer indicator.

## Security boundaries and observations

| Area | Current control / behavior | Limitation or follow-up |
| --- | --- | --- |
| Demo records | Hard-coded fictional examples; component-local state | Never load real records into this UI. Add persistence only after a reviewed data model, authorization design, and privacy review. |
| Browser credentials | Only Vite `VITE_*` URL and anon key are read by the browser client | Treat all `VITE_*` values as public. Never place service-role, pharmacy, or other privileged credentials in frontend environment variables. |
| Database access | Tables have RLS enabled. Patient read policies compare ownership to `auth.uid()`. There are no client insert/update policies for prescriptions, schedules, sync jobs, or audit events. | RLS requires separate-account and anonymous-user tests. Policies are not a substitute for server validation or operational controls. |
| Profile writes | Authenticated users can update their own profile row | The policy is row-scoped, not column-scoped. Review/harden which identity and preference fields patients may change before using real data. |
| Dose event writes | No patient-facing insert/update policy is present | This intentionally prevents direct client writes, but a trusted, narrowly scoped dose-response workflow has not been implemented. |
| Mock sync endpoint | Requires POST and a valid Supabase user token; derives patient ID from the authenticated user rather than request data; uses the caller token for RLS | Current database policy allows users to read their own `sync_jobs`, but has no insert policy. Therefore, the function's insert is expected to be rejected by RLS and return `sync_job_creation_failed`. It is not used by the current UI. Resolve this with an explicit, reviewed least-privilege design before invoking it; do not casually add a broad service-role bypass. |
| CORS | Function returns a single configured `APP_ORIGIN`, defaulting to localhost | Configure the production origin explicitly and review origin handling as part of deployment. CORS is not authentication or authorization. |
| Third-party requests | Stylesheet imports fonts from Google Fonts | Browser requests disclose ordinary connection metadata to that third party. Decide whether this is acceptable for the intended demo; self-host fonts if reducing third-party requests is required. |
| Clinical meaning | UI labels “reported taken” and calls its percentage a demo share; safety disclaimer is visible | A patient response is not verified ingestion. The app does not provide prescribing advice, missed-dose recommendations, or clinical decision support. |
| Logs and audit | Mock function returns generic errors and inserts no clinical payload | Production logging, access auditing, retention, incident response, rate limiting, idempotency, and monitoring are not implemented. |

## Safe demo rules

- Use only the built-in fictional records. Do not enter patient data in the app,
  screenshots, browser storage, logs, tickets, or test fixtures.
- Do not interpret demo times, instructions, statuses, or percentages as care
  guidance or verified clinical facts.
- The current frontend sync control is a local simulation; no pharmacy is
  connected and no records are synchronized.
- Keep Supabase and the Edge Function disconnected from real patient data until
  authorization, data protection, threat modeling, clinical review, and
  operational readiness have been completed.

## Before a real-data pilot

1. Define approved purposes, lawful basis/consent and notice, retention/deletion,
   data minimization, breach response, and jurisdiction-specific obligations.
2. Threat-model the browser, Auth, database, Edge Functions, provider, logs,
   support tools, backups, and privileged staff access.
3. Test RLS with anonymous sessions and at least two separate patient accounts;
   verify reads, writes, ownership relationships, and profile field restrictions.
4. Design validated server-side workflows for dose responses and sync jobs,
   including ownership checks, idempotency, corrections, audit events, and safe
   error handling. Keep privileged keys server-side and narrowly scoped.
5. For pharmacy exchange, obtain an authorized provider contract and sandbox;
   define identity matching, payload validation, record reconciliation, retries,
   rate limits, and safe logging before implementation.
6. Add clinical safety review, accessibility/usability evaluation, security
   testing, monitoring, backups/restore drills, and incident procedures.
7. Only proceed under explicit organizational approval after all required
   privacy, security, clinical, legal, and regulatory reviews.

## Automated demo coverage

Run `npm test` for UI checks covering the sample summary, cross-view dose-state
updates, snooze behavior, corrections, empty/session-only history, reset on
remount, and mock sync feedback. These tests do not establish RLS correctness,
Edge Function deployability, or production safety.
