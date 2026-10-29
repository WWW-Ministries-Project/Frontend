export interface TitleOption {
  label: string;
  value: string;
}

// Single source of truth for the person-title dropdown used by the member form,
// the visitor form, and any other name subform. Values are unchanged from the
// two previous copies (NameInfo.titleOptions and members' TITLE_OPTIONS) so no
// saved payload changes.
export const TITLE_OPTIONS: TitleOption[] = [
  "Mr", "Mrs", "Miss", "Ms", "Dr", "Prof", "Pastor", "Apostle", "Prophet",
  "Evangelist", "Teacher", "Bishop", "Rev", "Elder", "Deacon", "Deaconess",
  "Minister", "Hon", "Sir", "Lady",
].map((value) => ({ value, label: value }));
