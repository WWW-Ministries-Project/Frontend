import type { PillTone } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  MEMBER_STAGES,
  formatDate,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import type { DirectoryMember } from "@/pages/HomePage/pages/Members/Components/directory/directoryHelpers";
import type { IFamilyMemberRecord, IMemberInfo } from "@/utils/api/members/interfaces";
import { normalizeFamilyRelation } from "@/utils/familyRelations";

/**
 * `user/get-user` flattens `user` + `user_info`, so it carries a few fields the
 * shared `IMemberInfo` type does not declare. `confirmed_at` / `functional_at`
 * are new on the backend and may be missing on older records.
 */
export type ProfileMember = IMemberInfo & {
  branch_id?: number | null;
  other_number?: string | null;
  created_at?: string | null;
  date_joined?: string | null;
  confirmed_at?: string | null;
  functional_at?: string | null;
  is_restricted?: boolean;
  work_info?: {
    name_of_institution?: string | null;
    industry?: string | null;
    position?: string | null;
    employment_status?: string | null;
    school_name?: string | null;
  } | null;
};

export type ProfileTab =
  | "basic"
  | "contact"
  | "church"
  | "employment"
  | "family"
  | "programs";

export const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: "basic", label: "Basic information" },
  { key: "contact", label: "Contact" },
  { key: "church", label: "Church" },
  { key: "employment", label: "Employment / Schooling" },
  { key: "family", label: "Family" },
  { key: "programs", label: "Programs" },
];

export const parseProfileTab = (value: string | null): ProfileTab =>
  PROFILE_TABS.some((tab) => tab.key === value) ? (value as ProfileTab) : "basic";

const clean = (value?: string | null) => (typeof value === "string" ? value.trim() : "");

const titleCase = (value?: string | null) =>
  clean(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const fullNameOf = (member: ProfileMember) => {
  const parts = [
    member.title,
    member.first_name,
    member.other_name,
    member.last_name,
  ]
    .map(clean)
    .filter(Boolean);
  return parts.length ? parts.join(" ") : clean(member.name) || "Unnamed member";
};

export const ageOf = (value?: string | null): number | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const beforeBirthday =
    now.getMonth() < date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() < date.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
};

export const dateOfBirthLabel = (value?: string | null) => {
  const formatted = formatDate(value);
  if (formatted === "—") return "";
  const age = ageOf(value);
  return age === null ? formatted : `${formatted} (${age} yrs)`;
};

export const maritalLabel = (value?: string | null) => titleCase(value);

export const genderLabel = (value?: string | null) => titleCase(value);

export const phoneLabel = (countryCode?: string | null, number?: string | null) =>
  clean(number) ? [clean(countryCode), clean(number)].filter(Boolean).join(" ") : "";

export const membershipTypeLabel = (type?: string | null) => {
  if (type === "ONLINE") return "Online e-church family";
  if (type === "IN_HOUSE") return "In-person church family";
  return "";
};

export const joinedDateOf = (member: ProfileMember) =>
  member.member_since || member.date_joined || member.created_at || null;

const EMPLOYMENT_LABELS: Record<string, string> = {
  student: "Student",
  employed: "Employed",
  self_employed: "Self-employed",
  unemployed: "Unemployed",
  retired: "Retired",
};

export const employmentRows = (member: ProfileMember): [string, string][] => {
  const work = member.work_info ?? {};
  const status = clean(work.employment_status).toLowerCase();
  const statusLabel = EMPLOYMENT_LABELS[status] ?? titleCase(status);
  if (status === "student") {
    return [
      ["Current status", statusLabel],
      ["School", clean(work.school_name) || clean(work.name_of_institution)],
      ["Programme of study", clean(work.position)],
    ];
  }
  return [
    ["Current status", statusLabel],
    ["Organisation", clean(work.name_of_institution)],
    ["Industry", clean(work.industry)],
    ["Position / role", clean(work.position)],
  ];
};

/* -------------------------------------------------------------------------- */
/*                                 Departments                                */
/* -------------------------------------------------------------------------- */

export interface ProfileDepartment {
  key: string;
  departmentId: number | null;
  department: string;
  position: string;
}

export const departmentsOf = (member: ProfileMember): ProfileDepartment[] => {
  const rows = Array.isArray(member.department_positions)
    ? member.department_positions
    : [];
  return rows
    .map((row, index): ProfileDepartment | null => {
      if (typeof row === "string") {
        return row
          ? { key: `${row}-${index}`, departmentId: null, department: row, position: "" }
          : null;
      }
      if (!row) return null;
      const id = Number(row.department_id);
      const department = clean(row.department_name);
      if (!department && !Number.isFinite(id)) return null;
      return {
        key: `${row.department_id ?? "d"}-${row.position_id ?? "p"}-${index}`,
        departmentId: Number.isFinite(id) && id > 0 ? id : null,
        department: department || "Department",
        position: clean(row.position_name),
      };
    })
    .filter((row): row is ProfileDepartment => row !== null);
};

/* -------------------------------------------------------------------------- */
/*                                   Family                                   */
/* -------------------------------------------------------------------------- */

