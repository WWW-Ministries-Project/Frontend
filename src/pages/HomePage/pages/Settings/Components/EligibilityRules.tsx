import { Button } from "@/components";
import MultiSelect from "@/components/MultiSelect";
import {
  ELIGIBILITY_ROLES,
  EligibilityRulesState,
  sanitizeEligibilityRules,
} from "../utils/eligibilityRules";
import { useEffect, useMemo, useState } from "react";

interface ProgramOption {
  label: string;
  value: string;
}

interface EligibilityRulesProps {
  initialRules: EligibilityRulesState;
  programOptions: ProgramOption[];
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onRetry: () => void;
  onSave: (rules: EligibilityRulesState) => void;
}

export const EligibilityRules = ({
  initialRules,
  programOptions,
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
    [programOptions]
  );

  useEffect(() => {
    setRules(initialRules);
    setSavedRules(initialRules);
  }, [initialRules]);

  useEffect(() => {
    if (validProgramIds.size === 0) {
      return;
    }

    setRules((previousRules) =>
      sanitizeEligibilityRules(previousRules, validProgramIds)
    );
    setSavedRules((previousRules) =>
      sanitizeEligibilityRules(previousRules, validProgramIds)
    );
  }, [validProgramIds]);

  const hasChanges = useMemo(
    () => JSON.stringify(rules) !== JSON.stringify(savedRules),
    [rules, savedRules]
  );

  const handleRoleProgramsChange = (
    roleKey: keyof EligibilityRulesState,
    selectedPrograms: string[]
  ) => {
    setRules((previousRules) => ({
      ...previousRules,
      [roleKey]: selectedPrograms,
    }));
  };

  const isSelectionDisabled =
    loading || saving || Boolean(error) || programOptions.length === 0;

  return (
    <section className="app-card space-y-6 p-4 md:p-5">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-primary">
          Role eligibility rules
        </h4>
        <p className="text-sm text-primaryGray">
          Select the program or programs a member must complete before they can
          be assigned to each role.
        </p>
      </div>

      {loading && (
        <p className="text-xs text-primaryGray">
          Loading eligibility rules...
        </p>
      )}

      {error && (
        <div className="rounded-md border border-error/40 bg-errorBG px-4 py-3">
          <p className="text-sm text-error">{error}</p>
          <div className="mt-3">
            <Button value="Retry" variant="secondary" onClick={onRetry} />
          </div>
        </div>
      )}

      {!loading && !error && programOptions.length === 0 && (
        <p className="rounded-md border border-lightGray bg-lightGray/30 px-4 py-3 text-sm text-primaryGray">
          No programs are available yet. Create programs in Ministry School to
          configure eligibility rules.
        </p>
      )}

      <div className="space-y-4">
        {ELIGIBILITY_ROLES.map((role) => {
          const selectedPrograms = rules[role.key];
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
                disabled={isSelectionDisabled}
              />
            </div>
          );
        })}
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
