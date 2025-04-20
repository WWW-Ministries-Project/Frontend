// programsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Cohort {
  id: number;
  name: string;
  startDate: string;
  duration?: string;
  status: string;
  classes?: number;
  enrolledCount?: number;
}

interface Program {
  id: number;
  title: string;
  description: string;
  eligibility: "Members" | "Non_Members" | "Both";
  topics: { name: string; id: string }[];
  cohorts: Cohort[];
}

interface ProgramsState {
  selectedCohort: Cohort | null;
  selectedProgram: Program | null;
  currentApplicant: any | null;
  setSelectedCohort: (cohort: Cohort, program: Program) => void;
  clearSelection: () => void;
  getSelectedCohort: () => Cohort | null;
  getSelectedProgram: () => Program | null;
  setCurrentApplicant: (applicant: any) => void;
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
          selectedProgram: program 
        }),
      
      clearSelection: () => set({ 
        selectedCohort: null, 
        selectedProgram: null,
        currentApplicant: null
      }),
      
      getSelectedCohort: () => get().selectedCohort,
      
      getSelectedProgram: () => get().selectedProgram,

      setCurrentApplicant: (applicant) => set({ currentApplicant: applicant })
    }),
    
    {
      name: 'programs-storage', // unique name for localStorage key
      // Optional: you can serialize/deserialize if needed
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => JSON.parse(str),
    }
  )
);