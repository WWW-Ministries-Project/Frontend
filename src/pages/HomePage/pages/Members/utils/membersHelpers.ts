import * as Yup from 'yup';
import { maxMinValueForDate } from '@/pages/HomePage/utils';
import { UserType } from './membersInterfaces';

export const userFormValidator = Yup.object({
  title: Yup.string().required('Required'),
  membership_type: Yup.string().required('Required'),
  first_name: Yup.string().required('Required'),
  // other_name: Yup.string(),
  last_name: Yup.string().required('Required'),
  date_of_birth: Yup.date().required("Required").max(maxMinValueForDate().minDate,"date can't be after today"),
  gender: Yup.string().required('Required'),
  // marital_status: Yup.string(),
  primary_number: Yup.string().required('Required').matches(/^[\d\s\-()]+$/, 'Invalid'),
  country_code: Yup.string().required('Required').matches(/^\+\d+$/, 'Invalid'),
  email: Yup.string().email('Invalid email address').required('Required'),
  // address: Yup.string(),
  // country: Yup.string().required('Required'),
  // is_user: Yup.boolean(),
//   department: Yup.object({
//     id: Yup.string(),
//     name: Yup.string(),
//   }),
//   work_info: Yup.object({
//     name_of_institution: Yup.string(),
//     industry: Yup.string(),
//     position: Yup.string(),
//   }),
// emergency_contact_name: Yup.string().required('Required'),
//   emergency_contact_relation: Yup.string().required('Required'),
//   emergency_contact_phone_number: Yup.string().required('Required'),
});

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
  ]

  export const maritalOptions = [
    { name: "Single", value: "SINGLE" },
    { name: "Married", value: "MARRIED" },
    { name: "Divorced", value: "DIVORCED" },
    { name: "Widow", value: "WIDOW" },
    { name: "Widower", value: "WIDOWER" },
  ]