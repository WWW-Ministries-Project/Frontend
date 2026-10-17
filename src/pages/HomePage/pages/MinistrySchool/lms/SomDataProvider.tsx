import { useFetch } from "@/CustomHooks/useFetch";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import { normalizeCohortStatus, type SomProgramFull } from "@/utils/api/ministrySchool/interfaces";
import { ReactNode, useMemo } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import {
  SomDataContext,
  type CohortRow,
  type EnrollmentRow,
  type InstructorRow,
  type LearnerRow,
  type SomData,
} from "./somDataContext";
import { cohortTiming, learnerHealth, personName } from "./somUtils";

const buildSomData = (programs: SomProgramFull[]) => {
  const cohorts: CohortRow[] = [];
  const enrollments: EnrollmentRow[] = [];
  const learners: LearnerRow[] = [];
  const instructorMap = new Map<number, InstructorRow>();

  programs.forEach((program) => {
    const programRef = { id: program.id, title: program.title };

    program.cohorts.forEach((cohort) => {
      const timing = cohortTiming(cohort);
      const row: CohortRow = {
        ...cohort,
        status: normalizeCohortStatus(cohort.status) ?? cohort.status,
        program: programRef,
        timing,
        learnerCount: 0,
        attentionCount: 0,
      };

      cohort.courses.forEach((cls) => {
        cls.enrollments.forEach((enrollment) => {
          const health = learnerHealth(enrollment, timing);
          row.learnerCount += 1;
          if (health === "Behind" || health === "Not started") row.attentionCount += 1;
          enrollments.push({
            ...enrollment,
            name: personName(enrollment.user),
            program: programRef,
            cohort: row,
            cls,
            health,
          });
        });
      });

      cohorts.push(row);
    });

    program.instructors.forEach((instructor) => {
      const classes = program.cohorts.flatMap((c) =>
        c.courses.filter((cls) => cls.instructor?.id === instructor.id)
      );
      const existing = instructorMap.get(instructor.id);
      const learnerCount = classes.reduce((sum, cls) => sum + cls.enrollments.length, 0);
      const formats = classes.map((cls) => cls.classFormat).filter(Boolean) as string[];
      if (existing) {
        existing.courses.push(...instructor.courses);
        existing.learnerCount += learnerCount;
        if (!existing.programs.includes(program.title)) existing.programs.push(program.title);
        formats.forEach((f) => !existing.formats.includes(f) && existing.formats.push(f));
      } else {
        instructorMap.set(instructor.id, {
          ...instructor,
          courses: [...instructor.courses],
          displayName: personName(instructor),
          programs: [program.title],
          learnerCount,
          formats: Array.from(new Set(formats)),
        });
      }
    });

    program.enrolled_members.forEach((member) =>
      learners.push({ ...member, program: programRef })
    );
  });

  return {
    cohorts,
    enrollments,
    learners,
    instructors: Array.from(instructorMap.values()),
  };
};

/**
 * Fetches `program/programs-full-details` once for every School of Ministry page
 * and derives the cohort / learner / instructor views from it. Renders the
 * parent outlet context through so existing child pages keep working.
 */
export const SomDataProvider = ({ children }: { children?: ReactNode }) => {
  const parentContext = useOutletContext();
  const { activeBranchId } = useBranchStore();
  const { data, loading, error, refetch } = useFetch(api.fetch.fetchProgramsFullDetails);

  const value = useMemo<SomData>(() => {
    const all = data?.data ?? [];
    // The endpoint is not branch-scoped; mirror the backend's strict branch_id match.
    const programs =
      activeBranchId === ALL_BRANCHES
        ? all
        : all.filter((p) => String(p.branch_id) === String(activeBranchId));
    return {
      loading,
      error: error ? "Could not load School of Ministry data." : null,
      refetch: () => void refetch(),
      programs,
      ...buildSomData(programs),
    };
  }, [data, loading, error, refetch, activeBranchId]);

  return (
    <SomDataContext.Provider value={value}>
      {children ?? <Outlet context={parentContext} />}
    </SomDataContext.Provider>
  );
};
