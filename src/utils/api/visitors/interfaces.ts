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
  id: string;
  date: string;
  type: string;
  status: string;
  notes: string;
  assignedTo: string;
};
export type FollowUpPayloadType = {
  date: string;
  type: string;
  assignedTo: string;
  notes: string;
  visitorId: string;
};

export type VisitorDetailsType = VisitorType & {
  visits: VisitType[];
  followUps: FollowUpType[];
};
