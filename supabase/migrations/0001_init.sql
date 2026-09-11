-- CCF Guest Information System (GIS) — Initial Schema
-- Mirrors the 5-phase guest journey: Intake -> Engagement -> Selection -> Materials -> DGroup

create extension if not exists "pgcrypto";

-- ============================================================
-- STAFF (PCs, Runners, Backroom, DGroup Leaders, Admins)
-- ============================================================
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text unique,
  role text not null check (role in ('pc', 'runner', 'backroom', 'dgroup_leader', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- GUESTS + SESSIONS  (Phase 1: Welcome & Intake)
-- ============================================================
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  unique_number text unique not null, -- placeholder scheme: 'G-000001', see README
  table_number text,
  full_name text,
  phone text,
  email text,
  first_time boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists checkin_sessions (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  pc_id uuid references staff(id),
  qr_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  phase text not null default 'intake'
    check (phase in ('intake', 'engagement', 'selection', 'materials', 'dgroup', 'complete')),
  intake_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_qr_token on checkin_sessions(qr_token);
create index if not exists idx_sessions_pc on checkin_sessions(pc_id);

-- ============================================================
-- PHASE 2: Engagement & Prayer
-- ============================================================
create table if not exists prayer_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references checkin_sessions(id) on delete cascade,
  request_text text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PHASE 3: Guest Self-Selection
-- ============================================================
create table if not exists discipleship_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references checkin_sessions(id) on delete cascade unique,
  dgroup_status text check (dgroup_status in ('join', 'undecided', 'has_dgroup')),
  activity_tier text check (activity_tier in ('pray', 'care', 'share')),
  bible_language text check (bible_language in ('english', 'pinoy', 'tagalog')),
  verified_by_pc boolean not null default false,
  locked_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PHASE 4: Materials Delivery
-- ============================================================
create table if not exists letters_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references checkin_sessions(id) on delete cascade unique,
  print_status text not null default 'pending' check (print_status in ('pending', 'printed', 'failed')),
  print_requested_at timestamptz,
  printed_at timestamptz,
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'bounced', 'skipped')),
  email_sent_at timestamptz,
  bounced boolean not null default false,
  pc_notified_of_bounce boolean not null default false,
  kit_assembled_at timestamptz,
  kit_delivered_at timestamptz,
  runner_id uuid references staff(id)
);

-- ============================================================
-- PHASE 5: DGroup Registration
-- ============================================================
create table if not exists dgroup_leaders (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id),
  group_name text not null,
  life_stage_focus text,
  active boolean not null default true
);

create table if not exists dgroup_registrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references checkin_sessions(id) on delete cascade unique,
  life_stage text,
  schedule_pref text,
  mode text check (mode in ('in_person', 'online', 'hybrid')),
  occupation text,
  language text,
  joining_pc_group boolean,
  routed_leader_id uuid references dgroup_leaders(id),
  summary_printed_at timestamptz,
  routed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- updated_at trigger for checkin_sessions
-- ============================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sessions_updated_at on checkin_sessions;
create trigger trg_sessions_updated_at
  before update on checkin_sessions
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table staff enable row level security;
alter table guests enable row level security;
alter table checkin_sessions enable row level security;
alter table prayer_requests enable row level security;
alter table discipleship_responses enable row level security;
alter table letters_log enable row level security;
alter table dgroup_leaders enable row level security;
alter table dgroup_registrations enable row level security;

-- Authenticated staff (PCs, runners, admins) can read/write everything.
-- Guests interact only through the qr_token-scoped session (via server-side service role),
-- never with a direct Supabase session — see README "Guest access model".
create policy "staff full access - staff" on staff for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access - guests" on guests for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access - sessions" on checkin_sessions for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access - prayer" on prayer_requests for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access - discipleship" on discipleship_responses for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access - letters" on letters_log for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access - leaders" on dgroup_leaders for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access - dgroup" on dgroup_registrations for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
