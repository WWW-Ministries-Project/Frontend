import { Outlet, useLocation } from "react-router-dom";
import { ViewPageProvider } from "../customHooks/ViewPageContext";
import { useViewPage } from "../customHooks/useViewPage";
import { useSomData } from "../lms/somDataContext";
import { somPaths } from "../lms/somUtils";
import { WorkspaceHeader, type Crumb } from "../lms/ui";

const segmentAfter = (segments: string[], key: string) => {
  const i = segments.indexOf(key);
  return i >= 0 ? segments[i + 1] : undefined;
};

/**
 * Shell for the deep School of Ministry pages (class roster, learner progress,
 * topic). Child pages publish their title and summary through `useViewPage`.
 */
const ViewPageTemplateInner = () => {
  const { loading, data, details } = useViewPage();
  const { pathname } = useLocation();
  const som = useSomData();

  const segments = pathname.split("/").filter(Boolean);
  const cohortId = Number(segmentAfter(segments, "cohorts"));
  const classId = Number(segmentAfter(segments, "classes"));
  const programId = Number(segmentAfter(segments, "programs"));
  const onStudent = segments.includes("student");

  const cohort = som.cohorts.find((c) => c.id === cohortId);
  const cls = cohort?.courses.find((k) => k.id === classId);
  const program = som.programs.find((p) => p.id === (cohort?.program.id ?? programId));

  const crumbs: Crumb[] = [];
  if (cohortId) {
    crumbs.push({ label: "Cohorts", to: somPaths.cohorts });
    if (program) crumbs.push({ label: program.title, to: somPaths.program(program.id, "Cohorts") });
    crumbs.push({ label: cohort?.name ?? `Cohort ${cohortId}`, to: somPaths.cohort(cohortId) });
    if (classId) {
      crumbs.push({
        label: cls?.name ?? `Class ${classId}`,
        to: onStudent ? somPaths.class(cohortId, classId) : undefined,
      });
    }
  } else {
    crumbs.push({ label: "Programs", to: somPaths.programs });
    if (program) crumbs.push({ label: program.title, to: somPaths.program(program.id, "Curriculum") });
  }
  if (onStudent) crumbs.push({ label: "Learner" });

  const title = data?.title || data?.user?.name || (loading ? "Loading…" : "");

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        crumbs={crumbs}
        title={title}
        meta={data?.description ? [String(data.description)] : undefined}
        extra={details ? <div className="pb-4">{details}</div> : null}
      />
      <div className="app-page-padding">
        <Outlet />
      </div>
    </div>
  );
};

const ViewPageTemplate = () => (
  <ViewPageProvider>
    <ViewPageTemplateInner />
  </ViewPageProvider>
);

export default ViewPageTemplate;
