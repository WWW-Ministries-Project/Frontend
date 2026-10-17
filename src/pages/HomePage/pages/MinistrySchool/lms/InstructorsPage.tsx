import { useRouteAccess } from "@/context/RouteAccessContext";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { api } from "@/utils";
import type { InstructorOverview } from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSomData, type InstructorRow } from "./somDataContext";
import { formatLabel, somPaths } from "./somUtils";
import { Avatar, Btn, EmptyBlock, LoadError, PageHeader, Panel, Pill, SimpleTable, StatusPill } from "./ui";

const formatHours = (hours: number | null) => {
  if (hours === null) return "—";
  return hours < 48 ? `${hours.toFixed(1)} h` : `${(hours / 24).toFixed(1)} days`;
};

const PersonCell = ({ name, email }: { name: string; email?: string | null }) => (
  <div className="flex items-center gap-2.5">
    <Avatar name={name} />
    <div className="min-w-0">
      <p className="truncate font-medium">{name}</p>
      {email && <p className="truncate text-xs text-mainGray">{email}</p>}
    </div>
  </div>
);

const FormatPills = ({ formats }: { formats: string[] }) => (
  <div className="flex flex-wrap gap-1">
    {formats.length ? (
      formats.map((f) => <StatusPill key={f} status={f} label={formatLabel(f)} />)
    ) : (
      <span className="text-mainGray">—</span>
    )}
  </div>
);

const matchesSearch = (q: string, name: string, email?: string | null) =>
  !q || name.toLowerCase().includes(q) || (email ?? "").toLowerCase().includes(q);

export const InstructorsPage = () => {
  const { canManageCurrentRoute: canManage } = useRouteAccess();
  const som = useSomData();
  const overview = useFetch(api.fetch.fetchInstructorsOverview, undefined, !canManage);
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const overviewRows = useMemo(
    () =>
      [...(overview.data?.data ?? [])]
        .filter((i) => matchesSearch(q, i.name, i.email))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [overview.data, q]
  );

  const somRows = useMemo(
    () =>
      [...som.instructors]
        .filter((i) => matchesSearch(q, i.displayName, i.email))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [som.instructors, q]
  );

  const empty = (
    <EmptyBlock
      msg={q ? "No instructors match your search." : "No instructors yet. They appear here once assigned to a class."}
    />
  );

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        {canManage
          ? overview.error && (
              <LoadError msg="Could not load the instructor overview." onRetry={() => overview.refetch()} />
            )
          : som.error && <LoadError msg={som.error} onRetry={som.refetch} />}
        <PageHeader
          title="Instructors"
          subtitle="Who teaches what, how much they carry, and how quickly work gets graded."
          actions={<Btn to={`${somPaths.dashboard}/instructor-portal`}>Open grading portal</Btn>}
        />

        <input
          type="search"
          aria-label="Search instructors"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-lightGray bg-white px-3 text-sm sm:w-64"
        />

        {canManage ? (
          overview.loading && !overview.data ? (
            <SkeletonLoader />
          ) : (
            <Panel>
              <SimpleTable<InstructorOverview>
                rows={overviewRows}
                rowKey={(i) => i.userId}
                minWidth={980}
                empty={empty}
                columns={[
                  { key: "n", header: "Instructor", render: (i) => <PersonCell name={i.name} email={i.email} /> },
                  {
                    key: "p",
                    header: "Programs",
                    render: (i) => (
                      <span className="text-primaryGray">
                        {i.programs.length ? i.programs.map((p) => p.title).join(", ") : "—"}
                      </span>
                    ),
                  },
                  {
                    key: "c",
                    header: "Live classes",
                    render: (i) => {
                      const live = i.classes.filter((c) => c.live);
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold">{i.liveClasses}</span>
                          {live.length > 0 && (
                            <ul className="flex flex-col gap-0.5 text-xs">
                              {live.map((c) => (
                                <li key={c.id}>
                                  <Link to={somPaths.class(c.cohortId, c.id)} className="text-primary hover:underline">
                                    {c.programTitle} · {c.cohortName} · {c.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    },
                  },
                  { key: "l", header: "Learners", className: "text-right", render: (i) => i.learners },
                  {
                    key: "g",
                    header: "To grade",
                    className: "text-right",
                    render: (i) =>
                      i.toGrade > 0 ? <Pill tone="amber">{i.toGrade}</Pill> : <span className="text-mainGray">0</span>,
                  },
                  {
                    key: "t",
                    header: "Avg grading time",
                    className: "text-right",
                    render: (i) => (
                      <span
                        className={cn(
                          i.avgGradingHours !== null && i.avgGradingHours > 96
                            ? "font-semibold text-red-700"
                            : "text-primaryGray"
                        )}
                        title={i.gradedCount ? `Across ${i.gradedCount} graded submissions` : undefined}
                      >
                        {formatHours(i.avgGradingHours)}
                      </span>
                    ),
                  },
                  { key: "f", header: "Teaches", render: (i) => <FormatPills formats={i.formats} /> },
                ]}
              />
            </Panel>
          )
        ) : som.loading && !som.instructors.length ? (
          <SkeletonLoader />
        ) : (
          <Panel>
            <SimpleTable<InstructorRow>
              rows={somRows}
              rowKey={(i) => i.id}
              minWidth={820}
              empty={empty}
              columns={[
                { key: "n", header: "Instructor", render: (i) => <PersonCell name={i.displayName} email={i.email} /> },
                {
                  key: "c",
                  header: "Classes",
                  render: (i) => (
                    <ul className="flex flex-col gap-0.5 text-xs">
                      {i.courses.map((c) => (
                        <li key={c.id}>
                          <Link to={somPaths.class(c.cohort_id, c.id)} className="text-primary hover:underline">
                            {c.cohort_name} · {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ),
                },
                { key: "p", header: "Programs", render: (i) => <span className="text-primaryGray">{i.programs.join(", ")}</span> },
                { key: "l", header: "Learners", className: "text-right", render: (i) => i.learnerCount },
                { key: "f", header: "Teaches", render: (i) => <FormatPills formats={i.formats} /> },
              ]}
            />
          </Panel>
        )}
      </div>
    </PageOutline>
  );
};

export default InstructorsPage;
