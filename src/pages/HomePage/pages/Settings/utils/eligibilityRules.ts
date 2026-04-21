import type {
  EligibilityRoleKey,
  PositionEligibilityRule,
  RoleEligibilityConfig,
  RoleEligibilityConfigPayload,
  RoleEligibilityRule,
} from "@/utils/api/settings/eligibilityInterfaces";

export interface EligibilityRole {
  key: EligibilityRoleKey;
  label: string;
}

export interface PositionEligibilityRuleState {
  positionId: string;
  requiredProgramIds: string[];
}

export interface EligibilityRulesState {
  roleRules: Record<EligibilityRoleKey, string[]>;
  positionRules: PositionEligibilityRuleState[];
}

export const ELIGIBILITY_ROLES: EligibilityRole[] = [
  { key: "member", label: "Member" },
  { key: "ministry_worker", label: "Ministry worker" },
  { key: "instructor", label: "Instructor" },
  { key: "life_center_leader", label: "Life center leader" },
  { key: "head_of_department", label: "Head of department" },
];

export const createEmptyPositionEligibilityRule =
  (): PositionEligibilityRuleState => ({
    positionId: "",
    requiredProgramIds: [],
  });

const createEmptyRoleRules = (): Record<EligibilityRoleKey, string[]> => ({
  member: [],
  ministry_worker: [],
  instructor: [],
  life_center_leader: [],
  head_of_department: [],
});

export const createEmptyEligibilityRules = (): EligibilityRulesState => ({
  roleRules: createEmptyRoleRules(),
  positionRules: [],
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
          : [],
      ),
    ),
  ];
};

const resolveRules = (
  payload: RoleEligibilityConfig | RoleEligibilityRule[] | null | unknown,
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

const resolvePositionRules = (
  payload: RoleEligibilityConfig | null | unknown,
): PositionEligibilityRule[] => {
  if (
    payload &&
    typeof payload === "object" &&
    "position_rules" in payload &&
    Array.isArray((payload as RoleEligibilityConfig).position_rules)
  ) {
    return (payload as RoleEligibilityConfig).position_rules ?? [];
  }

  return [];
};

export const normalizeEligibilityRules = (
  payload: RoleEligibilityConfig | RoleEligibilityRule[] | null | unknown,
): EligibilityRulesState => {
  const baseRules = createEmptyEligibilityRules();
  const rules = resolveRules(payload);
  const positionRules = resolvePositionRules(
    Array.isArray(payload) ? null : payload,
  );

  const roleRules = ELIGIBILITY_ROLES.reduce<Record<EligibilityRoleKey, string[]>>(
    (accumulator, role) => {
      const matchedRule = rules.find((rule) => rule.role_key === role.key);
      accumulator[role.key] = normalizeRuleValues(
        matchedRule?.required_program_ids,
      );
      return accumulator;
    },
    createEmptyRoleRules(),
  );

  return {
    roleRules,
    positionRules: positionRules.map((rule) => ({
      positionId:
        typeof rule.position_id === "string" || typeof rule.position_id === "number"
          ? String(rule.position_id)
          : "",
      requiredProgramIds: normalizeRuleValues(rule.required_program_ids),
    })),
  };
};

export const sanitizeEligibilityRules = (
  rules: EligibilityRulesState,
  validProgramIds: Set<string>,
  validPositionIds: Set<string>,
): EligibilityRulesState => ({
  roleRules: ELIGIBILITY_ROLES.reduce<Record<EligibilityRoleKey, string[]>>(
    (accumulator, role) => {
      accumulator[role.key] = rules.roleRules[role.key].filter((value) =>
        validProgramIds.has(value),
      );
      return accumulator;
    },
    createEmptyRoleRules(),
  ),
  positionRules: rules.positionRules.reduce<PositionEligibilityRuleState[]>(
    (accumulator, rule) => {
      const sanitizedRule: PositionEligibilityRuleState = {
        positionId:
          !rule.positionId || validPositionIds.has(rule.positionId)
            ? rule.positionId
            : "",
        requiredProgramIds: rule.requiredProgramIds.filter((value) =>
          validProgramIds.has(value),
        ),
      };

      if (
        sanitizedRule.positionId &&
        accumulator.some(
          (existingRule) => existingRule.positionId === sanitizedRule.positionId,
        )
      ) {
        return accumulator;
      }

      accumulator.push(sanitizedRule);
      return accumulator;
    },
    [],
  ),
});

export const normalizeEligibilityRulesForCompare = (
  rules: EligibilityRulesState,
) => ({
  roleRules: ELIGIBILITY_ROLES.reduce<Record<EligibilityRoleKey, string[]>>(
    (accumulator, role) => {
      accumulator[role.key] = [...rules.roleRules[role.key]].sort((left, right) =>
        left.localeCompare(right, undefined, {
          sensitivity: "base",
          numeric: true,
        }),
      );
      return accumulator;
    },
    createEmptyRoleRules(),
  ),
  positionRules: [...rules.positionRules]
    .map((rule) => ({
      positionId: rule.positionId,
      requiredProgramIds: [...rule.requiredProgramIds].sort((left, right) =>
        left.localeCompare(right, undefined, {
          sensitivity: "base",
          numeric: true,
        }),
      ),
    }))
    .sort((left, right) =>
      left.positionId.localeCompare(right.positionId, undefined, {
        sensitivity: "base",
        numeric: true,
      }),
    ),
});

export const buildEligibilityRulesPayload = (
  rules: EligibilityRulesState,
): RoleEligibilityConfigPayload => ({
  rules: ELIGIBILITY_ROLES.map((role) => ({
    role_key: role.key,
    required_program_ids: rules.roleRules[role.key].flatMap((value) => {
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? [parsedValue] : [];
    }),
  })),
  position_rules: rules.positionRules.flatMap((rule) => {
    const positionId = Number(rule.positionId);

    if (!Number.isFinite(positionId) || positionId <= 0) {
      return [];
    }

    return [
      {
        position_id: positionId,
        required_program_ids: rule.requiredProgramIds.flatMap((value) => {
          const parsedValue = Number(value);
          return Number.isFinite(parsedValue) ? [parsedValue] : [];
        }),
      },
    ];
  }),
});
