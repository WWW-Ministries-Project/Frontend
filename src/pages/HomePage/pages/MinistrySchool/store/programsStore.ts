import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Cohort {
  id: number;
  name: string;
  startDate: string;
  duration?: string;
  status: string;
  classes?: number;
  enrolledCount?: number;
}

export interface ProgramTopicSummary {
  id: string | number;
  name: string;
}

export interface Program {
  id: number;
  title: string;
  description: string;
  eligibility: "Members" | "Non_Members" | "Both";
  topics: ProgramTopicSummary[];
  cohorts: Cohort[];
}

export interface ApplicantUserProfile {
  membership_type?: "ONLINE" | "IN_PERSON" | string;
}

export interface ApplicantUser {
  user_id?: string | number;
  first_name: string;
  last_name: string;
  email: string;
  primary_number?: string;
  country_code?: string;
  user?: ApplicantUserProfile;
}

export interface ApplicantCourse {
  id: string;
  name: string;
  instructor: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  location: string;
  meetingLink?: string;
  classFormat: "In_Person" | "Hybrid" | "Online" | string;
}

export interface CurrentApplicant {
  user: ApplicantUser;
  courses?: ApplicantCourse[];
}

interface ProgramsState {
  selectedCohort: Cohort | null;
  selectedProgram: Program | null;
  currentApplicant: CurrentApplicant | null;
  setSelectedCohort: (cohort: Cohort, program: Program) => void;
  clearSelection: () => void;
  getSelectedCohort: () => Cohort | null;
  getSelectedProgram: () => Program | null;
  setCurrentApplicant: (applicant: CurrentApplicant | null) => void;
}

export const useProgramsStore = create<ProgramsState>()(
  persist(
    (set, get) => ({
      selectedCohort: null,
      selectedProgram: null,
      currentApplicant: null,
      setSelectedCohort: (cohort, program) =>
        set({
          selectedCohort: cohort,
          selectedProgram: program,
        }),
      clearSelection: () =>
        set({
          selectedCohort: null,
          selectedProgram: null,
          currentApplicant: null,
        }),
      getSelectedCohort: () => get().selectedCohort,
      getSelectedProgram: () => get().selectedProgram,
      setCurrentApplicant: (applicant) => set({ currentApplicant: applicant }),
    }),
    {
      name: "programs-storage",
    }
  )
);
