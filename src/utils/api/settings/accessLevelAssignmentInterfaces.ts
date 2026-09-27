import type { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";

export interface AssignableUser {
  id: number;
  name: string;
  email: string | null;
  member_id: string | null;
  photo: string | null;
  access_level: { id: number; name: string } | null;
}

export interface BulkAssignAccessLevelPayload {
  access_level_id: number;
  assign_user_ids?: number[];
  unassign_user_ids?: number[];
}

export interface BulkAssignAccessLevelResult {
  access_level: AccessRight;
  assigned_count: number;
  unassigned_count: number;
}
