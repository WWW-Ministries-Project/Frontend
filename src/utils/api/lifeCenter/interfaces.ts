import { ISoulsWonForm } from "@/pages/HomePage/pages/LifeCenter/components/SoulsWonForm";

export type LifeCenterType = {
  name: string;
  description: string;
  location: string;
  meeting_dates: string[];
  totalMembers: number;
  totalSoulsWon: number;
  id: string;
};

export type SoulsWonType = {
  first_name: string;
  last_name: string;
  contact_number: string;
  contact_email: string;
  country: string;
  city: string;
  date_won: string;
  won_by: string;
  id: string;
};

export type LifeCenterStatsType = {
  life_center_name: string;
  leader_name: string;
  soul_name: string;
  contact: string;
  location: string;
  date_won: string;
  won_by: string;
};

export type SoulWonListType = {
  id: string | number;
  title?: string | null;
  first_name: string;
  last_name: string;
  other_name?: string | null;
  contact_number: string;
  contact_email?: string | null;
  country_code?: string | null;
  country: string;
  city: string;
  date_won: string;
  wonById: string | number;
  lifeCenterId: string | number;
  isMember?: boolean;
  memberId?: string | number | null;
  memberName?: string | null;
  memberMemberId?: string | null;
  wonBy?: {
    id: string | number;
    name?: string | null;
  } | null;
  lifeCenter?: {
    id: string | number;
    name?: string | null;
    location?: string | null;
  } | null;
  member?: {
    id: string | number;
    name?: string | null;
    email?: string | null;
    member_id?: string | null;
    status?: string | null;
  } | null;
};

export interface LifeCenterMemberType {
  name: string;
  role: { name: string; id: string };
  id: string;
  userId: string;
  lifeCenterId: string;
  user: { name: string; id: string };
}
export interface LifeCenterDetailsType extends LifeCenterType {
  members: LifeCenterMemberType[];
  soulsWon: ISoulsWonForm[];
}
