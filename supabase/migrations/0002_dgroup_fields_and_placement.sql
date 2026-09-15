-- CCF GIS — DGroup form field alignment + Miner/Placement workflow
-- Adds fields to match the existing "CCF Welcome Center Dgroup Registration Form"
-- (Google Form) and the "Harvests (Mined)" placement-tracking pipeline.
--
-- Note: `guests.age` and `dgroup_registrations.claimed_by_staff_id` are included
-- with `if not exists` guards because application code already reads/writes them,
-- but they were missing from 0001_init.sql — likely added directly in Supabase.
-- This migration reconciles the migration history with the live schema.

-- ============================================================
-- GUESTS — fields the Google Form collects that intake doesn't yet
-- ============================================================
alter table guests add column if not exists age integer;
alter table guests add column if not exists gender text check (gender in ('male', 'female'));
alter table guests add column if not exists facebook text;

-- ============================================================
-- DGROUP_REGISTRATIONS — align to Google Form + add placement pipeline
-- ============================================================

-- Schema-drift reconciliation (already referenced in app/actions.ts)
alter table dgroup_registrations add column if not exists claimed_by_staff_id uuid references staff(id);

-- Marital status: `life_stage` already exists and is used for dgroup-leader
-- matching (see dgroup_leaders.life_stage_focus), so we extend its allowed
-- values in the app layer to match the form's full list (Single, Married,
-- Separated, Single Parent, Widow, Widower, Other) rather than adding a
-- duplicate column. `life_stage_other` holds the free-text when "Other" is chosen.
alter table dgroup_registrations add column if not exists life_stage_other text;

-- "Will you join the dgrp of the PC who welcomed you? If the person who
-- welcomed you invited you to join his/her dgroup, please input his/her name."
alter table dgroup_registrations add column if not exists invited_by_name text;

-- ------------------------------------------------------------
-- Miner / Placement workflow (mirrors "Harvests (Mined)" > Mined Seekers Status)
-- ------------------------------------------------------------
alter table dgroup_registrations add column if not exists miner_id uuid references staff(id);
alter table dgroup_registrations add column if not exists miner_assigned_at timestamptz;
alter table dgroup_registrations add column if not exists miner_contacted_at timestamptz;
alter table dgroup_registrations add column if not exists attendance_confirmed_at timestamptz;
alter table dgroup_registrations add column if not exists placed_at timestamptz;
alter table dgroup_registrations add column if not exists unsuccessful_at timestamptz;
alter table dgroup_registrations add column if not exists placement_notes text;

alter table dgroup_registrations add column if not exists placement_status text
  not null default 'unassigned';

-- Drop/recreate the check constraint so this migration is re-runnable while iterating.
alter table dgroup_registrations drop constraint if exists dgroup_registrations_placement_status_check;
alter table dgroup_registrations add constraint dgroup_registrations_placement_status_check
  check (placement_status in (
    'unassigned',                       -- not yet assigned to a Miner
    'pending_ilt_followup',             -- 1. IMT has not done initial follow-up to the Miner
    'awaiting_contact_confirmation',    -- 2. Miner to confirm if guest has been contacted
    'contacted_awaiting_response',      -- 3a. Miner has contacted guest, awaiting response
    'endorsed_other_dgroup',            -- 3b. Miner endorsed guest to downline/other dgroup
    'awaiting_attendance_confirmation', -- 4. Miner to confirm guest attendance
    'repost_in_gc',                     -- 5. IMT to repost seeker details in GC
    'placed_miner',                     -- 6a. Placed (Miner)
    'placed_miner_dl',                  -- 6b. Placed (Miner's DL)
    'placed_other_dl',                  -- 6c. Placed in another DL from WC
    'has_dgroup_not_via_wc',            -- 7. Seeker already has a dgroup (not via WC)
    'unsuccessful'                      -- 8. Dgroup placement unsuccessful
  ));

create index if not exists idx_dgroup_reg_miner on dgroup_registrations(miner_id);
create index if not exists idx_dgroup_reg_placement_status on dgroup_registrations(placement_status);
