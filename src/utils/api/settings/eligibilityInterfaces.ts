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

export interface PositionEligibilityReference {
  id: number;
  name: string;
}

export interface RoleEligibilityRule {
  role_key: EligibilityRoleKey;
  required_program_ids: number[];
  required_programs?: RoleEligibilityProgram[];
}

export interface PositionEligibilityRule {
  position_id: number;
  required_program_ids: number[];
  position?: PositionEligibilityReference;
  required_programs?: RoleEligibilityProgram[];
}

export interface RoleEligibilityConfig {
  rules: RoleEligibilityRule[];
  position_rules?: PositionEligibilityRule[];
}

export interface RoleEligibilityConfigPayload {
  rules: {
    role_key: EligibilityRoleKey;
    required_program_ids: number[];
  }[];
  position_rules: {
    position_id: number;
    required_program_ids: number[];
  }[];
}
