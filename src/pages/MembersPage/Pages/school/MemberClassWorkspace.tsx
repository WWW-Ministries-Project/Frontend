import { ClassWorkspace } from "@/pages/HomePage/pages/MinistrySchool/lms/ClassWorkspace";
import { memberSomNav } from "./learnerPaths";

/**
 * A single class in the member portal's instructor area: the same gradebook,
 * roster and sessions as the admin shell, with breadcrumbs and back links kept
 * inside the member top-nav shell.
 */
const MemberClassWorkspace = () => <ClassWorkspace nav={memberSomNav} />;

export default MemberClassWorkspace;
