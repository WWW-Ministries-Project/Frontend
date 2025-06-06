export type LifeCenterType = {
  name: string;
  description: string;
  location: string;
  meeting_dates: string[];
  num_of_members: number;
  num_of_souls_won: number;
  id?: string;
};

export type SoulsWon ={
    first_name:string;
    last_name:string;
    contact:string;
    location:string;
    date_won:string;
    won_by:string;
    city:string;
    life_center_name:string
    id?:string
}