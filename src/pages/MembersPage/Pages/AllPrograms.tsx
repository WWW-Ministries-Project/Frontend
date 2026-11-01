import ProgramApply from "@/pages/HomePage/pages/MinistrySchool/pages/ProgramApply";
import { PageHeader } from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import { LearnerShell } from "./school/LearnerShell";

const AllPrograms = () => (
  <LearnerShell>
    <PageHeader
      title="Browse programs"
      subtitle="Programs open for enrolment. Eligible applicants are enrolled automatically; others go to the School of Ministry office for review."
    />
    <ProgramApply />
  </LearnerShell>
);

export default AllPrograms;
