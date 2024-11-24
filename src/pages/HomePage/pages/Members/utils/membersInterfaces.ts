export interface UserType {
  is_active: any;
  user_info?: any; //todo : get correct type
  id: number|string;
  is_user?: boolean;
  title?: string;
  name: string;
  first_name?: string;
  other_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  primary_number: string;
  country_code?: string;
  email: string;
  address?: string;
  country?: string;
  membership_type?: string;
  photo?: string;
  department?: { id: string; name: string };
  position?: { id: string; name: string };
  position_id?: string;
  department_id?: string;
  work_name?: string;
  work_industry?: string;
  work_position?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone_number?: string;
  work_info?: {
    name_of_institution: string;
    industry: string;
    position: string;
  };
  emergency_contact?: {
    name: string;
    relation: string;
    phone_number: string;
  };
}
export type UserStats = {
  total_members: number;
  total_males: number;
  total_females: number;
  stats: {
    adults: { Male: number; Female: number; Total: number };
    children: { Male: number; Female: number; Total: number };
  };
};
export interface OptionsType {
  name: string;
  value: string;
}

export interface MemberSlice {
  members: UserType[];
  userStats: UserStats;
  addMember: (member: UserType) => void;
  removeMember: (memberId: number|string) => void;
  updateMember: (updatedMember: UserType) => void;
  setMembers: (members: UserType[]) => void;
  setUserStats: (userStats: UserStats) => void;
}

export type StoreState = MemberSlice;
