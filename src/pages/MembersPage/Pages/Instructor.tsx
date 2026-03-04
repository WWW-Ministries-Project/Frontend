import { Outlet, useLocation } from "react-router-dom";
import BannerWrapper from "../layouts/BannerWrapper";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { HeaderControls } from "@/components/HeaderControls";
import { relativePath } from "@/utils";
import { useMemo } from "react";

interface InstructorProps {
  isAdmin?: boolean;
}

const Instructor = ({ isAdmin = false }: InstructorProps) => {
  const location = useLocation();

  const adminCrumbs = useMemo(() => {
    const schoolPath = `${relativePath.home.main}/${relativePath.home.ministrySchool.main}`;
    const instructorBasePath = `${schoolPath}/${relativePath.home.ministrySchool.instructorPortal}`;
    const pathParts = location.pathname
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean);

    const programId = pathParts[3];
    const cohortSegment = pathParts[4];
    const cohortId = pathParts[5];
    const gradesSegment = pathParts[6];
    const topicId = pathParts[7];

    const crumbs: Array<{ label: string; link?: string }> = [
      { label: "Home", link: relativePath.home.main },
      { label: "School of Ministry", link: schoolPath },
      { label: "Instructor Portal", link: instructorBasePath },
    ];

    if (programId && cohortSegment === "cohort") {
      const cohortListPath = `${instructorBasePath}/${programId}/cohort`;
      crumbs.push({ label: `Program ${programId}`, link: cohortListPath });

      if (!cohortId) {
        crumbs.push({ label: "Cohorts", link: "" });
        return crumbs;
      }

      const assignmentPath = `${cohortListPath}/${cohortId}`;
      crumbs.push({ label: `Cohort ${cohortId}`, link: assignmentPath });

      if (gradesSegment === "grades" && topicId) {
        crumbs.push({ label: `Topic ${topicId} Grades`, link: "" });
      } else {
        crumbs.push({ label: "Assignments", link: "" });
      }

      return crumbs;
    }

    crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1], link: "" };
    return crumbs;
  }, [location.pathname]);

  if (isAdmin) {
    return (
      <PageOutline crumbs={adminCrumbs}>
        <HeaderControls
          title="Instructor Portal"
          subtitle="Overview of programs you are instructing."
          showSearch={false}
          showFilter={false}
          hasSearch={false}
          hasFilter={false}
          requireManageAccess={false}
        />
        <Outlet />
      </PageOutline>
    );
  }

  return (
    <div>
      <div className="pb-4">
        <BannerWrapper>
          <div className="space-y-4 w-full">
            <div className="font-bold text-3xl">Instructor Portal</div>
            <div>Overview of programs you are instructing.</div>
          </div>
        </BannerWrapper>
      </div>

      <div>
        <Outlet />
      </div>
    </div>
  );
};
 
export default Instructor;
