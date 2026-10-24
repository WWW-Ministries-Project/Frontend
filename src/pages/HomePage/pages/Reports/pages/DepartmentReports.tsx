import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import type { ApiResponse } from "@/utils/interfaces";
import type { DeptReportList, DeptReportListItem } from "@/utils/api/reports/interfaces";

import { BranchSelect } from "../components/ReportControls";
import {
  MiniStat,
  PageEmpty,
  PageHeading,
  Pill,
  PillTabs,
  SkeletonGrid,
  UiButton,
} from "../components/reportsUi";
import {
  PERIOD_TYPE_LABEL,
  deptStatusPill,
  isDeptAttendanceKey,
  preparedByName,
  toKpi,
  useReportControls,
} from "../utils/reportAdapters";
import { fmtDate } from "../utils/reportFormat";

type LibFilter = "ALL" | "SUBMITTED" | "DRAFT" | "RETURNED" | "APPROVED";

const dueLine = (r: DeptReportListItem) => {
  if (r.overdue) return `Due ${fmtDate(r.due_date)} · overdue`;
  if (r.status === "RETURNED") return `Returned ${fmtDate(r.returned_at)} · waiting for changes`;
  if (r.status === "APPROVED") return `Approved ${fmtDate(r.approved_at)}`;
  if (r.status === "SUBMITTED") return `Submitted ${fmtDate(r.submitted_at)}`;
  return `Due ${fmtDate(r.due_date)}`;
};

