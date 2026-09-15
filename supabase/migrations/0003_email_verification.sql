-- Track that a PC explicitly verified/confirmed the guest's email address
-- before the print/email/kit-delivery flow runs.
alter table letters_log add column if not exists email_verified_at timestamptz;
alter table letters_log add column if not exists email_verified_by_staff_id uuid references staff(id);
