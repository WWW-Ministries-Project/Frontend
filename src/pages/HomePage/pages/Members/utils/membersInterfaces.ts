export interface UserType {
  id?: string;
  is_user?: boolean;
  title?: string;
  name?: string;
  first_name?: string;
  other_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  primary_number: string;
  country_code?: string;
  email: string;
  address?: string;
  country?: string;
  photo?: string;
  department?: { id: string, name: string };
  position?: { id: string, name: string };
  work_name?: string;
  work_industry?: string;
  work_position?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone_number?: string;
  work_info?:{
    name_of_institution:string;
    industry:string;
    position:string;
  }
  emergency_contact?:{
    name:string;
    relation:string;
    phone_number:string;
  }
}
export interface OptionsType {
  name: string;
  value: string;
}
