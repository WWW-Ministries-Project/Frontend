export type VisitorType = {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  email: string;
  phone: string;
  country: string;
  country_code: string;
  address: string;
  city: string;
  state: string;
  zipCode: string | null;
  visitDate?: string;
  is_member: boolean;
  howHeard: string;
  consentToContact: boolean;
  membershipWish: boolean;
  createdAt: string;
  updatedAt: string;
  visitCount: number;
  followUp: string;
};

export type VisitorResponseType = {
  data: VisitorType[];
};

/* Visits */
export type VisitType = {
  id: number|string;
  visitorId: number|string;
  date: string;
  eventName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
export type VisitPayloadType = {
  date: string;
  eventId: string;
  notes: string;
  visitorId: string;
}

export type FollowUpType = {
  id: string;
  date: string;
  type: string;
  status: string;
  notes: string;
  assignedTo: string;
}
export type FollowUpPayloadType = {
  date: string;
  type: string;
  assignedTo: string;
  notes: string;
  visitorId: string;
}

export type VisitorDetailsType = VisitorType & {
  visits: VisitType[];
  followUps: FollowUpType[]
};