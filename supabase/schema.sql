-- SlotBack database schema (run once in the Supabase SQL Editor)
-- Tables are only ever accessed by the Python backend using the service-role key,
-- so Row Level Security is enabled with NO policies: the public anon key can read nothing.

create extension if not exists pgcrypto;

-- ── Practitioners ────────────────────────────────────────────────
create table if not exists public.practitioners (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- ── Waitlisted patients ──────────────────────────────────────────
create table if not exists public.waitlist_patients (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  phone     text not null,
  service   text not null check (service in ('Physio','Podiatry','Chiro','Speech Pathology')),
  status    text not null default 'Pending' check (status in ('Pending','Offer Sent','Confirmed')),
  added_at  timestamptz not null default now(),   -- "days waiting" is derived from this
  added_by  uuid                                  -- auth.users id of the coordinator who added them
);

-- ── Cancelled appointments ───────────────────────────────────────
create table if not exists public.cancellations (
  id               uuid primary key default gen_random_uuid(),
  practitioner_id  uuid not null references public.practitioners(id),
  appointment_date date not null,
  time_slot        text not null,
  patient_name     text not null,
  reason           text not null,
  status           text not null default 'Open' check (status in ('Open','Offers Sent','Filled')),
  created_by       uuid,
  created_at       timestamptz not null default now(),
  filled_by        uuid references public.waitlist_patients(id),
  filled_at        timestamptz
);

-- ── Offers sent for a cancelled slot ─────────────────────────────
create table if not exists public.offers (
  id              uuid primary key default gen_random_uuid(),
  cancellation_id uuid not null references public.cancellations(id) on delete cascade,
  patient_id      uuid not null references public.waitlist_patients(id),
  rank            int  not null,
  status          text not null default 'Sent' check (status in ('Sent','Accepted','Cancelled')),
  sent_at         timestamptz not null default now(),
  responded_at    timestamptz
);

create index if not exists offers_cancellation_idx on public.offers (cancellation_id);
create index if not exists waitlist_status_idx     on public.waitlist_patients (status, added_at);
create index if not exists cancellations_practitioner_idx on public.cancellations (practitioner_id);
create index if not exists offers_patient_idx on public.offers (patient_id);
create index if not exists cancellations_filled_by_idx on public.cancellations (filled_by);

-- ── Row Level Security: locked down, backend uses the service-role key ──
alter table public.practitioners      enable row level security;
alter table public.waitlist_patients  enable row level security;
alter table public.cancellations      enable row level security;
alter table public.offers             enable row level security;

-- ── Privileges: only the backend's service_role may touch these tables ──
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
revoke all on all tables in schema public from anon, authenticated;

-- ── Seed data (same as the MVP) ──────────────────────────────────
insert into public.practitioners (name) values
  ('Dr. Sarah Mills'), ('David Chen'), ('Dr. Patel')
on conflict (name) do nothing;

insert into public.waitlist_patients (name, phone, service, added_at)
select * from (values
  ('Hannah Smith', '0412 555 101', 'Physio', now() - interval '23 days'),
  ('James Okafor', '0413 555 202', 'Physio', now() - interval '18 days'),
  ('Mei Lin',      '0414 555 303', 'Physio', now() - interval '12 days'),
  ('Raj Patel',    '0415 555 404', 'Physio', now() - interval '7 days'),
  ('Sofia Novak',  '0416 555 505', 'Physio', now() - interval '3 days')
) as v(name, phone, service, added_at)
where not exists (select 1 from public.waitlist_patients);
