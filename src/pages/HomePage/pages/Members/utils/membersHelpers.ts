import { membersType } from "../Components/MembersForm";
import { IAddMember } from "../pages/AddMember";
import { UserType } from "./membersInterfaces";

export const initialUser: UserType = {
  membership_type: "",
  first_name: "",
  other_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  marital_status: "",
  primary_number: "",
  country_code: "",
  email: "",
  address: "",
  country: "",
  is_user: false,
  department: { id: "", name: "" },
  work_info: {
    name_of_institution: "",
    industry: "",
    position: "",
  },
  emergency_contact: {
    name: "",
    relation: "",
    phone_number: "",
  },
  is_active: true,
  id: 0,
  name: "",
};
export const titleOptions = [
  { name: "Mr", value: "Mr" },
  { name: "Mrs", value: "Mrs" },
  { name: "Miss", value: "Miss" },
  { name: "Doc", value: "Doc" },
  { name: "Prof", value: "Prof" },
  { name: "Pastor", value: "Pastor" },
];

export const maritalOptions = [
  { name: "Single", value: "SINGLE" },
  { name: "Married", value: "MARRIED" },
  { name: "Divorced", value: "DIVORCED" },
  { name: "Widow", value: "WIDOW" },
  { name: "Widower", value: "WIDOWER" },
];

export interface IMemberInfo {
  membership_Id: string;
  member_id: string;
  membership_type: membersType;
  title: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
  other_name?: string;
  name?: string;
  date_of_birth: string;
  nationality: string;
  gender: string;
  marital_status: string;
  primary_number: string;
  country_code: string;
  email: string;
  isMinistryWorker: boolean;
  department?: number;
  status: "CONFIRMED" | "UNCONFIRMED" | "MEMBER";
  position?: number;
  work_info: {
    name_of_institution: string;
    industry: string;
    position: string;
  };
  emergency_contact: {
    name: string;
    relation: string;
    phone_number: string;
  };
  children: any[];
  photo: string;
  country: string;
}

export const mapUserData = (input: IMemberInfo): IAddMember => {
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
      picture: { src: input.photo || "", picture: null },
      has_children: input.children.length > 0,
    },
    contact_info: {
      email: input.email,
      resident_country: input.country,
      state_region: "",
      city: "",
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
    emergency_contact: input.emergency_contact,
    is_user: false,
    church_info: {
      membership_type: input.membership_type,
      department_id: input.department,
      position_id: input.position,
    },
    children: input.children,
  };
};
