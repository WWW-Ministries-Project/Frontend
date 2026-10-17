export type MembershipRequestStatus = "PENDING" | "APPROVED" | "DECLINED";

export interface GuestUserInfo {
  title?: string | null;
  first_name?: string | null;
  other_name?: string | null;
  last_name?: string | null;
  primary_number?: string | null;
  country_code?: string | null;
  gender?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface GuestMembershipRequest {
  id: number;
  status: MembershipRequestStatus;
  message?: string | null;
  requested_at: string;
  decided_at?: string | null;
  decline_reason?: string | null;
}

/** Someone who joined from the mobile app as a guest (`GET user/guests`). */
export interface GuestType {
  id: number;
  name: string;
  email: string | null;
  member_id?: string | null;
  created_at: string;
  is_active?: boolean | null;
  is_guest?: boolean | null;
  registration_source?: string | null;
  branch_id?: number | null;
  user_info?: GuestUserInfo | null;
  membership_request: GuestMembershipRequest | null;
}

/** A guest's request to become a member (`GET user/membership-requests`). */
export interface MembershipRequestRow extends GuestMembershipRequest {
  user: Omit<GuestType, "membership_request">;
  decider?: { id: number; name: string } | null;
}

export interface PagedItems<T> {
  items: T[];
  total: number;
  page: number;
  take: number;
}

export interface DecideMembershipRequestPayload {
  id: number;
  reason?: string;
}
