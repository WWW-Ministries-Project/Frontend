import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { useMemo, useState } from "react";
import { COHORT_STATUS } from "@/utils/api/ministrySchool/interfaces";
import { useSomAccess } from "../utils/useSomAccess";
import { CohortGradebook } from "./assessment/CohortGradebook";
import { useSomData } from "./somDataContext";
import { EmptyBlock, LoadError, PageHeader } from "./ui";

/**
 * Standalone gradebook: pick a cohort, then grade with the same matrix used
 * inside the cohort workspace. Ongoing cohorts lead the list.
 */
export const GradebookPage = () => {
  const { cohorts, loading, error, refetch } = useSomData();
  const access = useSomAccess();
  const canManage = access.can("grade");

  const ordered = useMemo(() => {
    const rank = (s: string) =>
      s === COHORT_STATUS.ONGOING ? 0 : s === COHORT_STATUS.UPCOMING ? 1 : 2;
    return [...cohorts].sort(
      (a, b) => rank(a.timing.status) - rank(b.timing.status) || a.name.localeCompare(b.name)
    );
  }, [cohorts]);

  const [cohortId, setCohortId] = useState<number | null>(null);
  const selected = ordered.find((c) => c.id === cohortId) ?? ordered[0] ?? null;

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        {error && <LoadError msg={error} onRetry={refetch} />}
        <PageHeader
          title="Gradebook"
          subtitle="Grade any cohort from one place. Each cohort keeps its own matrix, release state and export."
          actions={
            ordered.length > 0 && (
              <select
                aria-label="Cohort"
                value={selected?.id ?? ""}
                onChange={(e) => setCohortId(Number(e.target.value))}
                className="h-10 rounded-lg border border-lightGray bg-white px-3 text-sm text-primary"
              >
                {ordered.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.program.title} · {c.name} ({c.timing.label})
                  </option>
                ))}
              </select>
            )
          }
        />

        {!loading && ordered.length === 0 ? (
          <EmptyBlock msg="No cohorts yet. Create a cohort to start grading." />
        ) : selected ? (
          <CohortGradebook
            key={selected.id}
            cohortId={selected.id}
            programId={selected.program.id}
            classes={selected.courses}
            canManage={canManage}
          />
        ) : null}
      </div>
    </PageOutline>
  );
};

export default GradebookPage;
