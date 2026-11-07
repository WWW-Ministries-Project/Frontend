import { CohortsPage } from "@/pages/HomePage/pages/MinistrySchool/lms/CohortsPage";
import { memberSomNav } from "./learnerPaths";

/**
 * "My classes" for the member portal's instructor area. Reuses the admin
 * School of Ministry teaching list, forced into the teaching cut and pointed at
 * the member-portal routes so an instructor never leaves the member top-nav
 * shell.
 */
const MemberMyClasses = () => <CohortsPage nav={memberSomNav} forceTeaching />;

export default MemberMyClasses;
