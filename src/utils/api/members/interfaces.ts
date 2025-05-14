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
