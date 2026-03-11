import type {
  EligibilityRoleKey,
  RoleEligibilityConfig,
  RoleEligibilityConfigPayload,
  RoleEligibilityRule,
} from "@/utils/api/settings/eligibilityInterfaces";

export interface EligibilityRole {
  key: EligibilityRoleKey;
  label: string;
}

export type EligibilityRulesState = Record<EligibilityRoleKey, string[]>;

export const ELIGIBILITY_ROLES: EligibilityRole[] = [
  { key: "member", label: "Member" },
  { key: "ministry_worker", label: "Ministry worker" },
  { key: "instructor", label: "Instructor" },
  { key: "life_center_leader", label: "Life center leader" },
  { key: "head_of_department", label: "Head of department" },
];

export const createEmptyEligibilityRules = (): EligibilityRulesState => ({
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

  return [
    ...new Set(
      value.flatMap((item) =>
        typeof item === "string" || typeof item === "number"
          ? [String(item)]
          : []
      )
    ),
  ];
};

const resolveRules = (
  payload: RoleEligibilityConfig | RoleEligibilityRule[] | null | unknown
): RoleEligibilityRule[] => {
  if (Array.isArray(payload)) {
    return payload as RoleEligibilityRule[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "rules" in payload &&
    Array.isArray((payload as RoleEligibilityConfig).rules)
  ) {
    return (payload as RoleEligibilityConfig).rules;
  }

  return [];
};

export const normalizeEligibilityRules = (
  payload: RoleEligibilityConfig | RoleEligibilityRule[] | null | unknown
): EligibilityRulesState => {
  const baseRules = createEmptyEligibilityRules();
  const rules = resolveRules(payload);

  return ELIGIBILITY_ROLES.reduce<EligibilityRulesState>((accumulator, role) => {
    const matchedRule = rules.find((rule) => rule.role_key === role.key);
    accumulator[role.key] = normalizeRuleValues(
      matchedRule?.required_program_ids
    );
    return accumulator;
  }, baseRules);
};

export const sanitizeEligibilityRules = (
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
  }, createEmptyEligibilityRules());
};

export const buildEligibilityRulesPayload = (
  rules: EligibilityRulesState
): RoleEligibilityConfigPayload => ({
  rules: ELIGIBILITY_ROLES.map((role) => ({
    role_key: role.key,
    required_program_ids: rules[role.key].flatMap((value) => {
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? [parsedValue] : [];
    }),
  })),
});
