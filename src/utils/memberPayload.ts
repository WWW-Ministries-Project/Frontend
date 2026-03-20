import { normalizeFamilyRelation } from "./familyRelations";

type PersonWithOtherName = {
  other_name?: string | null;
};

type PayloadWithOptionalOtherNames = {
  personal_info?: PersonWithOtherName | null;
  family?: Array<
    ((PersonWithOtherName & { relation?: unknown }) & Record<string, unknown>) | null
  > | null;
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
