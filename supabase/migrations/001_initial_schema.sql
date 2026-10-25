-- Prototype schema. Review and test with separate accounts before any live use.
-- Run in Supabase SQL Editor or manage as a versioned migration.

create extension if not exists pgcrypto;

create type public.prescription_status as enum
  ('active', 'completed', 'cancelled', 'discontinued', 'on_hold');

create type public.dose_status as enum
  ('pending', 'taken', 'snoozed', 'missed', 'not_recorded');

create table public.patient_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone_e164 text,
  preferred_language text not null default 'en',
  timezone text not null default 'Africa/Nairobi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  source_system text not null default 'demo',
  source_record_id text,
  medication_name text not null,
  strength text,
  dosage_instructions text not null,
  frequency_code text,
  start_date date,
  end_date date,
  status public.prescription_status not null default 'active',
  prescribed_by text,
  food_instructions text,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, source_system, source_record_id)
);

create table public.dose_schedules (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  scheduled_for timestamptz not null,
  status public.dose_status not null default 'pending',
  reminder_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (prescription_id, scheduled_for)
);

create table public.dose_events (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.dose_schedules(id) on delete cascade,
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  event_type text not null check (event_type in ('taken_reported', 'snoozed', 'missed', 'corrected', 'not_recorded')),
  event_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create table public.follow_up_appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  source_system text not null default 'manual_demo',
  source_record_id text,
  clinician_name text,
  department text,
  appointment_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_at timestamptz not null default now(),
  unique (patient_id, source_system, source_record_id)
);

create table public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patient_profiles(id) on delete set null,
  provider text not null default 'mock',
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  request_id text,
  records_received integer not null default 0,
  error_code text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  created_at timestamptz not null default now()
);

create index prescriptions_patient_status_idx on public.prescriptions(patient_id, status);
create index schedules_time_status_idx on public.dose_schedules(scheduled_for, status);
create index dose_events_patient_time_idx on public.dose_events(patient_id, event_at desc);
create index appointments_patient_date_idx on public.follow_up_appointments(patient_id, appointment_at);
create index sync_jobs_status_created_idx on public.sync_jobs(status, created_at);

alter table public.patient_profiles enable row level security;
alter table public.prescriptions enable row level security;
alter table public.dose_schedules enable row level security;
alter table public.dose_events enable row level security;
alter table public.follow_up_appointments enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.audit_events enable row level security;

-- Patients may only view/update their own profile. Sensitive identity changes
-- should be handled by a trusted server workflow in a production system.
create policy "patient reads own profile"
on public.patient_profiles for select to authenticated
using (id = (select auth.uid()));

create policy "patient updates own profile"
on public.patient_profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "patient reads own prescriptions"
on public.prescriptions for select to authenticated
using (patient_id = (select auth.uid()));

create policy "patient reads own schedules"
on public.dose_schedules for select to authenticated
using (exists (
  select 1 from public.prescriptions p
  where p.id = prescription_id and p.patient_id = (select auth.uid())
));

create policy "patient reads own dose events"
on public.dose_events for select to authenticated
using (patient_id = (select auth.uid()));

create policy "patient reads own appointments"
on public.follow_up_appointments for select to authenticated
using (patient_id = (select auth.uid()));

create policy "patient reads own sync jobs"
on public.sync_jobs for select to authenticated
using (patient_id = (select auth.uid()));

-- Intentionally no client insert/update policies for prescriptions, schedules,
-- sync_jobs, or audit_events. Trusted Edge Functions should perform validated
-- writes. Add narrowly scoped RPCs/Edge Functions for patient dose responses.
-- Do not expose audit_events to clients by default.
