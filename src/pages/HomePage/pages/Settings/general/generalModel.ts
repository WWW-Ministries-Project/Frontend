import type {
  AttendanceTimingSettingsConfig,
  AttendanceTimingUnit,
} from "@/utils/api/settings/attendanceTimingInterfaces";
import type {
  EligibilityRoleKey,
  RoleEligibilityConfig,
  RoleEligibilityConfigPayload,
} from "@/utils/api/settings/eligibilityInterfaces";
import type { ReportConfig, ReportConfigKey, ReportConfigPayload } from "@/utils/api/settings/reportConfigInterfaces";

/* -------------------------------------------------------------------------- */
/*                                  Sections                                  */
/* -------------------------------------------------------------------------- */

export type SectionKey =
  | "branches"
  | "positions"
  | "attendance"
  | "requisition"
  | "eligibility"
  | "reports"
  | "notifications"
  | "logs";

export const SECTION_LABEL: Record<SectionKey, string> = {
  branches: "Branches",
  positions: "Positions",
  attendance: "Attendance",
  requisition: "Requisition",
  eligibility: "Eligibility rules",
  reports: "Reports",
  notifications: "Notifications",
  logs: "Logs",
};

export const SECTION_GROUPS: { heading: string; items: SectionKey[] }[] = [
  { heading: "Organisation", items: ["branches", "positions"] },
  { heading: "Ministry rules", items: ["attendance", "requisition", "eligibility", "reports"] },
  { heading: "System", items: ["notifications", "logs"] },
];

export const SECTION_KEYS: SectionKey[] = SECTION_GROUPS.flatMap((group) => group.items);

export const isSectionKey = (value: string | null): value is SectionKey =>
  !!value && (SECTION_KEYS as string[]).includes(value);

/* -------------------------------------------------------------------------- */
/*                               Rules draft                                  */
/* -------------------------------------------------------------------------- */

/** The parts of the page that share one draft and one Save button. */
export type RulesPart = "att" | "req" | "elig" | "repExcl" | "repCfg" | "logTo";

export const PART_SECTION: Record<RulesPart, SectionKey> = {
  att: "attendance",
  req: "requisition",
  elig: "eligibility",
  repExcl: "reports",
  repCfg: "reports",
  logTo: "logs",
};

export const PART_ORDER: RulesPart[] = ["att", "req", "elig", "repExcl", "repCfg", "logTo"];

/** Requisition approval timing, in whole days (kept as typed). */
export interface ReqDraft {
  lookback: string;
  reply: string;
}

export type AttKey = "early" | "on_time" | "late";

export interface AttRuleDraft {
  /** Kept as typed so a half-typed value can be flagged rather than lost. */
  value: string;
  unit: AttendanceTimingUnit;
}

export type AttDraft = Record<AttKey, AttRuleDraft>;

export interface PositionRuleDraft {
  /** "" until a position is picked. */
  positionId: number | "";
  programIds: number[];
}

export interface EligDraft {
  roles: Record<EligibilityRoleKey, number[]>;
  positions: PositionRuleDraft[];
}

/** Report configuration as edited on the Reports section. */
export interface RepCfgDraft {
  /** Responsible department per church-wide report. */
  owners: Record<ReportConfigKey, number | null>;
  /** Day of the month department attendance reports are due. */
  due: number;
  /** Departments that don't get a monthly attendance report. */
  off: number[];
}

export interface RulesValues {
  att: AttDraft;
  req: ReqDraft;
  elig: EligDraft;
  repExcl: number[];
  repCfg: RepCfgDraft;
  logTo: number | null;
}

export const ATT_ROWS: { key: AttKey; label: string; description: string }[] = [
  { key: "early", label: "Early", description: "Checked in at least this long before the service starts" },
  { key: "on_time", label: "On time", description: "Checked in within this window after the start" },
  { key: "late", label: "Late", description: "Checked in at least this long after the start" },
];

export const UNIT_OPTIONS: { value: AttendanceTimingUnit; label: string }[] = [
  { value: "MINUTES", label: "Minutes" },
  { value: "HOURS", label: "Hours" },
];

export const ELIG_ROLES: { key: EligibilityRoleKey; label: string }[] = [
  { key: "member", label: "Member" },
  { key: "ministry_worker", label: "Ministry worker" },
  { key: "instructor", label: "Instructor" },
  { key: "life_center_leader", label: "Life center leader" },
  { key: "head_of_department", label: "Head of department" },
];

/** Church-wide reports a department can be responsible for, in display order. */
export const REPORT_TYPES: { key: ReportConfigKey; label: string; description: string }[] = [
  { key: "membership", label: "Membership", description: "New members, confirmations, transfers and profile health. Monthly." },
  { key: "visitors", label: "Visitors & follow-up", description: "First-time visitors, follow-up progress and conversion. Weekly, with a monthly roll-up." },
  { key: "events", label: "Events", description: "Events held, registrations and turn-up. Monthly." },
  { key: "attendance", label: "Church attendance", description: "Service headcounts, worker check-ins and punctuality. Weekly, with a monthly roll-up." },
  { key: "assets", label: "Assets", description: "Asset register, repairs, losses and stock checks. Monthly, with a quarterly stock check." },
  { key: "finance", label: "Finance", description: "Income, giving, pledges and approved requisitions. Weekly, with monthly, quarterly and annual roll-ups." },
  { key: "lifecenters", label: "Life centers", description: "Meetings, attendance and souls won. Monthly, with a quarterly roll-up." },
];