const DepartmentReports = () => {
  const navigate = useNavigate();
  const controls = useReportControls();
  const [filter, setFilter] = useState<LibFilter>("ALL");

  const { data, loading, error, refetch } = useFetch<ApiResponse<DeptReportList>>(
    api.fetch.fetchDepartmentReports,
    controls.query,
    !controls.ready,
    { silent: true }
  );
  const list = data?.data ?? null;
  const leadership = Boolean(list?.viewer.is_leadership);

  const churchWide = useMemo(() => list?.reports ?? [], [list]);
  const deptAttendance = useMemo(() => list?.department_attendance ?? [], [list]);

  // Filter tabs count both groups.
  const counts = useMemo(() => {
    const reports = [...churchWide, ...deptAttendance];
    return {
      ALL: reports.length,
      SUBMITTED: reports.filter((r) => r.status === "SUBMITTED").length,
      DRAFT: reports.filter((r) => r.status === "DRAFT").length,
      RETURNED: reports.filter((r) => r.status === "RETURNED").length,
      APPROVED: reports.filter((r) => r.status === "APPROVED").length,
    };
  }, [churchWide, deptAttendance]);

  const matches = (r: DeptReportListItem) => filter === "ALL" || r.status === filter;
  const cards = churchWide.filter(matches);
  const deptCards = deptAttendance.filter(matches);
  const total = churchWide.length + deptAttendance.length;
  const dueDay = list?.department_attendance_due_day;
  const deptSub = `${deptAttendance.length} ${deptAttendance.length === 1 ? "department" : "departments"} · each head of department submits their team’s attendance${
    dueDay ? `, due day ${dueDay} of the month` : ""
  }`;

  const open = (r: DeptReportListItem) => {
    // Department attendance reports exist for monthly periods only.
    const periodType = isDeptAttendanceKey(r.key) ? "MONTHLY" : controls.periodType;
    const params = new URLSearchParams({ from: "dept", period_type: periodType });
    if (list?.period.key && periodType === list.period.type) params.set("period_key", list.period.key);
    navigate(`/home/reports/department/${encodeURIComponent(r.key)}?${params.toString()}`);
  };

  const renderCard = (r: DeptReportListItem) => {
    const status = deptStatusPill(r.status);
    const editable = r.permissions.can_edit;
    const cta = r.permissions.can_approve ? "Review" : editable ? "Complete" : "Open";
    return (
      <button
        key={r.key}
        type="button"
        onClick={() => open(r)}
        className="flex min-w-0 flex-col gap-4 rounded-2xl border border-lightGray bg-white p-5 text-left text-sm text-primary transition-shadow hover:shadow-[0_10px_28px_rgb(var(--color-shadow)_/_0.2)]"
      >
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-xl font-semibold leading-7">{r.name}</h2>
            <p className="text-gray-600">
              Prepared by {preparedByName(r)} · {r.cadence}
            </p>
          </div>
          <Pill tone={status.tone} className="flex-shrink-0">{status.label}</Pill>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 border-t border-gray-200 pt-4">
          {r.failed ? (
            <p className="col-span-2 text-gray-500">Figures couldn’t be worked out for this period.</p>
          ) : (
            r.headline.map((kpi) => <MiniStat key={kpi.key} kpi={toKpi(kpi)} muted />)
          )}
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <span className={r.overdue ? "text-xs font-semibold text-red-700" : "text-xs text-gray-500"}>
            {dueLine(r)}
          </span>
          <span className="font-medium">{cta} →</span>
        </div>
      </button>
    );
  };

  const cardGrid = "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))]";

  return (
    <section className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeading
        title="Department reports"
        subtitle={
          list
            ? `${list.period.label} · ${list.branch.name}. Drafts are pre-filled from system data; heads of department add commentary and submit for approval.`
            : "Drafts are pre-filled from system data; heads of department add commentary and submit for approval."
        }
        actions={
          <>
            <select
              aria-label="Period type"
              value={controls.periodType}
              onChange={(event) => controls.setPeriodType(event.target.value as typeof controls.periodType)}
              className="h-10 rounded-lg border border-gray-500/35 bg-white px-3 text-sm text-primary"
            >
              {(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"] as const).map((type) => (
                <option key={type} value={type}>
                  {PERIOD_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
            {list && (
              <select
                aria-label="Period"
                value={list.period.key}
                onChange={(event) => controls.setPeriodKey(event.target.value)}
                className="h-10 max-w-full rounded-lg border border-gray-500/35 bg-white px-3 text-sm text-primary"
              >
                {list.period_options.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <BranchSelect value={controls.branchId} onChange={controls.setBranch} />
          </>
        }
      />

      <div className="max-w-full self-start overflow-x-auto">
        <PillTabs
          ariaLabel="Filter reports"
          size="sm"
          className="flex-nowrap"
          value={filter}
          onChange={setFilter}
          tabs={[
            { key: "ALL", label: "All", count: counts.ALL },
            { key: "SUBMITTED", label: leadership ? "Awaiting my review" : "Awaiting review", count: counts.SUBMITTED },
            { key: "DRAFT", label: "Not submitted", count: counts.DRAFT },
            { key: "RETURNED", label: "Returned", count: counts.RETURNED },
            { key: "APPROVED", label: "Approved", count: counts.APPROVED },
          ]}
        />
      </div>

      {loading && !list && <SkeletonGrid count={6} min={320} height={220} />}

      {error && !list && !loading && (
        <PageEmpty
          badge="COULDN'T LOAD"
          title="Couldn't load department reports"
          text="Check your connection and try again."
          action={<UiButton onClick={() => refetch(controls.query)}>Try again</UiButton>}
        />
      )}

      {list && total === 0 && (
        <PageEmpty
          badge="NO ACCESS"
          title="No reports to show"
          text="You can see a department report when your access level lets you view that module or Reports, or when you head a department."
        />
      )}

      {list && cards.length > 0 && (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold leading-7 text-primary">Church-wide reports</h2>
            <p className="text-gray-600">Prepared by the responsible department set in Settings.</p>
          </div>
          <div className={cardGrid}>{cards.map(renderCard)}</div>
        </>
      )}

      {list && deptCards.length > 0 && (
        <>
          <div className="flex flex-col gap-1 pt-2">
            <h2 className="text-xl font-semibold leading-7 text-primary">Department attendance reports</h2>
            <p className="text-gray-600">{deptSub}</p>
          </div>
          <div className={cardGrid}>{deptCards.map(renderCard)}</div>
        </>
      )}

      {list && total > 0 && cards.length === 0 && deptCards.length === 0 && (
        <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-gray-600">
          No reports match this filter.
        </p>
      )}
    </section>
  );
};

export default DepartmentReports;
