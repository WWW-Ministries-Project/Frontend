type PersonWithOtherName = {
  other_name?: string | null;
};

type PayloadWithOptionalOtherNames = {
  personal_info?: PersonWithOtherName | null;
  family?: Array<(PersonWithOtherName & Record<string, unknown>) | null> | null;
};

const normalizeOtherName = (value: string | null | undefined) => value ?? "";

export const normalizeOptionalOtherNames = <T extends PayloadWithOptionalOtherNames>(
  payload: T
): T => {
  const personalInfo = payload.personal_info
    ? {
        ...payload.personal_info,
        other_name: normalizeOtherName(payload.personal_info.other_name),
      }
    : payload.personal_info;

  const family = Array.isArray(payload.family)
    ? payload.family.map((member) =>
        member
          ? {
              ...member,
              other_name: normalizeOtherName(member.other_name),
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
