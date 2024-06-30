import * as Yup from 'yup';
import { maxMinValueForDate } from '@/pages/HomePage/utils/helperFunctions';

export const userFormValidator = Yup.object({
  // title: Yup.string().required('Required'),
  membership_type: Yup.string().required('Required'),
  first_name: Yup.string().required('Required'),
  other_name: Yup.string(),
  last_name: Yup.string().required('Required'),
  date_of_birth: Yup.date().max(maxMinValueForDate().minDate,"date can't be after today").required("Required"),
  gender: Yup.string().required('Required'),
  marital_status: Yup.string(),
  primary_number: Yup.string().required('Required'),
  country_code: Yup.string().required('Required').max(6,"check code"),
  email: Yup.string().email('Invalid email address').required('Required'),
  address: Yup.string(),
  country: Yup.string().required('Required'),
  is_user: Yup.boolean(),
//   department: Yup.object({
//     id: Yup.string(),
//     name: Yup.string(),
//   }),
//   work_info: Yup.object({
//     name_of_institution: Yup.string(),
//     industry: Yup.string(),
//     position: Yup.string(),
//   }),
emergency_contact_name: Yup.string().required('Required'),
  emergency_contact_relation: Yup.string().required('Required'),
  emergency_contact_phone_number: Yup.string().required('Required'),
});

export const initialUser = {
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
  };
  