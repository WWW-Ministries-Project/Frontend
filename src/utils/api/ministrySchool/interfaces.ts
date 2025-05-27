export type ProgramsPayloadType = {
  title: string;
  description: string;
  topics: string[];
  prerequisites: string[];
  member_required: boolean;
  leader_required: boolean;
  ministry_required: boolean;
};

export type ProgramResponse = {
  id: number;
  title: string;
  description: string;
  eligibility: string;
  member_required: boolean;
  leader_required: boolean;
  ministry_required: boolean;
  completed: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  topics: Topic[];
  cohorts: Cohort[];
  prerequisitePrograms: { id: number; title: string }[];//possibly wrong check it
};

export type Topic = {
  id: number;
  name: string;
  programId: number;
};

export type Cohort = {
  id: number;
  name: string;
  startDate: string; 
  status: string;
  description: string;
  duration: string;
  applicationDeadline: string; 
  programId: number;
  createdAt: string; 
  updatedAt: string; 
//   classes: number;
//   enrolledCount: number;
};
