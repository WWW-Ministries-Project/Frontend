import { useSomAccess } from "../../utils/useSomAccess";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { cn } from "@/utils/cn";
import { useSearchParams } from "react-router-dom";
import { EmptyBlock, PageHeader } from "../ui";
import { QuestionBank } from "./QuestionBank";
import { Rubrics } from "./Rubrics";

const TABS = ["Question bank", "Rubrics"] as const;

/** Shared assessment content reused across programs. */
export const AssessmentLibraryPage = () => {
  // The bank and rubrics are shared by every program: whole-school designers only.
  const canManageLibrary = useSomAccess().canAll("design_curriculum");
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "Rubrics" ? "Rubrics" : "Question bank";

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Assessment library"
          subtitle="Questions and rubrics shared across every program. Build quizzes from the bank and grade essays with rubrics."
        />
        <div role="tablist" className="flex gap-1 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setParams({ tab: t }, { replace: true })}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm",
                tab === t ? "border-primary font-semibold text-primary" : "border-transparent text-primaryGray hover:text-primary"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {!canManageLibrary ? (
          <EmptyBlock msg="The assessment library is available to instructors and School of Ministry managers." />
        ) : tab === "Question bank" ? (
          <QuestionBank canManage={canManageLibrary} />
        ) : (
          <Rubrics canManage={canManageLibrary} />
        )}
      </div>
    </PageOutline>
  );
};

export default AssessmentLibraryPage;