/** Days of the month a department attendance report can be due. */
export const DUE_DAYS = [1, 3, 5, 7, 10, 14];

export const repCfgFromConfig = (config: ReportConfig | null | undefined): RepCfgDraft => {
  const owners = REPORT_TYPES.reduce(
    (acc, type) => {
      const id = Number(config?.owners?.[type.key]);
      acc[type.key] = Number.isFinite(id) && id > 0 ? id : null;
      return acc;
    },
    {} as Record<ReportConfigKey, number | null>
  );
  const due = Number(config?.dept_attendance?.due_day);
  return {
    owners,
    due: DUE_DAYS.includes(due) ? due : 5,
    off: toIds(config?.dept_attendance?.disabled_department_ids),
  };
};

export const repCfgPayload = (draft: RepCfgDraft): ReportConfigPayload => ({
  owners: { ...draft.owners },
  dept_attendance: { due_day: draft.due, disabled_department_ids: [...draft.off] },
});

export const isWholePositive = (value: string) => {
  const parsed = Number(value);
  return value.trim() !== "" && Number.isInteger(parsed) && parsed > 0;
};

export const attFromConfig = (config: AttendanceTimingSettingsConfig | null | undefined): AttDraft => {
  const rule = (key: AttKey): AttRuleDraft => ({
    value: String(config?.[key]?.value ?? 15),
    unit: config?.[key]?.unit ?? "MINUTES",
  });
  return { early: rule("early"), on_time: rule("on_time"), late: rule("late") };
};

const toIds = (value: unknown): number[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item) && item > 0)
        )
      )
    : [];

export const eligFromConfig = (config: RoleEligibilityConfig | null | undefined): EligDraft => {
  const roles = ELIG_ROLES.reduce(
    (acc, role) => {
      acc[role.key] = toIds(config?.rules?.find((rule) => rule.role_key === role.key)?.required_program_ids);
      return acc;
    },
    {} as Record<EligibilityRoleKey, number[]>
  );
  const positions = (config?.position_rules ?? []).flatMap((rule) => {
    const positionId = Number(rule.position_id);
    return Number.isFinite(positionId) && positionId > 0
      ? [{ positionId, programIds: toIds(rule.required_program_ids) }]
      : [];
  });
  return { roles, positions };
};

export const eligPayload = (elig: EligDraft): RoleEligibilityConfigPayload => ({
  rules: ELIG_ROLES.map((role) => ({ role_key: role.key, required_program_ids: [...elig.roles[role.key]] })),
  position_rules: elig.positions.flatMap((rule) =>
    rule.positionId ? [{ position_id: rule.positionId, required_program_ids: [...rule.programIds] }] : []
  ),
});

const sorted = (ids: number[]) => [...ids].sort((a, b) => a - b);

/** Stable string form of a part, for dirty checks. */
export const normPart = <P extends RulesPart>(part: P, value: RulesValues[P]): string => {
  if (part === "att") {
    const att = value as AttDraft;
    return JSON.stringify((["early", "on_time", "late"] as AttKey[]).map((key) => [att[key].value.trim(), att[key].unit]));
  }
  if (part === "elig") {
    const elig = value as EligDraft;
    return JSON.stringify({
      roles: ELIG_ROLES.map((role) => sorted(elig.roles[role.key])),
      positions: elig.positions.map((rule) => [rule.positionId, sorted(rule.programIds)]),
    });
  }
  if (part === "req") {
    const req = value as ReqDraft;
    return JSON.stringify([req.lookback.trim(), req.reply.trim()]);
  }
  if (part === "repExcl") return JSON.stringify(sorted(value as number[]));
  if (part === "repCfg") {
    const cfg = value as RepCfgDraft;
    return JSON.stringify([REPORT_TYPES.map((type) => cfg.owners[type.key]), cfg.due, sorted(cfg.off)]);
  }
  return String(value ?? "");
};

/** Values are plain JSON, so a JSON round trip is a full copy. */
export const clonePart = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/* -------------------------------------------------------------------------- */
/*                              Small helpers                                 */
/* -------------------------------------------------------------------------- */

const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

/** The current month and the five before it, newest first. Value is YYYY-MM. */
export const recentMonths = (count = 6, now = new Date()) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_FMT.format(date),
    };
  });

export const errorText = (error: unknown) => (error instanceof Error && error.message ? error.message : undefined);

/** Native select/input look shared by the section forms. */
export const selectClass =
  "h-10 rounded-lg border border-gray-500/35 bg-white px-3 text-sm text-primary outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgb(var(--color-shadow)_/_0.08)] disabled:cursor-not-allowed disabled:bg-inputBackground disabled:opacity-60";
