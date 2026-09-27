export interface EventReportExcludedUser {
  id: number;
  name: string;
  email: string | null;
  member_id: string | null;
  excluded_at: string;
}

export interface EventReportExclusionsConfig {
  users: EventReportExcludedUser[];
  total: number;
}

export interface EventReportExclusionsPayload {
  user_ids: number[];
}
