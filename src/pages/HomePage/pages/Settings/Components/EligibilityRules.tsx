import { Button } from "@/components";
import MultiSelect from "@/components/MultiSelect";
import { showNotification } from "@/pages/HomePage/utils";
import { useEffect, useMemo, useState } from "react";

type EligibilityRoleKey =
  | "member"
  | "ministry_worker"
  | "instructor"
  | "life_center_leader"
  | "head_of_department";

type EligibilityRulesState = Record<EligibilityRoleKey, string[]>;

interface ProgramOption {
  label: string;
  value: string;
}

interface EligibilityRulesProps {
  programOptions: ProgramOption[];
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
}

interface EligibilityRole {
  key: EligibilityRoleKey;
  label: string;
}

const ELIGIBILITY_RULES_STORAGE_KEY = "settings-eligibility-rules";

const ELIGIBILITY_ROLES: EligibilityRole[] = [
  { key: "member", label: "Member" },
  { key: "ministry_worker", label: "Ministry worker" },
  { key: "instructor", label: "Instructor" },
  { key: "life_center_leader", label: "Life center leader" },
  { key: "head_of_department", label: "Head of department" },
];

const createEmptyRules = (): EligibilityRulesState => ({
  member: [],
  ministry_worker: [],
  instructor: [],
  life_center_leader: [],
  head_of_department: [],
});

const normalizeRuleValues = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(
    value.flatMap((item) =>
      typeof item === "string" || typeof item === "number"
        ? [String(item)]
        : []
    )
  )];
};

const normalizeEligibilityRules = (value: unknown): EligibilityRulesState => {
  const baseRules = createEmptyRules();

  if (!value || typeof value !== "object") {
    return baseRules;
  }

  const valueRecord = value as Record<string, unknown>;

  return ELIGIBILITY_ROLES.reduce<EligibilityRulesState>((accumulator, role) => {
    accumulator[role.key] = normalizeRuleValues(valueRecord[role.key]);
    return accumulator;
  }, baseRules);
};

const loadStoredRules = (): EligibilityRulesState => {
  if (typeof window === "undefined") {
    return createEmptyRules();
  }

  try {
    const savedValue = window.localStorage.getItem(
      ELIGIBILITY_RULES_STORAGE_KEY
    );

    if (!savedValue) {
      return createEmptyRules();
    }

    return normalizeEligibilityRules(JSON.parse(savedValue));
  } catch {
    return createEmptyRules();
  }
};

const sanitizeRules = (
  rules: EligibilityRulesState,
  validProgramIds: Set<string>
): EligibilityRulesState => {
  if (validProgramIds.size === 0) {
    return rules;
  }

  return ELIGIBILITY_ROLES.reduce<EligibilityRulesState>((accumulator, role) => {
    accumulator[role.key] = rules[role.key].filter((value) =>
      validProgramIds.has(value)
    );
    return accumulator;
  }, createEmptyRules());
};

export const EligibilityRules = ({
  programOptions,
  loading = false,
  error,
  onRetry,
}: EligibilityRulesProps) => {
  const [rules, setRules] = useState<EligibilityRulesState>(() =>
    loadStoredRules()
  );
  const [initialRules, setInitialRules] = useState<EligibilityRulesState>(() =>
    loadStoredRules()
  );

  const validProgramIds = useMemo(
    () => new Set(programOptions.map((program) => program.value)),
    [programOptions]
  );

  useEffect(() => {
    if (validProgramIds.size === 0) {
      return;
    }

    setRules((previousRules) => sanitizeRules(previousRules, validProgramIds));
    setInitialRules((previousRules) =>
      sanitizeRules(previousRules, validProgramIds)
    );
  }, [validProgramIds]);

  const hasChanges = useMemo(
    () => JSON.stringify(rules) !== JSON.stringify(initialRules),
    [initialRules, rules]
  );

  const handleRoleProgramsChange = (
    roleKey: EligibilityRoleKey,
    selectedPrograms: string[]
  ) => {
    setRules((previousRules) => ({
      ...previousRules,
      [roleKey]: selectedPrograms,
    }));
  };

  const handleSave = () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        ELIGIBILITY_RULES_STORAGE_KEY,
        JSON.stringify(rules)
      );
      setInitialRules(rules);
      showNotification("Eligibility rules saved successfully.", "success");
    } catch {
      showNotification("Unable to save eligibility rules.", "error");
    }
  };

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
        <p className="text-xs text-primaryGray">Loading programs...</p>
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
                disabled={loading || programOptions.length === 0}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          value="Save Changes"
          onClick={handleSave}
          disabled={!hasChanges || loading}
        />
      </div>
    </section>
  );
};
