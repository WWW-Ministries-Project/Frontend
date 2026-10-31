export type VisitorType = {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  email: string;
  phone: string;
  country: string;
  country_code: string;
  address: string;
  city: string;
  state: string;
  zipCode: string | null;
  visitDate?: string | number | Date;
  is_member: boolean;
  howHeard: string;
  consentToContact: boolean;
  membershipWish: boolean;
  isClergy?: boolean;
  churchName?: string | null;
  churchLocation?: string | null;
  churchRole?: string | null;
  createdAt: string;
  updatedAt: string;
  visitCount: number;
  followUp: string;
  eventId: string;
  eventName: string;
  responsibleMembers?: Array<
    | string
    | number
    | {
        id?: string | number;
        value?: string | number;
      }
  >;
  responsible_members?: Array<
    | string
    | number
    | {
        id?: string | number;
        value?: string | number;
      }
  >;
  responsibleMembersNames?: Array<{
    userId: string | number;
    name: string;
  }>;
};

export type VisitorResponseType = {
  data: VisitorType[];
};

/* Visits */
export type VisitType = {
  id: number | string;
  visitorId: number | string;
  date: string;
  eventName?: string;
  eventType?: string;
  eventId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
export type VisitPayloadType = {
  date: string;
  eventId: string;
  notes: string;
  visitorId: string;
};

export type FollowUpType = {
  id: string | number;
  date: string;
  type: string;
  status: string;
  notes: string;
  assignedTo: string;
};
export type FollowUpPayloadType = {
  date: string;
  type: string;
  assignedTo: string | number;
  notes: string;
  visitorId: string | number;
  /** Ignored on create (always "pending"); a missing status on update resets it. */
  status?: string;
};

/** Raw `visit` row from `GET visitor/visits` (eventId is the event_mgt id). */
export type RawVisitType = {
  id: number;
  visitorId: number | null;
  date: string;
  eventId: number | null;
  notes?: string | null;
};

/** Raw `follow_up` row from `GET visitor/followups` (assignedTo is a user id). */
export type RawFollowUpType = {
  id: number;
  visitorId: number | null;
  date: string;
  type: string;
  status: string;
  notes?: string | null;
  assignedTo: number | null;
};

/** Body for `POST visitor/visitors` and `PUT visitor/visitor?id=`. */
export type VisitorPayloadType = {
  branch_id?: number;
  personal_info: {
    title: string;
    first_name: string;
    last_name: string;
    other_name: string;
    gender: string;
  };
  contact_info: {
    email: string;
    phone: { country_code: string; number: string };
    resident_country: string;
    state_region: string;
    city: string;
    address: string;
  };
  visit: { date: string; eventId?: string; howHeard: string };
  consentToContact: boolean;
  membershipWish: boolean;
  responsibleMembers: number[];
  isClergy: boolean;
  clergy_info: { churchName: string; churchLocation: string; churchRole: string };
};

export type VisitorDetailsType = VisitorType & {
  visits: VisitType[];
  followUps: FollowUpType[];
};
