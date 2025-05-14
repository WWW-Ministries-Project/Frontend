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

export type MembersType = {
  id: number;
  name: string;
  email: string;
  member_id: string;
  created_at: string;
  is_active: boolean;
  is_user: boolean;
  department_id: number | null;
  membership_type: string;
  status: string;
  // department: any | null;
  // position: any | null;
  // access: any | null;
  country_code: string;
  primary_number: string;
  title: string;
  photo: string;
};

export interface IMemberInfo {
  membership_Id: string;
  member_id: string;
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
  country_code: string;
  email: string;
  isMinistryWorker: boolean;
  department?: number;
  status: "CONFIRMED" | "UNCONFIRMED" | "MEMBER";
  position?: number;
  work_info: {
    name_of_institution: string;
    industry: string;
    position: string;
  };
  emergency_contact: {
    name: string;
    relation: string;
    phone_number: string;
  };
  children: unknown[];
  photo: string;
  country: string;
}