import { VisitorType } from "@/utils";
import { IVisitorForm } from "../Components/VisitorForm";

export const mapVisitorToForm = (visitor: VisitorType): IVisitorForm => {
  return {
    personal_info: {
      title: visitor.title,
      first_name: visitor.firstName,
      last_name: visitor.lastName,
      other_name: visitor.otherName,
    },
    contact_info: {
      email: visitor.email,
      resident_country: visitor.country,
      state_region: visitor.state,
      city: visitor.city,
      phone: { country_code: "", number: visitor.phone },
      address: visitor.address,
    },
    visit: {
      date: visitor.visitDate,
      howHeard: visitor.howHeard,
      eventId: "", // or handle this if you have a way to get it
    },
    consentToContact: visitor.consentToContact ? "yes" : "no",
    membershipWish: visitor.membershipWish ? "yes" : "no",
  };
};
