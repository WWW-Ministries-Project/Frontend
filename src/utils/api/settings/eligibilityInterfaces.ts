export type EligibilityRoleKey =
  | "member"
  | "ministry_worker"
  | "instructor"
  | "life_center_leader"
  | "head_of_department";

export interface RoleEligibilityProgram {
  id: number;
  title: string;
}

export interface RoleEligibilityRule {
  role_key: EligibilityRoleKey;
  required_program_ids: number[];
  required_programs?: RoleEligibilityProgram[];
}

export interface RoleEligibilityConfig {
  rules: RoleEligibilityRule[];
}

export interface RoleEligibilityConfigPayload {
  rules: {
    role_key: EligibilityRoleKey;
    required_program_ids: number[];
  }[];
}
