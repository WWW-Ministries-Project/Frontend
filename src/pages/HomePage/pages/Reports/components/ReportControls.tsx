import { selectAccessibleBranches, useBranchStore } from "@/store/useBranchStore";
import type {
  ReportPeriodInfo,
  ReportPeriodOption,
  ReportPeriodType,
} from "@/utils/api/reports/interfaces";
import { cn } from "@/utils/cn";

import { PERIOD_TYPE_LABEL } from "../utils/reportAdapters";
import type { CompareMode } from "../utils/reportTypes";
import { PillTabs } from "./reportsUi";

const selectClass =
  "h-10 w-full rounded-lg border border-gray-500/35 bg-white px-3 text-sm text-primary outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgb(var(--color-shadow)_/_0.08)]";

/** Branch picker bound to the app-wide branch selection. */
export const BranchSelect = ({
  value,
  onChange,
  label,
  className,
}: {
  value: number | null;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}) => {
  const branches = useBranchStore(selectAccessibleBranches);
  const allowedAll = useBranchStore((s) => s.allowedBranchIds === null);
  const options = [
    ...(allowedAll || branches.length > 1 ? [{ value: "ALL", label: "All branches" }] : []),
    ...branches.map((b) => ({ value: String(b.id), label: b.name })),
  ];
  const select = (
    <select
      aria-label={label ? undefined : "Branch"}
      value={value === null ? "ALL" : String(value)}
      onChange={(event) => onChange(event.target.value)}
      className={cn(selectClass, !label && "w-auto", className)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
  if (!label) return select;
  return (
    <label className="flex max-w-[240px] flex-[1_1_180px] flex-col gap-1">
      <span className="text-sm text-primary">{label}</span>
      {select}
    </label>
  );
};

/** Period type, period, branch and comparison — the filter panel on every report. */
export const ReportControls = ({
  periodType,
  periodKey,
  period,
  options,
  compare,
  branchId,
  onPeriodType,
  onPeriodKey,
  onCompare,
  onBranch,
  periodTypes,
}: {
  periodType: ReportPeriodType;
  periodKey: string;
  period?: ReportPeriodInfo | null;
  options: ReportPeriodOption[];
  compare: CompareMode;
  branchId: number | null;
  onPeriodType: (type: ReportPeriodType) => void;
  onPeriodKey: (key: string) => void;
  onCompare: (mode: CompareMode) => void;
  onBranch: (value: string) => void;
  /** Period types this report supports; defaults to all of them. */
  periodTypes?: ReportPeriodType[];
}) => {
  const isCustom = periodType === "CUSTOM";
  const [customFrom, customTo] = (periodKey || period?.key || "").split("_");
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-2xl border border-lightGray bg-inputBackground p-4 print:hidden">
      <div className="flex min-w-0 max-w-full flex-col gap-1">
        <span className="text-sm text-primary">Period type</span>
        <div className="max-w-full overflow-x-auto">
          <PillTabs
            ariaLabel="Period type"
            size="sm"
            className="flex-nowrap"
            value={periodType}
            onChange={onPeriodType}
            tabs={(periodTypes ?? (Object.keys(PERIOD_TYPE_LABEL) as ReportPeriodType[])).map((key) => ({
              key,
              label: PERIOD_TYPE_LABEL[key],
            }))}
          />
        </div>
      </div>
      {isCustom ? (
        <div className="flex flex-[1_1_300px] flex-wrap gap-2">
          <label className="flex flex-[1_1_140px] flex-col gap-1">
            <span className="text-sm text-primary">From</span>
            <input
              type="date"
              className={selectClass}
              value={customFrom || ""}
              max={customTo || undefined}
              onChange={(event) => event.target.value && customTo && onPeriodKey(`${event.target.value}_${customTo}`)}
            />
          </label>
          <label className="flex flex-[1_1_140px] flex-col gap-1">
            <span className="text-sm text-primary">To</span>
            <input
              type="date"
              className={selectClass}
              value={customTo || ""}
              min={customFrom || undefined}
              onChange={(event) => event.target.value && customFrom && onPeriodKey(`${customFrom}_${event.target.value}`)}
            />
          </label>
        </div>
      ) : (
        <label className="flex max-w-[300px] flex-[1_1_220px] flex-col gap-1">
          <span className="text-sm text-primary">Period</span>
          <select
            className={selectClass}
            value={periodKey || period?.key || ""}
            onChange={(event) => onPeriodKey(event.target.value)}
          >
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <BranchSelect label="Branch" value={branchId} onChange={onBranch} />
      <label className="flex max-w-[280px] flex-[1_1_200px] flex-col gap-1">
        <span className="text-sm text-primary">Compare to</span>
        <select
          className={selectClass}
          value={compare}
          onChange={(event) => onCompare(event.target.value as CompareMode)}
        >
          <option value="prev">Previous period{period ? ` (${period.prev_label})` : ""}</option>
          <option value="yoy">Same period last year{period ? ` (${period.yoy_label})` : ""}</option>
        </select>
      </label>
    </div>
  );
};
