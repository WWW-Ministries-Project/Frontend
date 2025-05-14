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