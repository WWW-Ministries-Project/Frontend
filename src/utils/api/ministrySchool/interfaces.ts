// import { LearningUnitType } from "@/pages/HomePage/pages/MinistrySchool/Components/LearningUnit";

// ---------------------------------------------------------------------------
// LMS phase 1: modules, grading model, due-date rules (Backend PR #488)
// ---------------------------------------------------------------------------

export type GradingMode = "PASS_FAIL" | "WEIGHTED";
export type GradingCategory = "quiz" | "essay" | "exam";
export type GradingWeights = { quiz: number; essay: number; exam: number; attendance: number };
export type CompletionRules = {
  requireGrade: boolean;
  requireAllUnits: boolean;
  /** Minimum attendance %, or null when not required. */
  minAttendance: number | null;
};
export type ProgramGrading = {
  programId: number;
  grading_mode: GradingMode;
  pass_mark: number;
  grading_weights: GradingWeights;
  completion_rules: CompletionRules;
  auto_certificate: boolean;
};

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type DueRule = { week: number; mode: "day" | "after"; day?: Weekday; days?: number };

export type ModuleTopic = {
  id: number;
  name: string;
  order_number: number | null;
  moduleId: number | null;
  LearningUnit: {
    id: number;
    type: string;
    due_rule: DueRule | null;
    grading_category: GradingCategory | null;
  } | null;
};

export type ProgramModule = {
  id: number;
  programId: number;
  title: string;
  description: string | null;
  order_number: number;
  weeks: number | null;
  topics: ModuleTopic[];
};

export type ProgramModulesResponse = { modules: ProgramModule[]; unassigned: ModuleTopic[] };

export type ModulePayload = { programId?: number; title?: string; description?: string | null; weeks?: number | null };

export type CohortScheduleRow = {
  topicId: number;
  learningUnitId: number;
  name: string;
  moduleId: number | null;
  type: string;
  category: GradingCategory | null;
  rule: DueRule | null;
  ruleLabel: string;
  ruleDueDate: string | null;
  overrideDueDate: string | null;
  effectiveDueDate: string | null;
  isActive: boolean;
  closedAt: string | null;
  extensions: {
    id: number;
    enrollmentId: number;
    learnerName: string;
    dueDate: string;
    reason: string | null;
  }[];
};

export type CohortSchedule = {
  cohortId: number;
  cohortName: string;
  startDate: string;
  rows: CohortScheduleRow[];
};

export type ExtensionPayload = {
  cohortId: number;
  topicId: number;
  enrollmentId: number;
  dueDate: string;
  reason?: string;
};

export type ProgramsPayloadType = {
  title: string;
  description: string;
  topics: string[];
  prerequisites: string[];
  member_required: boolean;
  leader_required: boolean;
  ministry_required: boolean;
  branch_id?: number;
};

export const COHORT_STATUS = {
  UPCOMING: "Upcoming",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
} as const;

export type CohortStatus = (typeof COHORT_STATUS)[keyof typeof COHORT_STATUS];

export const COHORT_STATUS_VALUES: CohortStatus[] = [
  COHORT_STATUS.UPCOMING,
  COHORT_STATUS.ONGOING,
  COHORT_STATUS.COMPLETED,
];

const cohortStatusAliases: Record<string, CohortStatus> = {
  upcoming: COHORT_STATUS.UPCOMING,
  ongoing: COHORT_STATUS.ONGOING,
  active: COHORT_STATUS.ONGOING,
  current: COHORT_STATUS.ONGOING,
  completed: COHORT_STATUS.COMPLETED,
};

export const normalizeCohortStatus = (
  status?: string | null
): CohortStatus | null => {
  const key = (status ?? "").trim().toLowerCase();
  if (!key) return null;
  return cohortStatusAliases[key] ?? null;
};

export const getCohortStatusLabel = (status?: string | null): string => {
  const normalized = normalizeCohortStatus(status);
  if (normalized) return normalized;
  return (status ?? "").trim() || "Unknown";
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
    maxAttempts?: number;
    passMark?: number;
  };
};

export type AssignmentEssayLearningUnit = {
  type: "assignment-essay";
  data: {
    question: string;
    maxAttempt?: number;
    maxAttempts?: number;
    passMark?: number;
  };
};

export type TopicSubmission = {
  id: number;
  attempt: number;
  status: string;
  submittedAt: string;
  fileUrl?: string | null;
  score?: number | null;
  feedback?: string | null;
};

export type TopicOrderItem = {
  id: number;
  order_number: number;
};

