import type { SomNav } from "@/pages/HomePage/pages/MinistrySchool/lms/somUtils";
import { relativePath } from "@/utils/const";

const SOM = relativePath.member.schoolOfMinistries;
const abs = (path: string) => `${relativePath.member.main}/${path}`;

/** Absolute member-portal paths for the School of Ministry learner area. */
export const learnerPaths = {
  dashboard: abs(SOM.main),
  myPrograms: abs(SOM.myEnrolledPrograms),
  program: (programId: number | string) => `${abs(SOM.myEnrolledPrograms)}/${programId}`,
  assignments: abs(SOM.assignments),
  assignment: (topicId: number | string) => `${abs(SOM.assignments)}/${topicId}`,
  grades: abs(SOM.grades),
  schedule: abs(SOM.schedule),
  announcements: abs(SOM.announcements),
  browse: abs(SOM.allPrograms),
  programDetails: (programId: number | string) =>
    abs(SOM.programDetailsPublic.replace(":programId", String(programId))),
  instructorPortal: abs(SOM.instructorPortal),
};

/**
 * Member-portal navigation for the reused School of Ministry teaching pages
 * (CohortsPage teaching view + ClassWorkspace). Keeps the instructor's "My
 * classes" and class workspace inside the member top-nav shell. `program` is
 * omitted so the shared list hides its "View program" link (the member portal
 * has no instructor program page).
 */
export const memberSomNav: SomNav = {
  cohorts: learnerPaths.instructorPortal,
  cohort: () => learnerPaths.instructorPortal,
  class: (cohortId, classId) =>
    `${learnerPaths.instructorPortal}/class/${cohortId}/${classId}`,
};

/** The learner menu, shared by the desktop dropdown and the mobile accordion. */
export const learnerMenu = (isInstructor: boolean) => [
  { label: "Dashboard", path: learnerPaths.dashboard },
  { label: "My programs", path: learnerPaths.myPrograms },
  { label: "Assignments", path: learnerPaths.assignments },
  { label: "Grades", path: learnerPaths.grades },
  { label: "Schedule", path: learnerPaths.schedule },
  { label: "Announcements", path: learnerPaths.announcements },
  { label: "Browse programs", path: learnerPaths.browse },
  ...(isInstructor ? [{ label: "Instructor portal", path: learnerPaths.instructorPortal }] : []),
];

/**
 * Menu paths nest ("Browse programs" is a prefix of "My programs", the
 * dashboard is a prefix of everything), so the active item is the longest
 * path the current location falls under.
 */
export const activeMenuPath = (pathname: string, paths: string[]) =>
  paths
    .filter((p) => pathname === p || pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0] ?? null;
