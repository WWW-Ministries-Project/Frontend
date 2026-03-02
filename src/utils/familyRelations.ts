export const FAMILY_RELATION_VALUES = [
  "spouse",
  "parent",
  "child",
  "sibling",
  "guardian",
  "dependent",
  "grandparent",
  "grandchild",
  "in-law",
] as const;

export type FamilyRelation = (typeof FAMILY_RELATION_VALUES)[number];

const FAMILY_RELATION_SET = new Set<string>(FAMILY_RELATION_VALUES);

const RELATION_SYNONYMS: Record<string, FamilyRelation> = {
  spouse: "spouse",
  husband: "spouse",
  wife: "spouse",
  parent: "parent",
  father: "parent",
  mother: "parent",
  child: "child",
  son: "child",
  daughter: "child",
  sibling: "sibling",
  brother: "sibling",
  sister: "sibling",
  guardian: "guardian",
  dependent: "dependent",
  grandparent: "grandparent",
  grandfather: "grandparent",
  grandmother: "grandparent",
  grandchild: "grandchild",
  grandson: "grandchild",
  granddaughter: "grandchild",
  "in-law": "in-law",
  in_law: "in-law",
  inlaw: "in-law",
};

const normalizeString = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeIdentityPart = (value: unknown): string =>
  normalizeString(value).replace(/\s+/g, " ");

const asId = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value).trim();

export const isFamilyRelation = (value: unknown): value is FamilyRelation => {
  return typeof value === "string" && FAMILY_RELATION_SET.has(value);
};

export const normalizeFamilyRelation = (
  value: unknown
): FamilyRelation | "" => {
  const normalized = normalizeString(value);
  if (!normalized) return "";

  const mapped = RELATION_SYNONYMS[normalized];
  if (mapped) return mapped;

  return isFamilyRelation(normalized) ? normalized : "";
};

type FamilyMemberLike = {
  relation?: unknown;
  user_id?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  date_of_birth?: unknown;
  gender?: unknown;
};

type FamilyValidationOptions = {
  currentUserId?: string | number | null;
};

const buildMemberIdentityKey = (member: FamilyMemberLike): string | null => {
  const userId = asId(member.user_id);
  if (userId) return `id:${userId}`;

  const firstName = normalizeIdentityPart(member.first_name);
  const lastName = normalizeIdentityPart(member.last_name);
  const dateOfBirth = normalizeIdentityPart(member.date_of_birth);
  const gender = normalizeIdentityPart(member.gender);

  if (!firstName && !lastName && !dateOfBirth && !gender) {
    return null;
  }

  return `person:${firstName}|${lastName}|${dateOfBirth}|${gender}`;
};

export const validateFamilyPayload = (
  family: unknown,
  options?: FamilyValidationOptions
): string | null => {
  if (!Array.isArray(family) || family.length === 0) return null;

  const currentUserId = asId(options?.currentUserId);
  const seenMemberIdentities = new Set<string>();
  let spouseCount = 0;

  for (const item of family) {
    if (!item || typeof item !== "object") continue;
    const member = item as FamilyMemberLike;

    const relation = normalizeFamilyRelation(member.relation);
    if (!relation) {
      return "Unsupported relation";
    }

    if (relation === "spouse") {
      spouseCount += 1;
      if (spouseCount > 1) {
        return "Duplicate spouse";
      }
    }

    const memberUserId = asId(member.user_id);
    if (currentUserId && memberUserId && memberUserId === currentUserId) {
      return "Self relation";
    }

    const identityKey = buildMemberIdentityKey(member);
    if (!identityKey) continue;

    if (seenMemberIdentities.has(identityKey)) {
      return "Duplicate relationship for same member";
    }

    seenMemberIdentities.add(identityKey);
  }

  return null;
};
