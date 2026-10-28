export interface VisitorFollowUpConfig {
  follow_ups_per_month: number;
  enabled: boolean;
  updated_at?: string | null;
  updated_by?: number | string | null;
}

export interface VisitorFollowUpConfigPayload {
  follow_ups_per_month: number;
  enabled: boolean;
}
