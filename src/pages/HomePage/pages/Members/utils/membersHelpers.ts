import { IPersonalDetails } from "@/components/subform";
import { IMemberInfo } from "@/utils";
import { IMembersForm } from "../Components/MembersForm";

export const titleOptions = [
  { name: "Mr", value: "Mr" },
  { name: "Mrs", value: "Mrs" },
  { name: "Miss", value: "Miss" },
  { name: "Doc", value: "Doc" },
  { name: "Prof", value: "Prof" },
  { name: "Pastor", value: "Pastor" },
];


export const mapUserData = (input: IMemberInfo): IMembersForm => {
  const formatDate = (date: string) => (date ? date.split("T")[0] : "");
  const formatPhone = (phone: string) =>
    phone ? phone.replace(/[^0-9]/g, "") : "";

  return {
    personal_info: {
      title: input.title || "",
      first_name: input.first_name,
      other_name: input.other_name,
      last_name: input.last_name,
      date_of_birth: formatDate(input.date_of_birth),
      gender: input.gender || "",
      marital_status: input.marital_status || "",
      nationality: input.nationality || "",
      has_children: input.children.length > 0,
    },
    picture: { src: input.photo || "", picture: null },
    contact_info: {
      email: input.email,
      resident_country: input.country,
      state_region: input.state_region || "",
      city: input.city || "",
      phone: {
        country_code: input.country_code || "",
        number: formatPhone(input.primary_number),
      },
    },
    work_info: {
      work_name: input.work_info.name_of_institution,
      work_industry: input.work_info.industry,
      work_position: input.work_info.position,
      // school_name: input.work_info.name_of_institution
    },
    emergency_contact: {
      ...input.emergency_contact,
      phone: {
        country_code: input.emergency_contact.country_code || "",
        number: input.emergency_contact.phone_number || "",
      },
    },
    is_user: input.is_user,
    church_info: {
      membership_type: input.membership_type,
      department_id: input.department_id ?? undefined,
      position_id: input.position_id ?? undefined,
      member_since: formatDate(input.member_since),
    },
    children: (input.children as IPersonalDetails[]) || [],
  };
};
