import type { FamilyRelation } from "@/utils/familyRelations";

type statsType = {
  total_members: number;
  total_males: number;
  total_females: number;
  stats: {
    adults: { Male: number; Female: number; Total: number };
    children: { Male: number; Female: number; Total: number };
  };
};
export type UserStatsType = {
  online: statsType;
  inhouse: statsType;
};

export type activateMemberPayloadType = {
  id: number;
  is_active: boolean;
  status: "UNCONFIRMED" | "CONFIRMED" | "MEMBER";
};

export type activateMemberType = {
  id: string;
  is_active: boolean;
  member_id: string;
  status: "UNCONFIRMED" | "CONFIRMED" | "MEMBER";
};

export type BulkUpdateUserStatusPayload = {
  user_ids: (string | number)[];
  is_active: boolean;
};

export type BulkUpdateUserStatusResult = {
  user_id: string | number;
  success: boolean;
  noop?: boolean;
  code?: string;
  message?: string;
  previous?: boolean;
  current?: boolean;
};

export type BulkUpdateUserStatusResponse = {
  results: BulkUpdateUserStatusResult[];
  summary: {
    total: number;
    succeeded: number;
    skipped: number;
    failed: number;
  };
};

export type BulkUpdateMemberStatusPayload = {
  status: "CONFIRMED" | "MEMBER";
  user_ids: Array<string | number>;
};

export type BulkUpdateMemberStatusResult = {
  user_id: string | number;
  success: boolean;
  previous_status?: "UNCONFIRMED" | "CONFIRMED" | "MEMBER" | null;
  current_status?: "UNCONFIRMED" | "CONFIRMED" | "MEMBER" | null;
  code?: string;
  message?: string;
};

export type BulkUpdateMemberStatusResponse = {
  status: "CONFIRMED" | "MEMBER";
  requested_count: number;
  success_count: number;
  failure_count: number;
  results: BulkUpdateMemberStatusResult[];
};

export type MembersType = {
  id: number;
  name: string;
  email: string;
  member_id: string;
  created_at: string;
  is_active: boolean;
  is_user: boolean;
  department_id: number | null;
  department_name: string;
  membership_type: string;
  status: "CONFIRMED" | "UNCONFIRMED" | "MEMBER" | null;
  // department: any | null;
  // position: any | null;
  // access: any | null;
  country_code: string;
  primary_number: string;
  title: string;
  photo: string;
  // Set by the API when the member is on the viewer's Members exclusion
  // list; contact details come back null.
  is_restricted?: boolean;
  // Added by `list-users` for the membership redesign. Masked (null) for
  // restricted members.
  gender?: string | null;
  city?: string | null;
  state_region?: string | null;
  nationality?: string | null;
  has_emergency_contact?: boolean | null;
  children_count?: number | null;
  /** Converted from a visitor record / a life-center soul-won record. */
  from_visitor?: boolean;
  from_soul_won?: boolean;
  // ISO strings; null for members whose stage changed before tracking began.
  confirmed_at?: string | null;
  functional_at?: string | null;
};

/** `list-users` status totals returned with `include_status_counts=true`. */
export type MemberStatusCounts = {
  all: number;
  UNCONFIRMED: number;
  CONFIRMED: number;
  MEMBER: number;
  inactive: number;
};

export type MembersListMeta = {
  status_counts?: MemberStatusCounts;
};

export type AccessLevelType = {
  id: number;
  name: string;
  description: string | null;
  permissions: Record<string, string>;
};

export interface IEnrolledPrograms {
  summary?: IEnrolledProgramSummary;
  items?: IEnrolledProgramItem[];
}

export interface IEnrolledProgramSummary {
  total?: number;
  completed?: number;
  in_progress?: number;
}

export interface IEnrolledProgramItem {
  enrollment_id: number | string;
  enrolled_at?: string;
  program?: {
    id?: number | string;
    name?: string;
  };
  cohort?: {
    id?: number | string;
    name?: string;
    status?: string;
  };
  facilitator?: {
    id?: number | string;
    name?: string;
  };
  /** 0–100, from completed topics over the program's topics. */
  progress_percent?: number;
  completed_topics?: number;
  total_topics?: number;
  status?: {
    completed?: boolean;
    label?: string;
    completed_at?: string | null;
  };
}

export interface IMemberInfo {
  id: string | number;
  membership_Id: string;
  member_since: string;
  member_id: string;
  access_level_id: string | null;
  access: AccessLevelType | null;
  membership_type: "ONLINE" | "IN_HOUSE";
  title: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
  other_name?: string;
  name?: string;
  date_of_birth: string;
  nationality: string;
  gender: string;
  marital_status: string;
  primary_number: string;
  other_number?: string | null;
  country_code: string;
  email: string;
  isMinistryWorker: boolean;
  state_region?:string
  city?:string;
  department_id?: number;
  is_user: boolean;
  department: {
    id: number;
    name: string;
  };
  status: "CONFIRMED" | "UNCONFIRMED" | "MEMBER" | null;
  position_id?: number;
  position: {
    id: number;
    name: string;
  };
  work_name?: string;
  work_info: {
    name_of_institution: string;
    industry: string;
    position: string;
  };
  emergency_contact: {
    name: string;
    relation: string;
    phone_number?: string;
    country_code?: string;
  };
  family: IFamilyMemberRecord[];
  enrolled_programs?: IEnrolledPrograms;
  department_positions: Array<
    | string
    | {
        department_id?: number | string | null;
        department_name?: string | null;
        position_id?: number | string | null;
        position_name?: string | null;
      }
  >;
  photo: string;
  country: string;
  confirmed_at?: string | null;
  member_source?: MemberSource | null;
  functional_at?: string | null;
}

export interface IFamilyMemberRecord {
  user_id?: string | number;
  relation?: FamilyRelation | string;
  title?: string;
  first_name?: string;
  other_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  email?: string;
  country_code?: string;
  primary_number?: string;
  [key: string]: unknown;
}

export interface IFamilyUserInfo {
  first_name?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  primary_number?: string;
  email?: string;
}

export interface IFamilyRelationRaw {
  id: number;
  name?: string;
  email?: string;
  is_user?: boolean;
  user_info?: IFamilyUserInfo | null;
}

export interface IFamilyPerson {
  id?: number;
  name: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  primary_number?: string;
  email?: string;
  is_member?: boolean;
}

export interface IFamilyInformationRaw {
  spouses: IFamilyRelationRaw[];
  children: IFamilyRelationRaw[];
  parents: IFamilyRelationRaw[];
  siblings: IFamilyRelationRaw[];
  others: IFamilyRelationRaw[];
}

/** Where a member came from before joining (`user/get-user`). */
export type MemberSource =
  | {
      type: "VISITOR";
      visitor: {
        id: number;
        first_visit_at: string | null;
        last_visit_at: string | null;
        visit_count: number;
      };
    }
  | {
      type: "SOUL_WON";
      soul_won: {
        id: number;
        date_won: string | null;
        life_center_name: string | null;
        won_by_name: string | null;
      };
    };
