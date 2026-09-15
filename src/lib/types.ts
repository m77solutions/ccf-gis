export type Phase =
  | "intake"
  | "engagement"
  | "selection"
  | "materials"
  | "dgroup"
  | "complete";

export type StaffRole = "pc" | "runner" | "backroom" | "dgroup_leader" | "admin";

export type DgroupStatus = "join" | "undecided" | "has_dgroup";
export type ActivityTier = "pray" | "care" | "share";
export type BibleLanguage = "english" | "pinoy" | "tagalog";
export type DgroupMode = "in_person" | "online" | "hybrid";
export type Gender = "male" | "female";

export type MaritalStatus =
  | "Single"
  | "Married"
  | "Separated"
  | "Single Parent"
  | "Widow"
  | "Widower"
  | "Other";

export const MARITAL_STATUS_OPTIONS: MaritalStatus[] = [
  "Single",
  "Married",
  "Separated",
  "Single Parent",
  "Widow",
  "Widower",
  "Other",
];

export type PlacementStatus =
  | "unassigned"
  | "pending_ilt_followup"
  | "awaiting_contact_confirmation"
  | "contacted_awaiting_response"
  | "endorsed_other_dgroup"
  | "awaiting_attendance_confirmation"
  | "repost_in_gc"
  | "placed_miner"
  | "placed_miner_dl"
  | "placed_other_dl"
  | "has_dgroup_not_via_wc"
  | "unsuccessful";

export const PLACEMENT_STATUSES: { key: PlacementStatus; label: string }[] = [
  { key: "unassigned", label: "Not yet assigned to a Miner" },
  { key: "pending_ilt_followup", label: "IMT has not done initial follow-up to the Miner" },
  { key: "awaiting_contact_confirmation", label: "Miner to confirm if guest has been contacted" },
  { key: "contacted_awaiting_response", label: "Miner has contacted guest — awaiting response" },
  { key: "endorsed_other_dgroup", label: "Miner endorsed guest to downline/other dgroup" },
  { key: "awaiting_attendance_confirmation", label: "Miner to confirm guest attendance" },
  { key: "repost_in_gc", label: "IMT to repost seeker details in GC" },
  { key: "placed_miner", label: "Placed (Miner)" },
  { key: "placed_miner_dl", label: "Placed (Miner's DL)" },
  { key: "placed_other_dl", label: "Placed in another DL from WC" },
  { key: "has_dgroup_not_via_wc", label: "Seeker already has a dgroup (not via WC)" },
  { key: "unsuccessful", label: "Dgroup placement unsuccessful" },
];

export const PLACED_STATUSES: PlacementStatus[] = ["placed_miner", "placed_miner_dl", "placed_other_dl"];

export interface Guest {
  id: string;
  unique_number: string;
  table_number: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  age: number | null;
  gender: Gender | null;
  facebook: string | null;
  first_time: boolean;
  created_at: string;
}

export interface CheckinSession {
  id: string;
  guest_id: string;
  pc_id: string | null;
  qr_token: string;
  phase: Phase;
  intake_submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrayerRequest {
  id: string;
  session_id: string;
  request_text: string;
  created_at: string;
}

export interface DiscipleshipResponse {
  id: string;
  session_id: string;
  dgroup_status: DgroupStatus | null;
  activity_tier: ActivityTier | null;
  bible_language: BibleLanguage | null;
  verified_by_pc: boolean;
  locked_at: string | null;
}

export interface LettersLog {
  id: string;
  session_id: string;
  print_status: "pending" | "printed" | "failed";
  email_status: "pending" | "sent" | "bounced" | "skipped";
  bounced: boolean;
  pc_notified_of_bounce: boolean;
  kit_assembled_at: string | null;
  kit_delivered_at: string | null;
}

export interface DgroupRegistration {
  id: string;
  session_id: string;
  life_stage: string | null;
  life_stage_other: string | null;
  schedule_pref: string | null;
  mode: DgroupMode | null;
  occupation: string | null;
  language: string | null;
  invited_by_name: string | null;
  joining_pc_group: boolean | null;
  routed_leader_id: string | null;
  claimed_by_staff_id: string | null;
  routed_at: string | null;
  created_at: string;
  // Miner / placement workflow
  miner_id: string | null;
  miner_assigned_at: string | null;
  miner_contacted_at: string | null;
  attendance_confirmed_at: string | null;
  placed_at: string | null;
  unsuccessful_at: string | null;
  placement_notes: string | null;
  placement_status: PlacementStatus;
}

export const PHASES: { key: Phase; label: string; accent: string }[] = [
  { key: "intake", label: "Welcome & Intake", accent: "amber" },
  { key: "engagement", label: "Engagement & Prayer", accent: "rose" },
  { key: "selection", label: "PC Absorbed", accent: "teal" },
  { key: "materials", label: "Kit Delivery", accent: "amber" },
  { key: "dgroup", label: "DGroup Registration", accent: "teal" },
  { key: "complete", label: "Journey Complete", accent: "ink" },
];
