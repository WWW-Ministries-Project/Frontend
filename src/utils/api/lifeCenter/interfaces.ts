export type LifeCenterType = {
  name: string;
  description: string;
  location: string;
  meeting_dates: string[];
  totalMembers: number;
  totalSoulsWon: number;
  id: string;
};

export type SoulsWonType = {
  first_name: string;
  last_name: string;
  contact_number: string;
  contact_email: string;
  country: string;
  city: string;
  date_won: string;
  won_by: string;
  id: string;
};

export interface LifeCenterDetailsType extends LifeCenterType{
  members:{name:string; role:string}[]
  soulsWon:SoulsWonType[]
}