import { useAuth } from "@/context/AuthWrapper";
import { InstructorDashboard } from "@/pages/HomePage/pages/MinistrySchool/lms/InstructorDashboard";
import { useSomData } from "@/pages/HomePage/pages/MinistrySchool/lms/somDataContext";
import { isMyClass, type SomNav } from "@/pages/HomePage/pages/MinistrySchool/lms/somUtils";
import { useMemo } from "react";
import { learnerPaths, memberSomNav } from "./learnerPaths";

/**
 * "Teaching dashboard" for the member portal: the same instructor overview the
 * admin shell shows, with every link resolved to the member portal. The member
 * portal is class-scoped, so a cohort link opens the single class the instructor
 * teaches in that cohort (with the relevant tab), and there is no separate
 * learner page — those links open the class roster instead.
 */
const MemberTeachingDashboard = () => {
  const { cohorts } = useSomData();
  const myId = Number(useAuth().user.id);

  const nav = useMemo<SomNav>(() => {
    const classHref = (cohortId: number | string, tab?: string) => {
      const cohort = cohorts.find((c) => c.id === Number(cohortId));
      const cls = cohort?.courses.find((k) => isMyClass(k, myId));
      if (!cls) return learnerPaths.instructorPortal;
      const base = memberSomNav.class(cohortId, cls.id);
      return tab ? `${base}?tab=${encodeURIComponent(tab)}` : base;
    };
    return {
      ...memberSomNav,
      cohort: (id, tab) => classHref(id, tab),
      student: (cohortId, classId) =>
        `${memberSomNav.class(cohortId, classId)}?tab=Roster`,
      // `learners` omitted → the "View all" learners link is hidden.
    };
  }, [cohorts, myId]);

  return <InstructorDashboard nav={nav} />;
};

export default MemberTeachingDashboard;
