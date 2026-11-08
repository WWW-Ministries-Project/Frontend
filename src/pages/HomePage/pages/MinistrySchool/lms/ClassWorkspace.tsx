import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useSomAccess } from "../utils/useSomAccess";
import { CohortGradebook } from "./assessment/CohortGradebook";
import { CohortAssessments, CohortRoster } from "./CohortWorkspace";
import { useSomData } from "./somDataContext";
import { adminSomNav, formatLabel, needsAttention, personName, type SomNav } from "./somUtils";
import { CohortSessions } from "./teaching/CohortSessions";
import { Btn, EmptyBlock, LoadError, WorkspaceHeader } from "./ui";

const TABS = ["Gradebook", "Assessments", "Roster", "Sessions & attendance"] as const;
type Tab = (typeof TABS)[number];

/**
 * A single class, scoped to the instructor who teaches it: the gradebook,
 * roster and sessions for that one class. Opened from "My classes" and the
 * cohort's Classes tab; mirrors the prototype's class view.
 */
export const ClassWorkspace = ({ nav = adminSomNav }: { nav?: SomNav } = {}) => {
  const { cohortId: cohortParam, id: classParam } = useParams();
  const cohortId = Number(cohortParam);
  const classId = Number(classParam);
  const [params, setParams] = useSearchParams();
  const access = useSomAccess();
  const som = useSomData();

  const cohort = som.cohorts.find((c) => c.id === cohortId);
  const cls = cohort?.courses.find((k) => k.id === classId);
  const roster = useMemo(
    () => som.enrollments.filter((e) => e.cohort.id === cohortId && e.cls.id === classId),
    [som.enrollments, cohortId, classId]
  );
  const atRisk = useMemo(() => roster.filter((e) => needsAttention(e.health)).length, [roster]);

  const tabParam = params.get("tab") as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : "Gradebook";
  const setTab = (t: string) => {
    params.set("tab", t);
    setParams(params, { replace: true });
  };

  if (!cohort || !cls) {
    if (som.loading) return <SkeletonLoader />;
    return (
      <div className="app-page-padding">
        {som.error ? (
          <LoadError msg={som.error} onRetry={som.refetch} />
        ) : (
          <EmptyBlock msg="Class not found." action={<Btn to={nav.cohorts}>Back to my classes</Btn>} />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        crumbs={[
          { label: "My classes", to: nav.cohorts },
          { label: cohort.program.title, to: nav.program?.(cohort.program.id, "Cohorts") },
          { label: cohort.name, to: nav.cohort(cohort.id) || undefined },
          { label: cls.name },
        ]}
        title={cls.name}
        status={formatLabel(cls.classFormat)}
        meta={[
          cohort.program.title,
          cohort.name,
          personName(cls.instructor),
          cls.schedule || "No schedule set",
          `${roster.length}/${cls.capacity} seats`,
          `${atRisk} at risk`,
        ]}
        tabs={[...TABS]}
        activeTab={tab}
        onTab={setTab}
      />

      <div className="app-page-padding flex flex-col gap-4">
        {som.error && <LoadError msg={som.error} onRetry={som.refetch} />}

        {tab === "Gradebook" && (
          <CohortGradebook
            cohortId={cohort.id}
            programId={cohort.program.id}
            classes={[cls]}
            lockClassId={String(cls.id)}
            canManage={access.can("grade")}
          />
        )}

        {tab === "Assessments" && (
          <CohortAssessments
            cohortId={cohort.id}
            programId={cohort.program.id}
            canManage={access.can("manage_assignments")}
            showGrade={false}
            showCurriculumLink={false}
          />
        )}

        {tab === "Roster" && <CohortRoster roster={roster} />}

        {tab === "Sessions & attendance" && (
          <CohortSessions
            cohortId={cohort.id}
            programId={cohort.program.id}
            classes={[cls]}
            lockClassId={String(cls.id)}
            canManage={access.can("take_attendance")}
          />
        )}
      </div>
    </div>
  );
};

export default ClassWorkspace;