export type ReorderProgramTopicsPayload = {
  programId: number;
  topics: TopicOrderItem[];
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
  submission?: TopicSubmission | null;
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
  type: "assignment" | "assignment-essay";
  version: number;
  topic: BackendTopic;
  activation: {
    isActive: boolean;
    activatedAt: string | null;
    dueDate: string | null;
    closedAt: string | null;
    submissions?: number;
    pending?: number;
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
  certificateNumber: string;
  verificationUrl: string;
  qrCodeDataUrl: string;
}

// ---------------------------------------------------------------------------
// GET program/programs-full-details
// ---------------------------------------------------------------------------

export type SomCompletionStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type ClassFormat = "In_Person" | "Online" | "Hybrid";

export type SomPerson = {
  id: number;
  name: string | null;
  email?: string | null;
  member_id?: string | null;
  user_info?: {
    first_name?: string | null;
    last_name?: string | null;
    primary_number?: string | null;
    photo?: string | null;
  } | null;
};

export type SomEnrollment = {
  id: number;
  user_id: number;
  course_id: number;
  enrolledAt: string;
  completed: boolean | null;
  completedAt: string | null;
  user: SomPerson | null;
  progress: {
    id: number;
    topicId: number;
    score: number | null;
    status: string;
    completed: boolean | null;
    completedAt: string | null;
  }[];
  completion_status: SomCompletionStatus;
  completion_percent: number;
  completed_topics: number;
  total_topics: number;
};

export type SomClass = {
  id: number;
  name: string;
  capacity: number;
  enrolled: number;
  schedule: string;
  classFormat: ClassFormat | null;
  location?: string | null;
  meetingLink?: string | null;
  cohortId: number;
  instructor: SomPerson | null;
  enrollments: SomEnrollment[];
};

export type SomCohort = {
  id: number;
  name: string;
  startDate: string;
  status: string;
  description: string;
  duration: string;
  applicationDeadline: string;
  programId: number;
  courses: SomClass[];
};

export type SomInstructor = SomPerson & {
  courses: { id: number; name: string; cohort_id: number; cohort_name: string }[];
};

export type SomMemberEnrollment = {
  enrollment_id: number;
  course_id: number;
  course_name: string;
  cohort_id: number;
  cohort_name: string;
  instructor: { id: number; name: string | null; email: string | null } | null;
  enrolled_at: string | null;
  completed_at: string | null;
  completion_status: SomCompletionStatus;
  completion_percent: number;
  completed_topics: number;
  total_topics: number;
};

export type SomEnrolledMember = SomPerson & {
  user_id: number | null;
  full_name: string;
  status: "completed" | "in_progress" | "not_started";
  cohort: { id: number; name: string } | null;
  class: { id: number; name: string } | null;
  date_enrolled: string | null;
  date_completed: string | null;
  completion_percentage: number;
  enrollments: SomMemberEnrollment[];
};

export type SomProgramFull = {
  id: number;
  title: string;
  description: string;
  member_required: boolean;
  leader_required: boolean;
  ministry_required: boolean;
  branch_id?: number | null;
  createdAt: string;
  topics: { id: number; name: string; order_number: number | null; LearningUnit: { type: string } | null }[];
  prerequisitePrograms: { prerequisiteId: number; prerequisite: { id: number; title: string } }[];
  cohorts: SomCohort[];
  instructors: SomInstructor[];
  enrolled_members: SomEnrolledMember[];
  enrollment_summary: {
    total_topics: number;
    total_cohorts: number;
    total_courses: number;
    total_enrollments: number;
    total_enrolled_members: number;
    completed_members: number;
    in_progress_members: number;
    not_started_members: number;
  };
};

// ---------------------------------------------------------------------------
// LMS phase 2: question bank, rubrics, gradebook, certificates (Backend PR #489)
// ---------------------------------------------------------------------------

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionOption = { id: string; text: string };

export type BankQuestion = {
  id: number;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[] | null;
  correct_option_id: string | null;
  tags: string[] | null;
  difficulty: Difficulty;
  createdAt: string;
  updatedAt: string;
};

export type BankQuestionPayload = {
  type: QuestionType;
  prompt: string;
  options?: QuestionOption[];
  correct_option_id?: string | null;
  tags?: string[];
  difficulty?: Difficulty;
};

export type RubricCriterion = { id: string; label: string; weight: number };
export type RubricLevel = { id: string; label: string; factor: number };
export type Rubric = {
  id: number;
  title: string;
  criteria: RubricCriterion[];
  levels: RubricLevel[];
  usedBy?: number;
  updatedAt: string;
};
export type RubricPayload = { title: string; criteria: RubricCriterion[]; levels?: RubricLevel[] };

export type GradeCellStatus = "graded" | "needs_grading" | "missing" | "open" | "excused" | "overridden";

export type GradebookCell = {
  topicId: number;
  status: GradeCellStatus;
  score: number | null;
  passed: boolean | null;
  submissionId: number | null;
  counted: number | null;
  note: string | null;
  extendedTo: string | null;
};

export type GradebookColumn = {
  topicId: number;
  learningUnitId: number;
  name: string;
  moduleId: number | null;
  type: string;
  category: GradingCategory | null;
  passMark: number;
  hasRubric: boolean;
  isActive: boolean;
  dueDate: string | null;
};

export type GradebookRow = {
  enrollmentId: number;
  userId: number | null;
  name: string;
  classId: number;
  className: string;
  classFormat: ClassFormat | null;
  attendance: number | null;
  cells: GradebookCell[];
  finalGrade: number | null;
  missing: number;
  needsGrading: number;
  failedUnits: number;
  status: "Completed" | "At risk" | "On track";
  reasons: string[];
};

export type Gradebook = {
  cohort: { id: number; name: string; startDate: string };
  program: { id: number; title: string };
  grading: {
    mode: GradingMode;
    passMark: number;
    weights: GradingWeights;
    completion: CompletionRules;
    /** False until session attendance is recorded; its weight is then left out. */
    attendanceTracked: boolean;
  };
  columns: GradebookColumn[];
  rows: GradebookRow[];
  totals: { learners: number; atRisk: number; needsGrading: number; missing: number };
};

export type GradeOverridePayload = {
  topicId: number;
  enrollmentIds: number[];
  score?: number | null;
  excused?: boolean;
  clear?: boolean;
  note?: string;
};

export type GradingSubmission = {
  id: number;
  attempt: number;
  status: string;
  submittedAt: string;
  fileUrl: string | null;
  content: string | null;
  score: number | null;
  feedback: string | null;
  rubricScores: Record<string, string> | null;
  learnerName: string;
  className: string;
  enrollmentId: number;
  unit: { id: number; type: string; topicId: number; name: string; prompt: string | null; passMark: number };
  rubric: Rubric | null;
};

export type ProgramCertificates = {
  issued: { id: number; certificateNumber: string; issuedAt: string; userId: number; name: string }[];
  eligible: { userId: number; name: string; cohort: string; className: string }[];
};
