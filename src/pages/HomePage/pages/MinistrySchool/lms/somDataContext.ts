import {
  type SomClass,
  type SomEnrolledMember,
  type SomEnrollment,
  type SomInstructor,
  type SomProgramFull,
  type SomCohort,
} from "@/utils/api/ministrySchool/interfaces";
import { createContext, useContext } from "react";
import type { CohortTiming, LearnerHealth } from "./somUtils";

export type CohortRow = SomCohort & {
  program: Pick<SomProgramFull, "id" | "title">;
  timing: CohortTiming;
  learnerCount: number;
  attentionCount: number;
};

export type EnrollmentRow = SomEnrollment & {
  name: string;
  program: Pick<SomProgramFull, "id" | "title">;
  cohort: CohortRow;
  cls: SomClass;
  health: LearnerHealth;
};

export type LearnerRow = SomEnrolledMember & {
  program: Pick<SomProgramFull, "id" | "title">;
};

export type InstructorRow = SomInstructor & {
  displayName: string;
  programs: string[];
  learnerCount: number;
  formats: string[];
};

export type SomData = {
  loading: boolean;
  error: string | null;
  refetch: () => void;
  programs: SomProgramFull[];
  cohorts: CohortRow[];
  enrollments: EnrollmentRow[];
  learners: LearnerRow[];
  instructors: InstructorRow[];
};

export const SomDataContext = createContext<SomData | null>(null);

export const useSomData = () => {
  const ctx = useContext(SomDataContext);
  if (!ctx) throw new Error("useSomData must be used within SomDataProvider");
  return ctx;
};

