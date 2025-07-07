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
  createdAt: string;
  updatedAt: string;
  topics: Topic[];
  cohorts: CohortType[];
  prerequisitePrograms: { id: number; title: string }[];
};

export type Topic = {
  id: number;
  name: string;
  programId: number;
};

export type CohortType = {
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
  courses: [];
};
export type CohortPayloadType = {
  name: string;
  startDate: string;
  status: string;
  description: string;
  duration: string;
  applicationDeadline: string;
  programId: number;
};

type CourseType = {
  id: number;
  name: string;
  capacity: number;
  enrolled: number;
  schedule: string;
  classFormat: string;
  location?: string;
  meetingLink: string;
  instructor: { name: string, id: number };
};

type Program = {
  id: number;
  title: string;
  description: string;
  member_required: boolean;
  leader_required: boolean;
  ministry_required: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DetailedCohortType = {
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
  program: Program;
  courses: CourseType[];
  isDeadlinePassed: boolean;
};
export type DetailedCourseType = {
  id: number;
  name: string;
  capacity: number;
  enrolled: number;
  schedule: string;
  classFormat: string;
  location?: string;
  meetingLink: string;
  instructor: { name: string; id: number };
  cohortId: number;
  enrollments: []
};