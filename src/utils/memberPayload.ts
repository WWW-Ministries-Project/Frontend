import { normalizeFamilyRelation } from "./familyRelations";

type PersonWithOtherName = {
  other_name?: string | null;
};

type PayloadWithOptionalOtherNames = {
  personal_info?: PersonWithOtherName | null;
  family?: Array<
    (PersonWithOtherName & { relation?: unknown }) | null
  > | null;
};

type PayloadWithDepartments = {
  is_user?: unknown;
  department_positions?: unknown;
};

const normalizeOptionalText = (value: string | null | undefined) => value ?? "";

export const normalizeOptionalOtherNames = <T extends PayloadWithOptionalOtherNames>(
  payload: T
): T => {
  const personalInfo = payload.personal_info
    ? {
        ...payload.personal_info,
        title: normalizeOptionalText(
          (payload.personal_info as PersonWithOtherName & { title?: string | null })
            .title
        ),
        other_name: normalizeOptionalText(payload.personal_info.other_name),
      }
    : payload.personal_info;

  const family = Array.isArray(payload.family)
    ? payload.family.map((member) =>
        member
          ? {
              ...member,
              title: normalizeOptionalText(
                (member as PersonWithOtherName & { title?: string | null }).title
              ),
              other_name: normalizeOptionalText(member.other_name),
              relation: normalizeFamilyRelation(member.relation),
            }
          : member
      )
    : payload.family;

  return {
    ...payload,
    personal_info: personalInfo,
    family,
  };
};

/**
 * Keeps `department_positions` clean before it reaches the API: a non–ministry
 * worker sends no departments at all, and a worker sends only rows that name a
 * department. The backend rejects a row with an empty `department_id`, so a
 * leftover blank row (e.g. the default row on a fresh form) would otherwise fail
 * the whole save even though departments are optional for ordinary members.
 */
export const sanitizeMemberDepartmentPositions = <T extends PayloadWithDepartments>(
  payload: T
): T => {
  const isMinistryWorker =
    payload.is_user === true ||
    payload.is_user === "true" ||
    payload.is_user === 1 ||
    payload.is_user === "1";

  const rows = Array.isArray(payload.department_positions)
    ? payload.department_positions
    : [];

  const cleaned = isMinistryWorker
    ? rows.filter(
        (row) =>
          row &&
          String((row as { department_id?: unknown }).department_id ?? "")
            .trim() !== ""
      )
    : [];

  return {
    ...payload,
    department_positions: cleaned,
  } as T;
};