export const familyOf = (member: ProfileMember): IFamilyMemberRecord[] =>
  Array.isArray(member.family) ? member.family : [];

export const relationOf = (person: IFamilyMemberRecord) =>
  normalizeFamilyRelation(person.relation);

export const personName = (person: IFamilyMemberRecord) =>
  [person.first_name, person.other_name, person.last_name]
    .map((part) => clean(part as string | undefined))
    .filter(Boolean)
    .join(" ") || "Unnamed";

export const childMeta = (person: IFamilyMemberRecord) => {
  const age = ageOf(person.date_of_birth);
  const dob = formatDate(person.date_of_birth);
  return [
    genderLabel(person.gender),
    age === null ? "" : `${age} yrs`,
    dob === "—" ? "" : dob,
  ]
    .filter(Boolean)
    .join(" · ");
};

/* -------------------------------------------------------------------------- */
/*                                  Programs                                  */
/* -------------------------------------------------------------------------- */

export interface ProfileProgram {
  key: string;
  name: string;
  completed: boolean;
  statusLabel: string;
  tone: PillTone;
  cohort: string;
  meta: string;
  /** null when the backend sent no progress (older API). */
  percent: number | null;
}

export const programsOf = (member: ProfileMember): ProfileProgram[] =>
  (member.enrolled_programs?.items ?? []).map((item, index) => {
    const completed = Boolean(item.status?.completed);
    const cohort = clean(item.cohort?.name) || "No cohort";
    const reported =
      typeof item.progress_percent === "number" && Number.isFinite(item.progress_percent)
        ? Math.min(100, Math.max(0, Math.round(item.progress_percent)))
        : null;
    const percent = completed ? 100 : reported;
    const meta =
      percent !== null
        ? `${percent}% complete · ${cohort}`
        : [
            item.enrolled_at ? `Enrolled ${formatDate(item.enrolled_at)}` : "In progress",
            cohort,
          ].join(" · ");
    return {
      key: `${item.enrollment_id}-${index}`,
      name: clean(item.program?.name) || "Program",
      completed,
      statusLabel: completed ? "Completed" : titleCase(item.status?.label) || "In progress",
      tone: completed ? "success" : "info",
      cohort,
      meta,
      percent,
    };
  });

/* -------------------------------------------------------------------------- */
/*                                   Journey                                  */
/* -------------------------------------------------------------------------- */

export const stageIndexOf = (status?: string | null) => {
  const index = MEMBER_STAGES.findIndex((stage) => stage.value === status);
  return index < 0 ? 0 : index;
};

export interface JourneyStep {
  key: string;
  label: string;
  sub: string;
  done: boolean;
  current: boolean;
}

const sourceStepOf = (member: ProfileMember): JourneyStep | null => {
  const source = member.member_source;
  if (!source) return null;
  if (source.type === "VISITOR") {
    const { first_visit_at, visit_count } = source.visitor;
    const visits = visit_count === 1 ? "1 visit" : `${visit_count} visits`;
    return {
      key: "VISITOR",
      label: "Visitor",
      sub: first_visit_at
        ? `First visited ${formatDate(first_visit_at)} · ${visits}`
        : "First visited before joining",
      done: true,
      current: false,
    };
  }
  const { date_won, life_center_name } = source.soul_won;
  return {
    key: "SOUL_WON",
    label: "Soul won",
    sub:
      [
        date_won ? `Won ${formatDate(date_won)}` : "Won through a life center",
        life_center_name,
      ]
        .filter(Boolean)
        .join(" · "),
    done: true,
    current: false,
  };
};

export const journeyOf = (member: ProfileMember): JourneyStep[] => {
  const sourceStep = sourceStepOf(member);
  return [...(sourceStep ? [sourceStep] : []), ...stageStepsOf(member)];
};

const stageStepsOf = (member: ProfileMember): JourneyStep[] => {
  const current = stageIndexOf(member.status);
  const dates: Record<string, string | null | undefined> = {
    UNCONFIRMED: joinedDateOf(member),
    CONFIRMED: member.confirmed_at,
    MEMBER: member.functional_at,
  };
  return MEMBER_STAGES.map((stage, index) => {
    const date = formatDate(dates[stage.value]);
    // Members who reached a stage before the backend recorded these dates
    // have no timestamp; say the stage is done rather than inventing a date.
    const sub =
      date !== "—"
        ? date
        : index < current
          ? "Completed"
          : index === current + 1
          ? `Up next · ${stage.description.toLowerCase()}`
          : stage.description;
    return {
      key: stage.value,
      label: stage.label,
      sub,
      done: index <= current,
      current: index === current,
    };
  });
};

/** Shape the directory dialogs expect, built from a get-user record. */
export const toDirectoryMember = (member: ProfileMember): DirectoryMember => ({
  id: Number(member.id),
  name: fullNameOf(member),
  email: member.email,
  member_id: member.member_id,
  created_at: member.created_at ?? "",
  is_active: member.is_active,
  is_user: member.is_user,
  department_id: member.department_id ?? null,
  department_name: "",
  membership_type: member.membership_type,
  status: member.status,
  country_code: member.country_code,
  primary_number: member.primary_number,
  title: member.title,
  photo: member.photo,
});
