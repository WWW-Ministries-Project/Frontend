import { useMemo } from "react";

import { PeopleChips } from "@/pages/HomePage/pages/Settings/Components/settingsUi";
import type { ReportConfigDepartment } from "@/utils/api/settings/reportConfigInterfaces";
import { cn } from "@/utils/cn";

import { ToggleSwitch } from "../../../ChurchCommunication/ui/commUi";
import { DUE_DAYS, REPORT_TYPES, selectClass } from "../generalModel";
import { Card, LoadFailed, RowsSkeleton, SectionTitle } from "../generalUi";
import { useMemberOptions } from "../useMemberOptions";
import type { RulesDraft } from "../useRulesDraft";

const membersText = (count: number) => `${count} ${count === 1 ? "member" : "members"}`;

/** Who prepares a report, given the chosen department. */
const ownerLine = (dept: ReportConfigDepartment | undefined, id: number | null) => {
  if (!id) return { text: "No department chosen. Nobody will be asked to prepare it.", warn: false };
  if (!dept) return { text: "This department isn’t in your branches.", warn: false };
  if (!dept.head) return { text: `${dept.name} has no head yet. Assign one in Departments.`, warn: true };
  return { text: `Prepared and submitted by ${dept.head.name}, head of ${dept.name}.`, warn: false };
};

const ReportConfigBlocks = ({ rules, canEdit }: { rules: RulesDraft; canEdit: boolean }) => {
  const cfg = rules.value("repCfg");
  const departments = rules.reportDepartments;
  const manyBranches = useMemo(
    () => new Set(departments.map((dept) => dept.branch_id ?? 0)).size > 1,
    [departments]
  );
  const deptLabel = (dept: ReportConfigDepartment) =>
    manyBranches && dept.branch_name ? `${dept.name} · ${dept.branch_name}` : dept.name;

  if (rules.status.repCfg === "error") {
    return <LoadFailed what="report settings" onRetry={() => void rules.load("repCfg")} />;
  }
  if (!cfg || rules.status.repCfg === "loading") return <RowsSkeleton rows={3} />;

  const onCount = departments.filter((dept) => !cfg.off.includes(dept.id)).length;

  return (
    <>
      <Card>
        <div className="flex flex-col gap-0.5 border-b border-gray-200 bg-inputBackground px-4 py-3">
          <h3 className="text-base font-semibold text-primary">Responsible department</h3>
          <p className="text-sm text-gray-600">
            The head of the selected department prepares the report and submits it for approval.
          </p>
        </div>
        {REPORT_TYPES.map((type) => {
          const id = cfg.owners[type.key];
          const dept = departments.find((d) => d.id === id);
          const who = ownerLine(dept, id);
          return (
            <div
              key={type.key}
              className="flex flex-wrap items-start gap-x-4 gap-y-3 border-b border-gray-200 p-4 last:border-b-0"
            >
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
                <span className="text-sm font-medium text-primary">{type.label}</span>
                <span className="text-xs text-gray-500">{type.description}</span>
              </div>
              <div className="flex max-w-[320px] flex-[1_1_240px] flex-col gap-1">
                <select
                  value={id ? String(id) : ""}
                  disabled={!canEdit}
                  aria-label={`Responsible department for ${type.label}`}
                  onChange={(event) => {
                    const next = Number(event.target.value) || null;
                    rules.set("repCfg", (draft) => ({ ...draft, owners: { ...draft.owners, [type.key]: next } }));
                  }}
                  className={cn(selectClass, "w-full")}
                >
                  <option value="">Choose a department…</option>
                  {id && !dept && <option value={String(id)}>Department #{id}</option>}
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {deptLabel(d)}
                    </option>
                  ))}
                </select>
                <span className={cn("text-xs", who.warn ? "text-amber-700" : "text-gray-600")}>{who.text}</span>
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-gray-200 bg-inputBackground px-4 py-3">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-0.5">
            <h3 className="text-base font-semibold text-primary">Department attendance reports</h3>
            <p className="text-sm text-gray-600">
              Each department gets a monthly report of its own team’s check-ins, pre-filled from attendance. The head of
              department reviews it and submits. New departments are added automatically.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm text-primary">
            Due each month on
            <select
              value={String(cfg.due)}
              disabled={!canEdit}
              onChange={(event) => {
                const due = Number(event.target.value);
                rules.set("repCfg", (draft) => ({ ...draft, due }));
              }}
              className={cn(selectClass, "w-[140px]")}
            >
              {DUE_DAYS.map((day) => (
                <option key={day} value={String(day)}>
                  Day {day}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="border-b border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500">
          {onCount} of {departments.length} {departments.length === 1 ? "department submits" : "departments submit"} a
          report
        </p>
        {departments.length ? (
          departments.map((dept) => {
            const on = !cfg.off.includes(dept.id);
            return (
              <div
                key={dept.id}
                className="flex min-h-16 items-center gap-4 border-b border-gray-200 px-4 py-3 last:border-b-0 hover:bg-lightGray/20"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium text-primary">{deptLabel(dept)}</span>
                  <span className="text-xs text-gray-500">
                    {dept.head ? `Head: ${dept.head.name}` : "No head yet. The report waits until one is assigned"} ·{" "}
                    {membersText(dept.members)}
                  </span>
                </div>
                <span className="w-6 text-xs text-gray-600">{on ? "On" : "Off"}</span>
                <ToggleSwitch
                  on={on}
                  disabled={!canEdit}
                  label={`Attendance report for ${dept.name}`}
                  onChange={(next) =>
                    rules.set("repCfg", (draft) => ({
                      ...draft,
                      off: next ? draft.off.filter((value) => value !== dept.id) : [...draft.off, dept.id],
                    }))
                  }
                />
              </div>
            );
          })
        ) : (
          <p className="px-4 py-4 text-sm text-gray-500">No departments yet.</p>
        )}
      </Card>
    </>
  );
};

export const ReportsSection = ({ rules, canEdit }: { rules: RulesDraft; canEdit: boolean }) => {
  const { members } = useMemberOptions();
  const picked = rules.value("repExcl");

  const names = useMemo(() => {
    const map = new Map<number, string>();
    members.forEach((member) => map.set(member.id, member.name));
    rules.excludedUsers.forEach((user) => map.set(user.id, user.name));
    return map;
  }, [members, rules.excludedUsers]);

  return (
    <>
      <SectionTitle
        title="Reports"
        text="Who prepares each report, which departments submit their own attendance report, and who is left out of event reports."
      />
      <ReportConfigBlocks rules={rules} canEdit={canEdit} />
      {rules.status.repExcl === "error" ? (
        <LoadFailed what="report exclusions" onRetry={() => void rules.load("repExcl")} />
      ) : !picked || rules.status.repExcl === "loading" ? (
        <RowsSkeleton rows={1} />
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-semibold text-primary">Leave out of event reports</h3>
            <p className="text-sm text-gray-600">Left out of department rosters, attendance counts and exports.</p>
          </div>
          <PeopleChips
            framed={false}
            people={picked.map((id) => ({ id, name: names.get(id) ?? `Member ${id}` }))}
            options={members.filter((member) => !picked.includes(member.id))}
            addLabel="Leave someone out"
            emptyText="No one left out."
            disabled={!canEdit}
            onAdd={(id) => rules.set("repExcl", (draft) => (draft.includes(id) ? draft : [...draft, id]))}
            onRemove={(id) => rules.set("repExcl", (draft) => draft.filter((value) => value !== id))}
          />
        </div>
      )}
    </>
  );
};
