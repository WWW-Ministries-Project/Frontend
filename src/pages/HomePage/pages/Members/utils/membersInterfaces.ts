export interface UserType {
  title?: string;
  first_name?: string;
  other_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  primary_number?: string;
  email?: string;
  address?: string;
  country?: string;
  department?: { id: string };
  occupation?: {
    name?: string;
    industry?: string;
    position?: string;
  };
  emergency_contact?: {
    name?: string;
    relation?: string;
  };
}
export interface OptionsType {
  name: string;
  value: string;
}


