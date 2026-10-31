import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import type {
  ApiKpi,
  ApiSection,
  DeptAttendanceReportKey,
  DeptReportListItem,
  DeptReportStatus,
  ReportPeriodType,
} from "@/utils/api/reports/interfaces";

import { deltaOf, formatValue } from "./reportFormat";
import type { CompareMode, PillSpec, ReportKpi, ReportSection } from "./reportTypes";

/** Turns a backend KPI into a tile, picking the comparison the viewer chose. */
export const toKpi = (kpi: ApiKpi, compare: CompareMode = "prev"): ReportKpi => {
  const base = compare === "yoy" ? kpi.compare.yoy : kpi.compare.prev;
  const points = kpi.points || kpi.format === "pct";
  return {
    label: kpi.label,
    value: kpi.display || (kpi.value === null ? "—" : formatValue(kpi.value, kpi.format)),
    format: kpi.format,
    delta: kpi.value === null ? null : deltaOf(kpi.value, base, points),
    good: kpi.good,
    spark: kpi.spark,
    sub: kpi.sub || undefined,
    provisional: kpi.provisional,
  };
};

/** Backend sections already match the renderer; only `pii` names need hiding. */
export const toSection = (section: ApiSection): ReportSection => {
  if (section.kind === "list") {
    return {
      ...section,
      items: section.items.map((item) => ({ ...item, hidden: item.title === "Name hidden" })),
    };
  }
  return section as ReportSection;
};

/** Department attendance reports use `dept_att:<department id>` keys and exist for monthly periods only. */
export const isDeptAttendanceKey = (key: string | null | undefined): key is DeptAttendanceReportKey =>
  Boolean(key && key.startsWith("dept_att:"));

/** Who prepares a report: the responsible department's head (Settings › Reports), else whoever is on record, else the role. */
export const preparedByName = (r: Pick<DeptReportListItem, "owner" | "prepared_by" | "hod_role">) =>
  r.prepared_by?.name || r.owner?.head?.name || r.hod_role;

export const deptStatusPill = (status: DeptReportStatus, overdue?: boolean): PillSpec => {
  if (overdue) return { tone: "danger", label: "Overdue" };
  switch (status) {
    case "APPROVED":
      return { tone: "success", label: "Approved" };
    case "SUBMITTED":
      return { tone: "info", label: "Submitted" };
    case "RETURNED":
      return { tone: "danger", label: "Returned" };
    default:
      return { tone: "neutral", label: "Draft" };
  }
};

export const PERIOD_TYPE_LABEL: Record<ReportPeriodType, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual",
  CUSTOM: "Custom",
};

/**
 * Period, comparison and branch for a report screen. Period and comparison
 * live in the URL so links (and notifications) open the same view; the branch
 * is the app-wide branch selection so every screen agrees.
 */
export const useReportControls = (defaults: { periodType?: ReportPeriodType } = {}) => {
  const [params, setParams] = useSearchParams();
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const setActiveBranchId = useBranchStore((s) => s.setActiveBranchId);

  const periodType = (params.get("period_type") as ReportPeriodType) || defaults.periodType || "MONTHLY";
  const periodKey = params.get("period_key") || "";
  const compare = (params.get("compare") as CompareMode) || "prev";
  const urlBranch = params.get("branch_id");

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === null || value === "") next.delete(key);
            else next.set(key, value);
          });
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // A link carrying branch_id (e.g. from a notification) switches the app branch once.
  useEffect(() => {
    if (!urlBranch) return;
    const id = Number(urlBranch);
    if (Number.isInteger(id) && id > 0 && id !== activeBranchId) setActiveBranchId(id);
    update({ branch_id: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlBranch]);

  const query = useMemo(
    () => ({
      period_type: periodType,
      ...(periodKey ? { period_key: periodKey } : {}),
      ...(activeBranchId === ALL_BRANCHES ? {} : { branch_id: activeBranchId }),
    }),
    [periodType, periodKey, activeBranchId]
  );

  return {
    periodType,
    periodKey,
    compare,
    query,
    /** False until a branch_id from the URL has been applied; pass `!ready` as useFetch's `lazy` so the first fetch isn't for the wrong branch. */
    ready: !urlBranch,
    branchId: activeBranchId === ALL_BRANCHES ? null : activeBranchId,
    setPeriodType: (type: ReportPeriodType) => update({ period_type: type, period_key: null }),
    setPeriodKey: (key: string) => update({ period_key: key }),
    setCompare: (mode: CompareMode) => update({ compare: mode === "prev" ? null : mode }),
    setBranch: (value: string) =>
      setActiveBranchId(value === "ALL" ? ALL_BRANCHES : Number(value)),
  };
};
