import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";

export interface UserType {
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
  // department: { id: number | string; name: string };
  department_name: string;
  // position: any | null;
  // access: any | null;
  country_code: string;
  primary_number: string;
  title: string;
  photo: string;
}
type statsType = {
  total_members: number;
  total_males: number;
  total_females: number;
  stats: {
    adults: { Male: number; Female: number; Total: number };
    children: { Male: number; Female: number; Total: number };
  };
};
export type UserStats = {
  online: statsType;
  inhouse: statsType;
};

export interface MemberSlice {
  members: UserType[];
  membersOptions: ISelectOption[];
  userStats: UserStats;
  addMember: (member: UserType) => void;
  removeMember: (memberId: number | string) => void;
  updateMember: (updatedMember: UserType) => void;
  setMembers: (members: UserType[]) => void;
  setMemberOptions: () => void;
  setUserStats: (userStats: UserStats) => void;
}

export type StoreState = MemberSlice;
