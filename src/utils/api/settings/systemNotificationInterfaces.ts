export interface SystemNotificationAdminCandidate {
  id: number;
  name: string;
  email: string | null;
  access_level_id: number | null;
  access_level_name: string | null;
}

export interface SystemNotificationSettingsConfig {
  system_failure_recipient_user_id: number | null;
  system_failure_recipient: SystemNotificationAdminCandidate | null;
  updated_at: string | null;
  updated_by: {
    id: number;
    name: string;
  } | null;
}

export interface SystemNotificationSettingsPayload {
  system_failure_recipient_user_id: number | null;
}
