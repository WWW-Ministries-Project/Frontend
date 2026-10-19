export type StepKey = "basic" | "contact" | "church" | "work" | "family";

export interface MemberFormStep {
  key: StepKey;
  title: string;
  description: string;
  skippable?: boolean;
}

export const getMemberFormSteps = (hasFamily: boolean): MemberFormStep[] => {
  const steps: MemberFormStep[] = [
    { key: "basic", title: "Basic Information", description: "Who the member is" },
    { key: "contact", title: "Contact Information", description: "How we can reach them" },
    { key: "church", title: "Church Information", description: "Membership & ministry details" },
    {
      key: "work",
      title: "Employment / Schooling",
      description: "What they currently do",
      skippable: true,
    },
  ];

  if (hasFamily) {
    steps.push({ key: "family", title: "Family Information", description: "Family members" });
  }

  return steps;
};

export const hasNestedError = (errorValue: unknown): boolean => {
  if (Array.isArray(errorValue)) return errorValue.some((item) => hasNestedError(item));
  if (errorValue && typeof errorValue === "object") {
    return Object.values(errorValue as Record<string, unknown>).some((item) =>
      hasNestedError(item)
    );
  }
  return Boolean(errorValue);
};

/** Top-level form keys owned by each step. */
export const stepFields = (step: StepKey, isUser: boolean): string[] => {
  switch (step) {
    case "basic":
      return ["personal_info", "picture"];
    case "contact":
      return ["contact_info", "emergency_contact"];
    case "church":
      return ["church_info", "branch_id", ...(isUser ? ["department_positions"] : [])];
    case "work":
      return ["work_info"];
    case "family":
      return ["family"];
    default:
      return [];
  }
};

export const stepHasError = (step: StepKey, errors: unknown, isUser: boolean) => {
  const record = errors && typeof errors === "object" ? (errors as Record<string, unknown>) : {};
  return stepFields(step, isUser).some((key) => hasNestedError(record[key]));
};

/** Mirrors a Formik errors tree into a touched tree (every leaf -> true). */
export const errorsToTouched = (errors: unknown): unknown => {
  if (Array.isArray(errors)) return errors.map((item) => errorsToTouched(item));
  if (errors && typeof errors === "object") {
    return Object.entries(errors as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        acc[key] = errorsToTouched(value);
        return acc;
      },
      {}
    );
  }
  return true;
};
