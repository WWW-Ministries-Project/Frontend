import { useMemo } from "react";

import { PeopleChips } from "@/pages/HomePage/pages/Settings/Components/settingsUi";

import { LoadFailed, RowsSkeleton, SectionTitle } from "../generalUi";
import { useMemberOptions } from "../useMemberOptions";
import type { RulesDraft } from "../useRulesDraft";

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
        text="People on this list are left out of event reports: department rosters, attendance counts and exports."
      />
      {rules.status.repExcl === "error" ? (
        <LoadFailed what="report exclusions" onRetry={() => void rules.load("repExcl")} />
      ) : !picked || rules.status.repExcl === "loading" ? (
        <RowsSkeleton rows={1} />
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4">
          <h3 className="text-base font-semibold text-primary">Leave out of event reports</h3>
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
