/** Life center as returned by the list/create/update endpoints. */
export type LifeCenterType = {
  name: string;
  description: string;
  location: string;
  meeting_dates: string[];
  totalMembers: number;
  totalSoulsWon: number;
  id: string;
  branch_id?: number | "";
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

export interface LifeCenterRole {
  id: string | number;
  name: string;
  member_count?: number;
}

export interface LifeCenterMemberType {
  id: string | number;
  userId: string | number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: { id: string | number; name: string };
  /** Meetings attended out of the center's last 10 (`of`). */
  attended?: number;
  of?: number;
}

export interface LifeCenterSoul {
  id: string | number;
  title?: string | null;
  first_name: string;
  last_name: string;
  other_name?: string | null;
  gender?: string | null;
  contact_number: string;
  contact_email?: string | null;
  country_code?: string | null;
  country: string;
  city: string;
  date_won: string;
  wonById: string | number;
  wonByName?: string | null;
  lifeCenterId: string | number;
  isMember?: boolean;
  memberId?: string | number | null;
  memberName?: string | null;
  first_meeting_date?: string | null;
}

export interface LifeCenterDetailsType extends Omit<LifeCenterType, "totalMembers" | "totalSoulsWon"> {
  created_at?: string;
  leader?: { user_id: string | number; name: string } | null;
  members: LifeCenterMemberType[];
  soulsWon: LifeCenterSoul[];
}

/* --------------------------------- Overview -------------------------------- */

export interface LifeCenterOverviewCenter {
  id: number;
  name: string;
  description: string;
  location: string;
  meeting_days: string[];
  created_at: string;
  leader: { user_id: number; name: string } | null;
  member_count: number;
  souls_total: number;
  souls_to_follow_up: number;
  last_meeting_date: string | null;
  recent_meetings: { date: string; members: number; first_timers: number }[];
}

export interface LifeCenterOverviewMeeting {
  id: number;
  life_center_id: number;
  date: string;
  member_user_ids: number[];
  first_timer_ids: number[];
  offering: number;
  currency: string;
}

export interface LifeCenterOverviewSoul {
  id: number;
  life_center_id: number;
  date_won: string;
  converted: boolean;
}

export interface LifeCenterOverview {
  roles: LifeCenterRole[];
  centers: LifeCenterOverviewCenter[];
  meetings: LifeCenterOverviewMeeting[];
  souls: LifeCenterOverviewSoul[];
}

/* --------------------------------- Meetings -------------------------------- */

export type MeetingAttendeeType = {
  soulWonId: string | number;
  name: string;
  isFirstTimer: boolean;
  phone: {
    number: string | null;
    country_code: string | null;
  };
  gender: string | null;
};

export type MeetingType = {
  id: string | number;
  lifeCenterId: string | number;
  date: string;
  /** `YYYY-MM-DD` form of `date`. */
  day?: string;
  offeringAmount: string;
  currency: string;
  note: string | null;
  createdById: string | number;
  createdAt: string;
  created_by?: { id: string | number; name: string } | null;
  members?: { user_id: string | number; name: string; role?: string | null }[];
  attendees: MeetingAttendeeType[];
};

export interface NewFirstTimerPayload {
  first_name: string;
  last_name: string;
  contact_number: string;
  country_code?: string;
}

export interface MeetingPayload {
  id?: string | number;
  lifeCenterId: string | number;
  date: string;
  offeringAmount: string;
  currency: string;
  note: string | null;
  memberUserIds: number[];
  attendeeSoulWonIds: number[];
  firstTimerSoulWonIds: number[];
  newFirstTimers: NewFirstTimerPayload[];
}

export interface SoulWonPayload {
  first_name: string;
  last_name: string;
  gender: string;
  phone: { number: string; country_code: string };
  contact_email: string;
  country: string;
  city: string;
  date_won: string;
  wonById: string | number;
  lifeCenterId: string | number;
}

export interface LifeCenterSavePayload {
  name: string;
  description: string;
  location: string;
  meeting_dates: string[];
  leaderUserId?: number;
  branch_id?: number;
}

export interface LifeCenterMemberPayload {
  userId: string | number;
  roleId: string | number;
  lifeCenterId: string | number;
  branch_id?: number;
}

export type LeaderReminderReason = "overdue" | "irregular" | "attendance";

export type EligibleFirstTimerType = {
  id: string | number;
  title?: string | null;
  first_name: string;
  last_name: string;
};

export const MEETING_EXPORT_FORMATS = ["pdf", "docx", "xlsx"] as const;
export type MeetingExportFormat = (typeof MEETING_EXPORT_FORMATS)[number];

export type MeetingExportQuery = {
  lifeCenterId: string | number;
  format: MeetingExportFormat;
  /** Inclusive `YYYY-MM-DD` bounds. Omit both to export every meeting. */
  from?: string;
  to?: string;
};
