import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import MultiSelect from "@/components/MultiSelect";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import {
  createEmptyPositionEligibilityRule,
  ELIGIBILITY_ROLES,
  EligibilityRulesState,
  normalizeEligibilityRulesForCompare,
  sanitizeEligibilityRules,
} from "../utils/eligibilityRules";

interface ProgramOption {
  label: string;
  value: string;
}

interface PositionOption {
  label: string;
  value: string;
}

interface EligibilityRulesProps {
  initialRules: EligibilityRulesState;
  programOptions: ProgramOption[];
  positionOptions: PositionOption[];
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onRetry: () => void;
  onSave: (rules: EligibilityRulesState) => void;
}

export const EligibilityRules = ({
  initialRules,
  programOptions,
  positionOptions,
  loading = false,
  saving = false,
  error,
  onRetry,
  onSave,
}: EligibilityRulesProps) => {
  const [rules, setRules] = useState<EligibilityRulesState>(initialRules);
  const [savedRules, setSavedRules] = useState<EligibilityRulesState>(initialRules);

  const validProgramIds = useMemo(
    () => new Set(programOptions.map((program) => program.value)),
    [programOptions],
  );
  const validPositionIds = useMemo(
    () => new Set(positionOptions.map((position) => position.value)),
    [positionOptions],
  );

  useEffect(() => {
    setRules(initialRules);
    setSavedRules(initialRules);
  }, [initialRules]);

  useEffect(() => {
    if (loading || Boolean(error)) {
      return;
    }

    setRules((previousRules) =>
      sanitizeEligibilityRules(previousRules, validProgramIds, validPositionIds),
    );
    setSavedRules((previousRules) =>
      sanitizeEligibilityRules(previousRules, validProgramIds, validPositionIds),
    );
  }, [error, loading, validPositionIds, validProgramIds]);

  const hasChanges = useMemo(
    () =>
      JSON.stringify(normalizeEligibilityRulesForCompare(rules)) !==
      JSON.stringify(normalizeEligibilityRulesForCompare(savedRules)),
    [rules, savedRules],
  );

  const selectedPositionIds = useMemo(
    () =>
      new Set(
        rules.positionRules
          .map((rule) => rule.positionId)
          .filter((positionId) => positionId.length > 0),
      ),
    [rules.positionRules],
  );

  const handleRoleProgramsChange = (
    roleKey: keyof EligibilityRulesState["roleRules"],
    selectedPrograms: string[],
  ) => {
    setRules((previousRules) => ({
      ...previousRules,
      roleRules: {
        ...previousRules.roleRules,
        [roleKey]: selectedPrograms,
      },
    }));
  };

  const handlePositionRuleChange = (
    index: number,
    updates: Partial<EligibilityRulesState["positionRules"][number]>,
  ) => {
    setRules((previousRules) => ({
      ...previousRules,
      positionRules: previousRules.positionRules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...updates } : rule,
      ),
    }));
  };

  const addPositionRule = () => {
    setRules((previousRules) => ({
      ...previousRules,
      positionRules: [
        ...previousRules.positionRules,
        createEmptyPositionEligibilityRule(),
      ],
    }));
  };

  const removePositionRule = (index: number) => {
    setRules((previousRules) => ({
      ...previousRules,
      positionRules: previousRules.positionRules.filter(
        (_rule, ruleIndex) => ruleIndex !== index,
      ),
    }));
  };

  const isRoleSelectionDisabled =
    loading || saving || Boolean(error) || programOptions.length === 0;
  const isPositionSectionDisabled =
    loading ||
    saving ||
    Boolean(error) ||
    positionOptions.length === 0 ||
    programOptions.length === 0;

  return (
    <section className="app-card space-y-8 p-4 md:p-5">
      {loading && (
        <p className="text-xs text-primaryGray">Loading eligibility rules...</p>
      )}

      {error && (
        <div className="rounded-md border border-error/40 bg-errorBG px-4 py-3">
          <p className="text-sm text-error">{error}</p>
          <div className="mt-3">
            <Button value="Retry" variant="secondary" onClick={onRetry} />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-primary">
            Role eligibility rules
          </h4>
          <p className="text-sm text-primaryGray">
            Select the program or programs a member must complete before they
            can be assigned to each role.
          </p>
        </div>

        {!loading && !error && programOptions.length === 0 && (
          <p className="rounded-md border border-lightGray bg-lightGray/30 px-4 py-3 text-sm text-primaryGray">
            No programs are available yet. Create programs in Ministry School to
            configure eligibility rules.
          </p>
        )}

        <div className="space-y-4">
          {ELIGIBILITY_ROLES.map((role) => {
            const selectedPrograms = rules.roleRules[role.key];
            const selectedCount = selectedPrograms.length;

            return (
              <div
                key={role.key}
                className="rounded-xl border border-lightGray p-4 md:p-5"
              >
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-primary">
                      {role.label}
                    </h5>
                    <p className="text-sm text-primaryGray">
                      Required programs before assigning this role.
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {selectedCount === 0
                      ? "No programs selected"
                      : `${selectedCount} program${selectedCount === 1 ? "" : "s"} selected`}
                  </span>
                </div>

                <MultiSelect
                  options={programOptions}
                  selectedValues={selectedPrograms}
                  onChange={(values) => handleRoleProgramsChange(role.key, values)}
                  placeholder="Select required programs"
                  emptyMsg="No programs selected"
                  disabled={isRoleSelectionDisabled}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-primary">
            Position eligibility rules
          </h4>
          <p className="text-sm text-primaryGray">
            Add positions and the programs members must complete before they
            can be assigned to those positions.
          </p>
        </div>

        {!loading && !error && positionOptions.length === 0 && (
          <p className="rounded-md border border-lightGray bg-lightGray/30 px-4 py-3 text-sm text-primaryGray">
            No positions are available yet. Create positions first to configure
            position eligibility rules.
          </p>
        )}

        {rules.positionRules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-lightGray p-4 text-sm text-primaryGray">
            No position eligibility rules added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {rules.positionRules.map((rule, index) => {
              const availablePositionOptions = positionOptions.filter(
                (option) =>
                  option.value === rule.positionId ||
                  !selectedPositionIds.has(option.value),
              );

              return (
                <div
                  key={`${rule.positionId || "position-rule"}-${index}`}
                  className="rounded-xl border border-lightGray p-4 md:p-5"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] lg:items-start">
                    <SelectField
                      id={`position-rule-${index}`}
                      label="Position"
                      placeholder="Select position"
                      value={rule.positionId}
                      options={availablePositionOptions}
                      onChange={(_name, value) =>
                        handlePositionRuleChange(index, {
                          positionId: value ? String(value) : "",
                        })
                      }
                      disabled={loading || saving || Boolean(error)}
                      helperText={
                        positionOptions.length === 0
                          ? "No positions available."
                          : undefined
                      }
                      clearable
                    />

                    <div>
                      <p className="mb-1 text-sm font-medium text-primary">
                        Required programs
                      </p>
                      <MultiSelect
                        options={programOptions}
                        selectedValues={rule.requiredProgramIds}
                        onChange={(values) =>
                          handlePositionRuleChange(index, {
                            requiredProgramIds: values,
                          })
                        }
                        placeholder="Select required programs"
                        emptyMsg="No programs selected"
                        disabled={isPositionSectionDisabled}
                      />
                    </div>

                    <div className="pt-0 lg:pt-7">
                      <Button
                        value="Remove"
                        variant="ghost"
                        onClick={() => removePositionRule(index)}
                        disabled={loading || saving}
                        className="w-full justify-center lg:w-auto"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <Button
            value="Add another position"
            variant="secondary"
            onClick={addPositionRule}
            disabled={isPositionSectionDisabled}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          value="Save Changes"
          onClick={() => onSave(rules)}
          disabled={!hasChanges || loading || saving || Boolean(error)}
          loading={saving}
        />
      </div>
    </section>
  );
};
