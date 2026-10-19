import { FamilyRelation, normalizeFamilyRelation } from "@/utils/familyRelations";

export type FamilyMemberView = {
  relation?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  country_code?: string;
  primary_number?: string;
};

export const relationSections: { key: FamilyRelation; title: string; badgeLabel: string }[] = [
  { key: "spouse", title: "Spouses", badgeLabel: "Spouse" },
  { key: "parent", title: "Parents", badgeLabel: "Parent" },
  { key: "child", title: "Children", badgeLabel: "Child" },
  { key: "sibling", title: "Siblings", badgeLabel: "Sibling" },
  { key: "guardian", title: "Guardians", badgeLabel: "Guardian" },
  { key: "dependent", title: "Dependents", badgeLabel: "Dependent" },
  { key: "grandparent", title: "Grandparents", badgeLabel: "Grandparent" },
  { key: "grandchild", title: "Grandchildren", badgeLabel: "Grandchild" },
  { key: "in-law", title: "In-laws", badgeLabel: "In-law" },
];

export const knownRelations = new Set(relationSections.map((section) => section.key));

export const groupByRelation = (items: FamilyMemberView[] = []) => {
  return items.reduce((acc: Record<string, FamilyMemberView[]>, item) => {
    const key = normalizeFamilyRelation(item.relation) || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};
