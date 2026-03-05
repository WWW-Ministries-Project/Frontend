import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { relativePath } from "@/utils";
import { Outlet, useLocation } from "react-router-dom";
import { ViewPageProvider } from "../customHooks/ViewPageContext";
import { useViewPage } from "../customHooks/useViewPage";
import { Banner } from "../../Members/Components/Banner";
import { useMemo } from "react";
import { isLmsFeatureEnabled } from "../utils/lmsGuardrails";

type ContextChip = {
  label: string;
  value: string;
};

const trimSegment = (pathSegment: string) => pathSegment.split("/:")[0];

const getSegmentValue = (segments: string[], segment: string): string | undefined => {
  const index = segments.indexOf(segment);
  if (index < 0) return undefined;
  return segments[index + 1];
};

const ViewPageTemplateInner = () => {
  const { loading, data, details } = useViewPage();
  const location = useLocation();
  const enhancedContextEnabled = isLmsFeatureEnabled("deep_navigation_context");
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const classSegment = trimSegment(relativePath.home.ministrySchool.class);
  const studentSegment = trimSegment(relativePath.home.ministrySchool.student);
  const onDeepLearningPage =
    pathSegments.includes(classSegment) || pathSegments.includes(studentSegment);

  const {
    chips,
    chipsForDeepView,
  }: {
    chips: ContextChip[];
    chipsForDeepView: ContextChip[];
  } = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const programSegment = relativePath.home.ministrySchool.program;
    const cohortSegment = trimSegment(relativePath.home.ministrySchool.cohort);
    const classSegment = trimSegment(relativePath.home.ministrySchool.class);
    const studentSegment = trimSegment(relativePath.home.ministrySchool.student);

    const programId = getSegmentValue(segments, programSegment);
    const cohortId = getSegmentValue(segments, cohortSegment);
    const classId = getSegmentValue(segments, classSegment);
    const studentId = getSegmentValue(segments, studentSegment);

    const computedChips: ContextChip[] = [
      programId ? { label: "Program", value: `#${programId}` } : null,
      cohortId ? { label: "Cohort", value: `#${cohortId}` } : null,
      classId ? { label: "Class", value: `#${classId}` } : null,
      studentId ? { label: "Student", value: `#${studentId}` } : null,
      data?.topics?.length
        ? { label: "Topics", value: `${data.topics.length}` }
        : null,
      data?.user?.email ? { label: "Email", value: data.user.email } : null,
    ].filter((chip): chip is ContextChip => Boolean(chip));

    const compactChips = computedChips.slice(0, 4);

    return { chips: computedChips, chipsForDeepView: compactChips };
  }, [data?.topics, data?.user?.email, location.pathname]);
  const visibleChips = onDeepLearningPage ? chipsForDeepView : chips;

  return (
    <div>
      <section className="sticky top-0 z-20">
        <Banner size={onDeepLearningPage ? "compact" : "default"}>
          <div className={`w-full ${onDeepLearningPage ? "space-y-2" : "space-y-4"}`}>
            <div>
              <div className="flex items-center justify-between">
                {loading ? (
                  <div className="flex w-[40rem] animate-pulse justify-between">
                    <div className="h-6 w-3/5 rounded bg-lightGray" />
                    <div className="h-4 w-1/6 rounded bg-lightGray" />
                  </div>
                ) : (
                  <h1
                    className={`font-bold text-white ${
                      onDeepLearningPage ? "text-xl md:text-2xl" : "text-2xl"
                    }`}
                  >
                    {data?.title || data?.user?.name}
                  </h1>
                )}
              </div>

              {!loading && data?.description && (
                <div className={`text-sm ${onDeepLearningPage ? "line-clamp-2" : ""}`}>
                  <p>{data.description}</p>
                </div>
              )}
            </div>

            {loading && details ? (
              <div className="space-y-2 animate-pulse">
                <div className="flex gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <div className="h-4 w-20 rounded bg-lightGray" />
                      <div className="h-4 w-28 rounded bg-lightGray" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={onDeepLearningPage ? "space-y-2" : "space-y-3"}>
                {enhancedContextEnabled &&
                  visibleChips.length ? (
                  <div className="flex flex-wrap gap-2">
                    {visibleChips.map((chip) => (
                      <span
                        key={`${chip.label}-${chip.value}`}
                        className={`inline-flex items-center rounded-full border border-white/40 bg-white/10 font-medium text-white ${
                          onDeepLearningPage ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
                        }`}
                      >
                        {chip.label}: {chip.value}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div>{details}</div>
              </div>
            )}
          </div>
        </Banner>
      </section>
      <PageOutline className="p-0">
      

      <section>
        <div className="">
          <Outlet />
        </div>
      </section>
    </PageOutline>
    </div>
  );
};

const ViewPageTemplate = () => (
  <ViewPageProvider>
    <ViewPageTemplateInner />
  </ViewPageProvider>
);

export default ViewPageTemplate;
