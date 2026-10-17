import { useRouteAccess } from "@/context/RouteAccessContext";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { showNotification } from "@/pages/HomePage/utils";
import { ALL_BRANCHES, buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import type { GradingCategory, LmsReports, SessionMode } from "@/utils/api/ministrySchool/interfaces";
import type { QueryType } from "@/utils/interfaces";
import { ReactNode, useMemo, useState } from "react";
import { Btn, EmptyBlock, Kpi, LoadError, PageHeader, Panel } from "../ui";

const MODE_LABEL: Record<SessionMode, string> = {
  IN_PERSON: "In person",
  ONLINE: "Live online",
  HYBRID: "Hybrid",
};
const CATEGORY_LABEL: Record<GradingCategory, string> = {
  quiz: "Quizzes",
  essay: "Essays",
  exam: "Exams",
};

const pctText = (rate: number | null) => (rate === null ? "—" : `${Math.round(rate)}%`);

const fmtHours = (hours: number | null) => {
  if (hours === null) return "—";
  if (hours < 48) return `${Math.round(hours * 10) / 10} h`;
  const days = Math.round((hours / 24) * 10) / 10;
  return `${days} day${days === 1 ? "" : "s"}`;
};

const monthLabel = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

/** Local calendar day → ISO instant (start or end of that day). */
const dayToIso = (day: string, end: boolean) => {
  const d = new Date(`${day}T${end ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const FORMULA_START = /^[=+\-@\t\r]/;
const csvCell = (value: string | number | null) => {
  if (value === null) return "";
  if (typeof value === "number") return String(value);
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const buildCsv = (r: LmsReports, scope: string, range: string) => {
  const lines: (string | number | null)[][] = [
    ["School of Ministry report"],
    ["Scope", scope],
    ["Period", range],
    [],
    ["Totals"],
    ["Programs", r.totals.programs],
    ["Enrollments", r.totals.enrollments],
    ["Completed", r.totals.completed],
    [],
    ["Completion by program"],
    ["Program", "Enrolled", "Completed", "Completion rate %"],
    ...r.completionByProgram.map((p) => [p.title, p.enrolled, p.completed, p.rate]),
    [],
    ["Attendance by delivery mode"],
    ["Mode", "Records", "Attendance rate %"],
    ...r.attendanceByMode.map((a) => [MODE_LABEL[a.mode] ?? a.mode, a.records, a.rate]),
    [],
    ["Pass rate by assessment type"],
    ["Type", "Graded", "Pass rate %"],
    ...r.passRateByType.map((p) => [CATEGORY_LABEL[p.category] ?? p.category, p.graded, p.rate]),
    [],
    ["Grading turnaround"],
    ["Graded", "Average hours", "Median hours", "Within 4 days %"],
    [r.gradingTurnaround.graded, r.gradingTurnaround.avgHours, r.gradingTurnaround.medianHours, r.gradingTurnaround.within4Days],
    [],
    ["Enrollments per month"],
    ["Month", "Enrollments"],
    ...r.enrollmentsByMonth.map((m) => [monthLabel(m.month), m.count]),
  ];
  return lines.map((row) => row.map(csvCell).join(",")).join("\r\n");
};

type Bar = { key: string | number; label: string; pct: number; value: ReactNode; sub?: ReactNode };

const BarList = ({ bars, empty }: { bars: Bar[]; empty: string }) =>
  bars.length ? (
    <ul className="flex flex-col gap-3">
      {bars.map((b) => (
        <li key={b.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-primary" title={b.label}>
              {b.label}
            </span>
            <span className="whitespace-nowrap font-semibold text-primary">
              {b.value}
              {b.sub && <span className="ml-1.5 text-xs font-normal text-mainGray">{b.sub}</span>}
            </span>
          </div>
          <div aria-hidden className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, b.pct))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p className="py-4 text-center text-sm text-mainGray">{empty}</p>
  );

const ReportBody = ({ report }: { report: LmsReports }) => {
  const { totals, completionByProgram, attendanceByMode, passRateByType, gradingTurnaround, enrollmentsByMonth } = report;
  const overall = totals.enrollments > 0 ? Math.round((totals.completed / totals.enrollments) * 100) : null;
  const maxMonth = Math.max(1, ...enrollmentsByMonth.map((m) => m.count));
  const turnaroundBars: Bar[] =
    gradingTurnaround.graded > 0
      ? [
          {
            key: "within",
            label: "Graded within 4 days",
            pct: gradingTurnaround.within4Days ?? 0,
            value: pctText(gradingTurnaround.within4Days),
            sub: "Target: under 4 days",
          },
        ]
      : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 tablet:grid-cols-3">
        <Kpi label="Programs" value={totals.programs} />
        <Kpi label="Enrollments" value={totals.enrollments} />
        <Kpi label="Completed" value={totals.completed} sub={overall === null ? "No enrollments yet" : `${overall}% overall completion`} />
      </div>

      <div className="grid gap-4 laptop:grid-cols-2">
        <Panel title="Completion rate by program" bodyClassName="p-4">
          <BarList
            empty="No programs with enrollments."
            bars={completionByProgram.map((p) => ({
              key: p.programId,
              label: p.title,
              pct: p.rate ?? 0,
              value: pctText(p.rate),
              sub: `${p.completed}/${p.enrolled}`,
            }))}
          />
        </Panel>

        <Panel title="Attendance by delivery mode" bodyClassName="p-4">
          <BarList
            empty="No sessions yet."
            bars={attendanceByMode.map((a) => ({
              key: a.mode,
              label: MODE_LABEL[a.mode] ?? a.mode,
              pct: a.records > 0 ? a.rate ?? 0 : 0,
              value: a.records > 0 ? pctText(a.rate) : "—",
              sub: a.records > 0 ? `${a.records} records` : "No attendance recorded",
            }))}
          />
        </Panel>

        <Panel title="Pass rate by assessment type" bodyClassName="p-4">
          <BarList
            empty="Nothing graded yet."
            bars={passRateByType.map((p) => ({
              key: p.category,
              label: CATEGORY_LABEL[p.category] ?? p.category,
              pct: p.rate ?? 0,
              value: pctText(p.rate),
              sub: `${p.graded} graded`,
            }))}
          />
        </Panel>

        <Panel title="Grading turnaround" bodyClassName="flex flex-col gap-4 p-4">
          {gradingTurnaround.graded > 0 ? (
            <>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-mainGray">Average</dt>
                  <dd className="text-lg font-semibold text-primary">{fmtHours(gradingTurnaround.avgHours)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-mainGray">Median</dt>
                  <dd className="text-lg font-semibold text-primary">{fmtHours(gradingTurnaround.medianHours)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-mainGray">Graded</dt>
                  <dd className="text-lg font-semibold text-primary">{gradingTurnaround.graded}</dd>
                </div>
              </dl>
              <BarList empty="" bars={turnaroundBars} />
            </>
          ) : (
            <p className="py-4 text-center text-sm text-mainGray">Nothing graded yet.</p>
          )}
        </Panel>
      </div>

      <Panel title="Enrollments per month" bodyClassName="p-4">
        <BarList
          empty="No enrollments in this period."
          bars={enrollmentsByMonth.slice(-12).map((m) => ({
            key: m.month,
            label: monthLabel(m.month),
            pct: (m.count / maxMonth) * 100,
            value: m.count,
          }))}
        />
      </Panel>
    </div>
  );
};

/** School of Ministry reports: completion, attendance, pass rates, grading turnaround. */
export const ReportsPage = () => {
  const { canManageCurrentRoute } = useRouteAccess();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const branches = useBranchStore((s) => s.branches);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const query = useMemo<QueryType | undefined>(() => {
    const fromIso = from ? dayToIso(from, false) : null;
    const toIso = to ? dayToIso(to, true) : null;
    const q: QueryType = {
      ...(buildBranchQuery(activeBranchId) ?? {}),
      ...(fromIso ? { from: fromIso } : {}),
      ...(toIso ? { to: toIso } : {}),
    };
    return Object.keys(q).length ? q : undefined;
  }, [activeBranchId, from, to]);

  const { data, loading, error, refetch } = useFetch(api.fetch.fetchLmsReports, query, !canManageCurrentRoute);
  const report = data?.data ?? null;

  const scope =
    activeBranchId === ALL_BRANCHES
      ? "All branches"
      : branches.find((b) => b.id === activeBranchId)?.name ?? "Selected branch";
  const range = from || to ? `${from || "start"} to ${to || "today"}` : "All time";
  const rangeInvalid = Boolean(from && to && from > to);

  const exportCsv = () => {
    if (!report) return;
    const csv = buildCsv(report, scope, range);
    const blob = new Blob([String.fromCharCode(0xfeff) + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `som-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotification("Report exported", "success");
  };

  const isEmpty =
    report !== null &&
    report.totals.programs === 0 &&
    report.totals.enrollments === 0 &&
    report.gradingTurnaround.graded === 0;

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Reports"
          subtitle={`School of Ministry results for ${scope === "All branches" ? "all branches" : scope}${
            from || to ? `, ${range}` : ""
          }.`}
        />

        {!canManageCurrentRoute ? (
          <EmptyBlock msg="Reports are available to School of Ministry managers." />
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-mainGray">From</span>
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-9 rounded-lg border border-lightGray bg-white px-2 text-sm text-primary"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-mainGray">To</span>
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-9 rounded-lg border border-lightGray bg-white px-2 text-sm text-primary"
                />
              </label>
              {(from || to) && (
                <Btn size="sm" variant="ghost" className="h-9" onClick={() => { setFrom(""); setTo(""); }}>
                  Clear dates
                </Btn>
              )}
              <Btn size="sm" className="ml-auto h-9" disabled={!report || loading} onClick={exportCsv}>
                Export CSV
              </Btn>
            </div>
            {rangeInvalid && (
              <p role="alert" className="text-sm text-red-700">
                The start date must be on or before the end date.
              </p>
            )}

            {error && !report ? (
              <LoadError msg="Could not load the reports." onRetry={() => refetch()} />
            ) : loading && !report ? (
              <SkeletonLoader no={4} />
            ) : !report ? null : isEmpty ? (
              <EmptyBlock msg="No School of Ministry activity for this scope and period yet." />
            ) : (
              <ReportBody report={report} />
            )}
          </>
        )}
      </div>
    </PageOutline>
  );
};

export default ReportsPage;
