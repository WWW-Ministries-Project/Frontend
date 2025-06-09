import { AccessState } from "./settingsInterfaces";

const membersAccess = {
  personal_information: {
    title: true,
    first_name: true,
    other_name: true,
    last_name: true,
    date_of_birth: true,
    gender: true,
    marital_status: true,
    nationality: true,
  },
  contact_information: {
    email: true,
    resident_country: true,
    state_region: true,
    city: true,
    phone_number: true,
  },
  work_information: {
    employment_status: true,
    work_name: true,
    work_industry: true,
    work_position: true,
    school_name: true,
  },
  church_information: {
    member_since: true,
    membership_type: true,
    department_id: true,
    position_id: true,
  },
};


export const initialAccess = [
  { name: "Members", access: membersAccess, topPermission: "Can_View", },
  { name: "Visitors", topPermission: "Can_View", },
  { name: "Positions", topPermission: "Can_View", },
  { name: "Departments", topPermission: "Can_View", },
  { name: "Access Rights", topPermission: "Super_Admin", },
  { name: "Settings", topPermission: "Can_Manage", },

];
