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
    phone: {
      country_code: true,
      number: true,
    },
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
const visitAccess = {
  visitor: {
    title: false,
    first_name: false,
    other_name: false,
    last_name: false,
    date_of_birth: false,
    gender: false,
    marital_status: false,
    nationality: false,
  },
  visit: {
    visit_date: true,
    how_heard: true,
    consent_to_contact: true,
    membership_wish: true,
  },
};

export const initialMembersAccess = [
  { name: "Members", access: membersAccess },
  { name: "Visitors", access: visitAccess },
];
