export type VisitorType = {
    id: string;
    title: string | null;
    firstName: string;
    lastName: string;
    otherName: string | null;
    email: string;
    phone: string;
    country: string;
    address: string;
    city: string;
    state: string;
    zipCode: string | null;
    visitDate: string;
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
  