import type { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import type { BranchAccessGrant } from "@/utils/interfaces";

export interface AssignableUser {
  id: number;
  name: string;
  email: string | null;
  member_id: string | null;
  photo: string | null;
  access_level: { id: number; name: string } | null;
  /** The user's role in each branch. */
  branch_access?: BranchAccessGrant[];
}

export interface UserBranchAccess {
  user_id: number;
  home_branch_id?: number | null;
  branch_access: BranchAccessGrant[];
}

export interface SetUserBranchAccessPayload {
  user_id: number;
  branch_id: number;
  /** `null` removes their access to the branch. */
  access_level_id: number | null;
}

export interface BulkAssignAccessLevelPayload {
  access_level_id: number;
  assign_user_ids?: number[];
  unassign_user_ids?: number[];
  /** The branch the role is given or taken in. */
  branch_id?: number;
}

export interface BulkAssignAccessLevelResult {
  access_level: AccessRight;
  assigned_count: number;
  unassigned_count: number;
}
