import type { SelectOption } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

const toOptions = (values: string[]): SelectOption[] =>
  values.map((value) => ({ value, label: value }));

export { TITLE_OPTIONS } from "@/components/subform/titleOptions";

export const GENDER_OPTIONS = toOptions(["Male", "Female"]);

export const MARITAL_OPTIONS: SelectOption[] = [
  { label: "Single", value: "SINGLE" },
  { label: "Married", value: "MARRIED" },
  { label: "Divorced", value: "DIVORCED" },
  { label: "Widow", value: "WIDOW" },
  { label: "Widower", value: "WIDOWER" },
];

export const EMERGENCY_RELATION_OPTIONS: SelectOption[] = [
  { label: "Spouse", value: "spouse" },
  { label: "Father", value: "father" },
  { label: "Mother", value: "mother" },
  { label: "Brother", value: "brother" },
  { label: "Sister", value: "sister" },
  { label: "Son", value: "son" },
  { label: "Daughter", value: "daughter" },
  { label: "Other", value: "other" },
];

export const FAMILY_RELATION_OPTIONS: SelectOption[] = [
  { label: "Spouse", value: "spouse" },
  { label: "Parent", value: "parent" },
  { label: "Child", value: "child" },
  { label: "Sibling", value: "sibling" },
  { label: "Guardian", value: "guardian" },
  { label: "Dependent", value: "dependent" },
  { label: "Grandparent", value: "grandparent" },
  { label: "Grandchild", value: "grandchild" },
  { label: "In-law", value: "in-law" },
];

export const EMPLOYMENT_OPTIONS: SelectOption[] = [
  { label: "Student", value: "student" },
  { label: "Employed", value: "employed" },
  { label: "Self employed", value: "self_employed" },
  { label: "Unemployed", value: "unemployed" },
  { label: "Retired", value: "retired" },
];

/** Statuses where institution / industry / position are required (see WorkInfoSubForm). */
export const WORK_DETAILS_REQUIRED = ["employed", "self_employed"];
export const WORK_DETAILS_SHOWN = [...WORK_DETAILS_REQUIRED, "retired"];
