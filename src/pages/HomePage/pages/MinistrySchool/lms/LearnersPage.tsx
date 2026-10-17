import PageOutline from "@/pages/HomePage/Components/PageOutline";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { ReviewQueue } from "./people/ReviewQueue";
import { useSomData, type EnrollmentRow } from "./somDataContext";
import { ATTENTION_RULE, fmtDate, needsAttention, somPaths } from "./somUtils";
import { Avatar, EmptyBlock, PageHeader, Panel, ProgressBar, SimpleTable, StatusPill, LoadError } from "./ui";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "progress", label: "In progress" },
  { key: "completed", label: "Completed" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const matches = (e: EnrollmentRow, f: FilterKey) => {
  if (f === "attention") return needsAttention(e.health);
  if (f === "completed") return e.completion_status === "COMPLETED";
  if (f === "progress") return e.completion_status !== "COMPLETED";
  return true;
};

export const LearnersPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { loading, programs, enrollments, error, refetch } = useSomData();
  const { canManageCurrentRoute } = useRouteAccess();
  const [search, setSearch] = useState("");

  const filterParam = params.get("filter") as FilterKey | null;
  const filter: FilterKey = FILTERS.some((f) => f.key === filterParam) ? (filterParam as FilterKey) : "all";
  const programFilter = params.get("program") ?? "";

  const setParam = (key: string, value: string) => {
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    setParams(params, { replace: true });
  };

  const scoped = useMemo(
    () => enrollments.filter((e) => !programFilter || String(e.program.id) === programFilter),
    [enrollments, programFilter]
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped
      .filter((e) => matches(e, filter))
      .filter(
        (e) =>
          !q ||
          e.name.toLowerCase().includes(q) ||
          (e.user?.email ?? "").toLowerCase().includes(q) ||
          (e.user?.member_id ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [scoped, filter, search]);

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        {error && <LoadError msg={error} onRetry={refetch} />}
        <PageHeader
          title="Learners"
          subtitle="Eligible applicants are enrolled automatically. Review the ones the rules held back."
        />

        <ReviewQueue canManage={canManageCurrentRoute} programFilter={programFilter || undefined} onDecided={refetch} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setParam("filter", f.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  filter === f.key
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 text-primaryGray hover:bg-gray-50"
                )}
              >
                {f.label}
                <span className="ml-1.5 text-xs opacity-75">{scoped.filter((e) => matches(e, f.key)).length}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <select
              aria-label="Program"
              value={programFilter}
              onChange={(e) => setParam("program", e.target.value)}
              className="h-9 rounded-lg border border-lightGray bg-white px-2 text-sm text-primary"
            >
              <option value="">All programs</option>
              {programs.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.title}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search name, email or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 rounded-lg border border-lightGray bg-white px-3 text-sm"
            />
          </div>
        </div>

        {loading && !enrollments.length ? (
          <SkeletonLoader />
        ) : (
          <Panel>
            <SimpleTable<EnrollmentRow>
              rows={rows}
              rowKey={(e) => e.id}
              onRowClick={(e) => navigate(somPaths.student(e.cohort.id, e.cls.id, e.id))}
              minWidth={820}
              empty={<EmptyBlock msg="No learners match these filters." />}
              columns={[
                {
                  key: "n",
                  header: "Learner",
                  render: (e) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={e.name} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.name}</p>
                        <p className="truncate text-xs text-mainGray">{e.user?.email ?? e.user?.member_id ?? ""}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "p",
                  header: "Program · cohort",
                  render: (e) => (
                    <div className="min-w-0">
                      <p className="truncate">{e.program.title}</p>
                      <p className="truncate text-xs text-mainGray">
                        {e.cohort.name} · {e.cls.name}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "pr",
                  header: "Progress",
                  render: (e) => (
                    <div className="flex w-40 items-center gap-2">
                      <ProgressBar value={e.completion_percent} />
                      <span className="w-10 text-right text-xs tabular-nums text-primaryGray">
                        {Math.round(e.completion_percent)}%
                      </span>
                    </div>
                  ),
                },
                { key: "d", header: "Enrolled", render: (e) => <span className="text-primaryGray">{fmtDate(e.enrolledAt)}</span> },
                { key: "s", header: "Status", render: (e) => <StatusPill status={e.health} /> },
              ]}
            />
            <p className="border-t border-gray-100 px-4 py-2 text-xs text-mainGray">{ATTENTION_RULE}</p>
          </Panel>
        )}
      </div>
    </PageOutline>
  );
};

export default LearnersPage;
