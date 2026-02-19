import { formatInputDate, VisitorType } from "@/utils";
import { IVisitorForm } from "../Components/VisitorForm";

type MemberReference =
  | string
  | number
  | {
      id?: string | number;
      value?: string | number;
    };

const getResponsibleMemberIds = (visitor: VisitorType): string[] => {
  const visitorWithMembers = visitor as VisitorType & {
    responsibleMembers?: MemberReference[];
    responsible_members?: MemberReference[];
  };

  const rawMembers =
    visitorWithMembers.responsibleMembers ||
    visitorWithMembers.responsible_members ||
    [];

  return rawMembers
    .map((member) => {
      if (typeof member === "string" || typeof member === "number") {
        return String(member);
      }
      if (member?.id !== undefined) {
        return String(member.id);
      }
      if (member?.value !== undefined) {
        return String(member.value);
      }
      return "";
    })
    .filter(Boolean);
};

export const mapVisitorToForm = (
  visitor: VisitorType
): IVisitorForm & { id: string } => {
  const visitDate =
    typeof visitor.visitDate === "string"
      ? visitor.visitDate
      : visitor.visitDate
      ? new Date(visitor.visitDate).toISOString()
      : undefined;

  return {
    id: visitor.id,
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
      phone: { country_code: visitor.country_code, number: visitor.phone },
      address: visitor.address,
    },
    visit: {
      date: formatInputDate(visitDate) || "",
      howHeard: visitor.howHeard,
      eventId: String(visitor.eventId)
    },
    consentToContact: visitor.consentToContact ? "yes" : "no",
    membershipWish: visitor.membershipWish ? "yes" : "no",
    responsibleMembers: getResponsibleMemberIds(visitor),
  };
};
