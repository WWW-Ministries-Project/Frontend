// import { LearningUnitType } from "@/pages/HomePage/pages/MinistrySchool/Components/LearningUnit";

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

// export type Topic = {
//   id: number;
//   name: string;
//   programId: number;
// };

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
  program: Program;
  
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
  facilitator: { name: string, id: number };
  cohort: CohortType;
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
  topics?: Topic[];
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

export type TopicMaterial = {
  id: number;
  name: string;
  description?: string;
  url?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
};

export type AllTopic = {
  id: number;
  name: string;
  programId: number;
  materials: TopicMaterial[];
  assignments: TopicAssignment[];
}

export type TopicAssignment = {
  id: number;
  name: string;
  description?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
};

// export type Topic = {
//   id: number;
//   name: string;
//   programId: number;
//   score: number;
//   progressId: number;
//   status: "PENDING" | "PASS" | "FAIL";
//   completedAt: string | null;
//   notes?: string;
// };

// type DetailedProgramType = {
//   id: number;
//   title: string;
//   description: string;
//   member_required: boolean;
//   leader_required: boolean;
//   ministry_required: boolean;
//   completed: boolean;
//   createdAt: string;
//   updatedAt: string;
//   topics: Topic[];
// }

// type CohortType = {
//   id: number;
//   name: string;
//   startDate: string;
//   status: string;
//   description: string;
//   duration: string;
//   applicationDeadline: string;
//   programId: number;
//   createdAt: string;
//   updatedAt: string;
//   program: DetailedProgramType;
// }

// interface Course {
//   id: number;
//   name: string;
//   instructorId: number;
//   capacity: number;
//   enrolled: number;
//   schedule: string;
//   cohortId: number;
//   classFormat: string;
//   location: string;
//   meetingLink: string | null;
//   createdAt: string;
//   updatedAt: string;
//   cohort: CohortType;
// }
export type UserInfo = {
  primary_number?: string;
  country_code?:string
}

export type User = {
  id?: string;
  name?: string;
  email?: string;
  user_info?: UserInfo;
}

export type EnrollmentDataType = {
  id: number;
  user_id: number;
  course_id: number;
  enrolledAt: string;
  course: CourseType;
  phone: string;
  email: string;
  user: User;
  topics?: Topic[];
}

export type ClassOption = {
  id: string
  name: string
  meetingDays: string[]
  meetingTime: string
  facilitator: string
  enrolled: number
  capacity: number
}

export type Programs = {
  id: string
  name: string
  member_required: boolean
  leader_required: boolean
  ministry_required: boolean
  upcomingCohort: string
  topics: Topic[]
  description: string
  prerequisites: string[] | undefined
  courses: ClassOption[]
  completed?: boolean
}

export type LessonNoteLearningUnit = {
  type: "lesson-note";
  data: {
    content: string;
  };
};

export type MediaLearningUnit = {
  type: "video" | "live" | "in-person";
  data: {
    value: string;
  };
};

export type FileLearningUnit = {
  type: "pdf" | "ppt";
  data: {
    link: string;
  };
};

export type AssignmentOption = {
  id: string;
  text: string;
};

export type AssignmentQuestion = {
  id: string;
  question: string;
  options: AssignmentOption[];
  correctOptionId: string | null;
};

export type AssignmentLearningUnit = {
  type: "assignment";
  data: {
    questions: AssignmentQuestion[];
    maxAttempt?: number;
  };
};

export type AssignmentEssayLearningUnit = {
  type: "assignment-essay";
  data: {
    question: string;
  };
};

export type LearningUnit =
  | LessonNoteLearningUnit
  | MediaLearningUnit
  | FileLearningUnit
  | AssignmentLearningUnit
  | AssignmentEssayLearningUnit;

export type Topic = {
  id: string | number;
  order?: number;
  name: string;
  description?: string | TrustedHTML | null | undefined;
  type?: LearningUnitType;
  url?: string;
  programId?: number;
  learningUnit?: LearningUnit;
  LearningUnit?: LearningUnit;
  completed?: boolean;
  status?: "PASS" | "FAIL" | "PENDING";
  score?: number | null;
  completedAt?: string | null;
  activation?: {
    isActive: boolean;
    activatedAt?: string | null;
    dueDate?: string | null;
    closedAt?: string | null;
  };
  notes?: string | null;
};

export type BackendTopic = {
  id: number;
  name: string;
  description: string;
  order: number;
};

export type CohortAssignment = {
  learningUnitId: number;
  type: "assignment";
  version: number;
  topic: BackendTopic;
  activation: {
    isActive: boolean;
    activatedAt: string | null;
    dueDate: string | null;
    closedAt: string | null;
  };
};

export type LearningUnitType =
  | "video"
  | "live"
  | "in-person"
  | "ppt"
  | "pdf"
  | "lesson-note"
  | "assignment"
  | "assignment-essay";

export type ProgramTopic = {
  id: number;
  name: string;
  programId: number;
  description?: string | TrustedHTML | null | undefined;
  topic: Topic[];
}

export type EnrolledProgramResponse = {
  id: number;
  user_id: number;
  course_id: number;
  enrolledAt: string;
  completed: boolean;
  completedAt: string | null;
  instructor: {
    id: number;
    name: string;
  };
  cohort: {
    id: number;
    name: string;
    status: string;
    startDate: string;
    duration: string;
  };
  program: {
    id: number;
    title: string;
  };
  course: {
    id: number;
    name: string;
    schedule: string;
    classFormat: string;
    location: string;
    meetingLink: string;
  };
}

export interface CertificateData {
  recipientFullName: string;
  programTitle: string;
  completionDate: string;
  issueDate: string;
  certificateId: string;
  signatoryName: string;
  signatoryTitle: string;
  verificationUrl: string;
}
