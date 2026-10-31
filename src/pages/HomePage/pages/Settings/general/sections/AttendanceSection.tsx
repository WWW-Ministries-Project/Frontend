import { formatDay } from "@/pages/HomePage/pages/Settings/utils/settingsModel";
import type { AttendanceTimingUnit } from "@/utils/api/settings/attendanceTimingInterfaces";
import { cn } from "@/utils/cn";

import { ATT_ROWS, isWholePositive, selectClass, UNIT_OPTIONS } from "../generalModel";
import { Card, LoadFailed, RowsSkeleton, SectionTitle } from "../generalUi";
import type { RulesDraft } from "../useRulesDraft";

export const AttendanceSection = ({ rules, canEdit }: { rules: RulesDraft; canEdit: boolean }) => {
  const att = rules.value("att");
  const config = rules.attConfig;
  const updated = [
    config?.updated_at ? formatDay(config.updated_at) : "",
    config?.updated_by?.name ? `by ${config.updated_by.name}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <SectionTitle title="Attendance timing" text="How check-in times are classed on attendance reports." />
      {rules.status.att === "error" ? (
        <LoadFailed what="attendance timing" onRetry={() => void rules.load("att")} />
      ) : !att || rules.status.att === "loading" ? (
        <RowsSkeleton rows={3} />
      ) : (
        <Card>
          {ATT_ROWS.map((row) => {
            const rule = att[row.key];
            const valid = isWholePositive(rule.value);
            return (
              <div key={row.key} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-gray-200 p-4">
                <div className="flex min-w-0 flex-[1_1_220px] flex-col">
                  <span className="text-sm font-medium text-primary">{row.label}</span>
                  <span className="text-xs text-gray-500">{row.description}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={rule.value}
                    disabled={!canEdit}
                    aria-label={`${row.label} amount`}
                    aria-invalid={!valid}
                    onChange={(event) => {
                      const next = event.target.value;
                      rules.set("att", (draft) => ({ ...draft, [row.key]: { ...draft[row.key], value: next } }));
                    }}
                    className={cn(
                      selectClass,
                      "w-24",
                      !valid && "border-red-700 focus:border-red-700"
                    )}
                  />
                  <select
                    value={rule.unit}
                    disabled={!canEdit}
                    aria-label={`${row.label} unit`}
                    onChange={(event) => {
                      const next = event.target.value as AttendanceTimingUnit;
                      rules.set("att", (draft) => ({ ...draft, [row.key]: { ...draft[row.key], unit: next } }));
                    }}
                    className={cn(selectClass, "w-[120px]")}
                  >
                    {UNIT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
          <div className="flex flex-col gap-1 bg-inputBackground px-4 py-3">
            <p className="text-xs text-gray-600">If a check-in fits two rules, Early and Late win over On time.</p>
            {updated && <p className="text-xs text-gray-500">Last updated {updated}</p>}
          </div>
        </Card>
      )}
    </>
  );
};
