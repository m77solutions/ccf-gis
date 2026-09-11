export type Phase =
  | "intake"
  | "engagement"
  | "selection"
  | "materials"
  | "dgroup"
  | "complete";

export type DgroupStatus = "join" | "undecided" | "has_dgroup";
export type ActivityTier = "pray" | "care" | "share";
export type BibleLanguage = "english" | "pinoy" | "tagalog";
export type DgroupMode = "in_person" | "online" | "hybrid";

export interface Guest {
  id: string;
  unique_number: string;
  table_number: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
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
  schedule_pref: string | null;
  mode: DgroupMode | null;
  occupation: string | null;
  language: string | null;
  joining_pc_group: boolean | null;
  routed_leader_id: string | null;
  routed_at: string | null;
}

export const PHASES: { key: Phase; label: string; accent: string }[] = [
  { key: "intake", label: "Welcome & Intake", accent: "amber" },
  { key: "engagement", label: "Engagement & Prayer", accent: "rose" },
  { key: "selection", label: "Self-Selection", accent: "teal" },
  { key: "materials", label: "Materials Delivery", accent: "amber" },
  { key: "dgroup", label: "DGroup Registration", accent: "teal" },
  { key: "complete", label: "Journey Complete", accent: "ink" },
];
