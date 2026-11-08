import { cn } from "@/utils/cn";
import { Btn } from "./ui";

interface ProgramSetupChecklistProps {
  moduleCount: number;
  unitCount: number;
  cohortCount: number;
  classCount: number;
  /** Collapsed to a one-line "Resume setup" bar. */
  collapsed: boolean;
  canDesign: boolean;
  canManageCohorts: boolean;
  isDraft: boolean;
  onToggleCollapsed: () => void;
  onGoCurriculum: () => void;
  onGoCohorts: () => void;
  onCreateCohort: () => void;
  onAddClass: () => void;
  onPublish: () => void;
  onOpenCohort: () => void;
  onFinish: () => void;
}

/**
 * Guided three-step setup shown on a freshly created program: build the
 * curriculum, create the first cohort, then its first class. Steps tick off from
 * the program's real data and can be reopened; "Skip for now" collapses it to a
 * resume bar that stays until the program is ready.
 */
export const ProgramSetupChecklist = ({
  moduleCount,
  unitCount,
  cohortCount,
  classCount,
  collapsed,
  canDesign,
  canManageCohorts,
  isDraft,
  onToggleCollapsed,
  onGoCurriculum,
  onGoCohorts,
  onCreateCohort,
  onAddClass,
  onPublish,
  onOpenCohort,
  onFinish,
}: ProgramSetupChecklistProps) => {
  const curriculumDone = moduleCount > 0 || unitCount > 0;
  const cohortDone = cohortCount > 0;
  const classDone = classCount > 0;
  const doneCount = [curriculumDone, cohortDone, classDone].filter(Boolean).length;
  const ready = doneCount === 3;

  const steps = [
    {
      n: 1,
      label: "Curriculum",
      sub: curriculumDone
        ? `${moduleCount} module${moduleCount === 1 ? "" : "s"} · ${unitCount} unit${unitCount === 1 ? "" : "s"}`
        : "Add at least one module and unit",
      done: curriculumDone,
      onClick: onGoCurriculum,
    },
    {
      n: 2,
      label: "First cohort",
      sub: cohortDone
        ? `${cohortCount} cohort${cohortCount === 1 ? "" : "s"} created`
        : "Create the first intake",
      done: cohortDone,
      onClick: onGoCohorts,
    },
    {
      n: 3,
      label: "First class",
      sub: classDone
        ? `${classCount} class${classCount === 1 ? "" : "es"} added`
        : "Split the cohort into a class",
      done: classDone,
      onClick: onGoCohorts,
    },
  ];

  if (collapsed && !ready) {
    return (
      <div className="app-page-padding pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-2.5">
          <p className="text-sm font-medium text-primary">
            Setup: {doneCount} of 3 steps done
          </p>
          <Btn size="sm" onClick={onToggleCollapsed}>
            Resume setup
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-padding pt-4">
      <section
        aria-label="Program setup"
        className="flex flex-col gap-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold text-primary">
              {ready ? "Program is ready" : "Finish setting up this program"}
            </h2>
            <p className="text-sm text-primaryGray">
              {ready
                ? "Curriculum, cohort and class are in place. Publish it or open the cohort to enroll learners."
                : "Three quick steps and this program is ready to open for enrollment."}
            </p>
          </div>
          {!ready && (
            <Btn variant="ghost" size="sm" onClick={onToggleCollapsed}>
              Skip for now
            </Btn>
          )}
        </div>

        <ol className="grid gap-2 sm:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n}>
              <button
                type="button"
                onClick={step.onClick}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border bg-white px-3 py-2.5 text-left transition-colors hover:border-indigo-300",
                  step.done ? "border-green-200" : "border-gray-200"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    step.done ? "bg-green-600 text-white" : "bg-gray-100 text-primaryGray"
                  )}
                  aria-hidden="true"
                >
                  {step.done ? "✓" : step.n}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">{step.label}</span>
                  <span className="text-xs text-mainGray">{step.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-2">
          {ready ? (
            <>
              {isDraft && canDesign && (
                <Btn variant="primary" onClick={onPublish}>
                  Publish program
                </Btn>
              )}
              <Btn variant={isDraft && canDesign ? "secondary" : "primary"} onClick={onOpenCohort}>
                Open cohort
              </Btn>
              <Btn variant="ghost" onClick={onFinish}>
                Finish setup
              </Btn>
            </>
          ) : !cohortDone ? (
            <>
              {canManageCohorts && (
                <Btn variant="primary" onClick={onCreateCohort} disabled={!curriculumDone}>
                  {curriculumDone ? "Create first cohort" : "Continue: create first cohort"}
                </Btn>
              )}
              {!curriculumDone && (
                <span className="text-xs text-mainGray">Add at least one module to continue.</span>
              )}
            </>
          ) : (
            canManageCohorts && (
              <Btn variant="primary" onClick={onAddClass}>
                Add first class
              </Btn>
            )
          )}
        </div>
      </section>
    </div>
  );
};
