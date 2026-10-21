import { useCallback, useEffect, useState } from "react";

import { UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { api } from "@/utils/api/apiCalls";

import { ELIG_ROLES, selectClass } from "../generalModel";
import { Card, CardHead, LoadFailed, ProgramChip, RowsSkeleton, SectionTitle } from "../generalUi";
import type { RulesDraft } from "../useRulesDraft";

interface Named {
  id: number;
  name: string;
}

/** Programs and positions the rules can point to. */
const useEligibilityOptions = () => {
  const [programs, setPrograms] = useState<Named[]>([]);
  const [positions, setPositions] = useState<Named[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [programsResponse, positionsResponse] = await Promise.all([
        api.fetch.fetchAllPrograms(),
        api.fetch.fetchPositions(),
      ]);
      setPrograms((programsResponse.data ?? []).map((program) => ({ id: program.id, name: program.title })));
      setPositions((positionsResponse.data ?? []).map((position) => ({ id: position.id, name: position.name })));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { programs, positions, status, load };
};

/** Toggles `id` in `picked`, keeping the program list's order. */
const togglePick = (programs: Named[], picked: number[], id: number) =>
  picked.includes(id)
    ? picked.filter((value) => value !== id)
    : programs.filter((program) => program.id === id || picked.includes(program.id)).map((program) => program.id);

const Chips = ({
  programs,
  picked,
  onChange,
  disabled,
}: {
  programs: Named[];
  picked: number[];
  onChange: (next: number[]) => void;
  disabled: boolean;
}) =>
  programs.length ? (
    <>
      {programs.map((program) => (
        <ProgramChip
          key={program.id}
          on={picked.includes(program.id)}
          disabled={disabled}
          onClick={() => onChange(togglePick(programs, picked, program.id))}
        >
          {program.name}
        </ProgramChip>
      ))}
    </>
  ) : (
    <span className="text-xs text-[#6B7280]">No programs yet.</span>
  );

export const EligibilitySection = ({ rules, canEdit }: { rules: RulesDraft; canEdit: boolean }) => {
  const options = useEligibilityOptions();
  const elig = rules.value("elig");

  const header = (
    <SectionTitle
      title="Eligibility rules"
      text="Programs someone must complete before they can be given a role or position."
    />
  );

  if (rules.status.elig === "error" || options.status === "error") {
    return (
      <>
        {header}
        <LoadFailed
          what="eligibility rules"
          onRetry={() => {
            if (rules.status.elig === "error") void rules.load("elig");
            if (options.status === "error") void options.load();
          }}
        />
      </>
    );
  }

  if (!elig || rules.status.elig === "loading" || options.status === "loading") {
    return (
      <>
        {header}
        <RowsSkeleton rows={5} />
      </>
    );
  }

  return (
    <>
      {header}
      <Card>
        <CardHead>
          <h3 className="text-base font-semibold text-primary">Church roles</h3>
        </CardHead>
        {ELIG_ROLES.map((role) => {
          const picked = elig.roles[role.key];
          return (
            <div
              key={role.key}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#E5E7EB] p-4 last:border-b-0"
            >
              <div className="flex min-w-[160px] flex-[0_1_200px] flex-col">
                <span className="text-sm font-medium text-primary">{role.label}</span>
                <span className="text-xs text-[#6B7280]">
                  {picked.length ? `${picked.length} required` : "No programs required"}
                </span>
              </div>
              <div className="flex flex-[1_1_280px] flex-wrap gap-2">
                <Chips
                  programs={options.programs}
                  picked={picked}
                  disabled={!canEdit}
                  onChange={(next) =>
                    rules.set("elig", (draft) => ({ ...draft, roles: { ...draft.roles, [role.key]: next } }))
                  }
                />
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <CardHead>
          <h3 className="text-base font-semibold text-primary">Positions</h3>
          {canEdit && (
            <UiButton
              tone="secondary"
              onClick={() =>
                rules.set("elig", (draft) => ({
                  ...draft,
                  positions: [...draft.positions, { positionId: "", programIds: [] }],
                }))
              }
            >
              + Add position rule
            </UiButton>
          )}
        </CardHead>
        {elig.positions.map((rule, index) => {
          const taken = new Set(
            elig.positions.filter((_, other) => other !== index).map((other) => other.positionId)
          );
          // A rule may point to a position outside this branch's list; keep it selectable.
          const known = options.positions.some((position) => position.id === rule.positionId);
          const positionOptions = [
            ...(rule.positionId && !known ? [{ id: rule.positionId, name: `Position ${rule.positionId}` }] : []),
            ...options.positions.filter((position) => !taken.has(position.id)),
          ];
          return (
            <div
              key={index}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#E5E7EB] p-4 last:border-b-0"
            >
              <select
                value={rule.positionId}
                disabled={!canEdit}
                aria-label="Position"
                onChange={(event) => {
                  const next = event.target.value ? Number(event.target.value) : "";
                  rules.set("elig", (draft) => {
                    draft.positions[index].positionId = next;
                    return draft;
                  });
                }}
                className={`${selectClass} min-w-[160px] flex-[0_1_200px]`}
              >
                <option value="">Choose a position…</option>
                {positionOptions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-[1_1_240px] flex-wrap gap-2">
                <Chips
                  programs={options.programs}
                  picked={rule.programIds}
                  disabled={!canEdit}
                  onChange={(next) =>
                    rules.set("elig", (draft) => {
                      draft.positions[index].programIds = next;
                      return draft;
                    })
                  }
                />
              </div>
              {canEdit && (
                <button
                  type="button"
                  aria-label="Remove rule"
                  onClick={() =>
                    rules.set("elig", (draft) => {
                      draft.positions.splice(index, 1);
                      return draft;
                    })
                  }
                  className="h-9 w-9 rounded-lg border border-[#FECACA] bg-white text-lg text-[#B91C1C] hover:bg-[#FEF2F2]"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        {!elig.positions.length && <p className="p-4 text-sm text-[#6B7280]">No position rules yet.</p>}
      </Card>
    </>
  );
};
