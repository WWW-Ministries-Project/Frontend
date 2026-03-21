export type EventRegistrationAudience =
  | "MEMBERS_ONLY"
  | "MEMBERS_AND_NON_MEMBERS";

export type EventRegistrationRecord = {
  id: number;
  event_id: number;
  user_id: number | null;
  created_at: string;
  is_member: boolean;
  member_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  country_code?: string | null;
};

export type EventResponseType = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  recurrence_end_date?: string | null;
  location: string;
  description: string;
  event_status: string | null;
  poster: string;
  qr_code: string | null;
  event_type: "ACTIVITY" | "PROGRAM" | "SERVICE" | "other";
  start_time: string; // Format: "HH:mm"
  end_time: string; // Format: "HH:mm"
  requires_registration?: boolean;
  registration_end_date?: string | null;
  registration_capacity?: number | null;
  registration_audience?: EventRegistrationAudience;
  public_registration_url?: string | null;
  registration_count?: number;
  event_registers?: EventRegistrationRecord[];
  registration_open?: boolean;
  registration_message?: string | null;
};

export type EventType = {
  id: string;
  event_name: string;
  event_type: string;
  event_description: string;
};

export type PublicEventRegistrationPayload = {
  event_id?: string | number;
  token?: string;
  is_member: boolean;
  member_id?: string;
  phone_number?: string;
  name?: string;
  email?: string;
  location?: string;
};

export type ValidateEventMemberPayload = {
  event_id?: string | number;
  token?: string;
  member_id?: string;
  phone_number?: string;
};

export type ValidatedEventMember = {
  user_id: number;
  member_id: string | null;
  name: string;
  email: string | null;
  phone_number: string | null;
  location: string | null;
  country_code: string | null;
  membership_type: string | null;
};

export type BiometricAttendanceImportPayload = {
  eventId?: string | number;
  eventIds?: Array<string | number>;
  date?: string;
  deviceIds?: Array<string | number>;
  leadTimeMinutes?: number;
  dryRun?: boolean;
};

export type BiometricAttendanceImportTotals = {
  punches_fetched: number;
  punches_within_window: number;
  unique_punches: number;
  duplicate_punches_skipped: number;
  punches_staged_new: number;
  punches_reconciled_to_users: number;
  punches_matched_to_users: number;
  punches_unmatched: number;
  attendance_candidates: number;
  attendance_rows_created: number;
  attendance_rows_existing: number;
};

export type BiometricAttendanceUnmatchedUser = {
  device_user_id: string;
  device_user_name: string | null;
  punch_count: number;
  device_ips: string[];
};

export type BiometricAttendanceImportResponse = {
  dry_run: boolean;
  event: {
    id: number;
    event_name: string | null;
    event_type: string | null;
  };
  occurrence_date: string;
  attendance_window: {
    start: string;
    end: string;
    lead_time_minutes: number;
  };
  devices_requested: Array<{
    id: number | null;
    ip: string;
    port: number | null;
  }>;
  totals: BiometricAttendanceImportTotals;
  unmatched_device_users: BiometricAttendanceUnmatchedUser[];
};

export type BiometricAttendanceImportJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type BiometricAttendanceImportProgress = {
  total_devices: number;
  processed_devices: number;
  raw_punches_fetched: number;
  punches_within_window: number;
  unique_punches: number;
  duplicate_punches_skipped: number;
  punches_staged_new: number;
  punches_reconciled_to_users: number;
  punches_matched_to_users: number;
  punches_unmatched: number;
  attendance_candidates: number;
  attendance_rows_created: number;
  attendance_rows_existing: number;
};

export type BiometricAttendanceImportJob = {
  id: number;
  event_id: number;
  event_name: string | null;
  occurrence_date: string;
  dry_run: boolean;
  status: BiometricAttendanceImportJobStatus;
  progress_percentage: number;
  current_step: string | null;
  progress: BiometricAttendanceImportProgress;
  result: BiometricAttendanceImportResponse | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
};

export type BiometricAttendanceImportStartResponse =
  | BiometricAttendanceImportJob
  | BiometricAttendanceImportJob[];

export type BiometricDepartmentPosition = {
  department_id: number;
  department_name: string | null;
  position_id: number | null;
  position_name: string | null;
};

export type BiometricEventAttendanceRecord = {
  event_id: number;
  event_name: string | null;
  event_type: string | null;
  user_id: number;
  user_name: string | null;
  member_id: string | null;
  department_positions: BiometricDepartmentPosition[];
  attendance_date: string;
  first_punch_at: string;
  last_punch_at: string;
  punch_count: number;
  device_ips: string[];
  attendance_recorded: boolean;
  attendance_record_id: number | null;
};

export type BiometricEventAttendanceListResponse = {
  records: BiometricEventAttendanceRecord[];
  summary: {
    total_records: number;
    total_events: number;
    total_members: number;
    total_punches: number;
    attendance_recorded: number;
  };
};
