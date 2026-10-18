import ProgramApply from "@/pages/HomePage/pages/MinistrySchool/pages/ProgramApply";
import { PageHeader } from "@/pages/HomePage/pages/MinistrySchool/lms/ui";

const AllPrograms = () => (
  <div className="flex flex-col gap-5">
    <PageHeader
      title="Browse programs"
      subtitle="Programs open for enrolment. Eligible applicants are enrolled automatically; others go to the School of Ministry office for review."
    />
    <ProgramApply />
  </div>
);

export default AllPrograms;
