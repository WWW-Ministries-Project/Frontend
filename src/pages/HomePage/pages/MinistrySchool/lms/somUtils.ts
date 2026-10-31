import {
  COHORT_STATUS,
  type DueRule,
  normalizeCohortStatus,
  type ClassFormat,
  type CohortStatus,
  type SomCohort,
  type SomEnrollment,
  type SomPerson,
} from "@/utils/api/ministrySchool/interfaces";
import { relativePath } from "@/utils/const";

const DAY_MS = 24 * 60 * 60 * 1000;

export const SOM_BASE = `/home/${relativePath.home.ministrySchool.main}`;

export const somPaths = {
  dashboard: SOM_BASE,
  programs: `${SOM_BASE}/programs`,
  program: (id: number | string, tab?: string) =>
    `${SOM_BASE}/programs/${id}${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`,
  cohorts: `${SOM_BASE}/cohorts`,
  cohort: (id: number | string, tab?: string) =>
    `${SOM_BASE}/cohorts/${id}${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`,
  class: (cohortId: number | string, classId: number | string) =>
    `${SOM_BASE}/cohorts/${cohortId}/classes/${classId}`,
  student: (
    cohortId: number | string,
    classId: number | string,
    enrollmentId: number | string
  ) => `${SOM_BASE}/cohorts/${cohortId}/classes/${classId}/student/${enrollmentId}`,
  learners: `${SOM_BASE}/learners`,
  instructors: `${SOM_BASE}/instructors`,
  library: `${SOM_BASE}/assessment-library`,
  contentLibrary: `${SOM_BASE}/content-library`,
  reports: `${SOM_BASE}/reports`,
  analytics: `${SOM_BASE}/analytics`,
  grading: (programId: number | string, cohortId: number | string, topicId?: number | string) =>
    `${SOM_BASE}/${relativePath.home.ministrySchool.instructorPortal}/${programId}/cohort/${cohortId}${
      topicId !== undefined ? `/grades/${topicId}` : ""
    }`,
  publicProgram: (title: string) => `/out/programs/${encodeURIComponent(title)}`,
};

export const personName = (person?: SomPerson | null): string => {
  if (!person) return "Unassigned";
  const fromInfo = [person.user_info?.first_name, person.user_info?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fromInfo || person.name || "Unnamed";
};

export const initials = (name: string): string => {
  const parts = name
    .replace(/^(Rev\.|Pastor|Min\.|P\.|Dr\.|Elder|Deacon(ess)?)\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

export const FORMAT_LABEL: Record<ClassFormat, string> = {
  In_Person: "In person",
  Online: "Live online",
  Hybrid: "Hybrid",
};

export const formatLabel = (format?: string | null) =>
  format && format in FORMAT_LABEL ? FORMAT_LABEL[format as ClassFormat] : "Not set";

export const UNIT_LABEL: Record<string, string> = {
  "lesson-note": "Lesson",
  video: "Video",
  live: "Live class",
  "in-person": "In person",
  pdf: "PDF",
  ppt: "Slides",
  assignment: "Quiz",
  "assignment-essay": "Essay",
};

export const unitLabel = (type?: string | null) =>
  (type && UNIT_LABEL[type]) || "Unit";

export const isAssessmentUnit = (type?: string | null) =>
  type === "assignment" || type === "assignment-essay";

export const audienceLabel = (p: {
  member_required?: boolean;
  leader_required?: boolean;
  ministry_required?: boolean;
}) => {
  const who = [
    p.member_required && "Members",
    p.leader_required && "Leaders",
    p.ministry_required && "Ministry workers",
  ].filter(Boolean);
  return who.length ? who.join(", ") : "Everyone";
};

/** Parses free-text cohort durations such as "8 weeks", "3 months", "1 year". */
export const durationInWeeks = (duration?: string | null): number | null => {
  if (!duration) return null;
  const match = duration.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(w|wk|week|m|mo|month|y|yr|year|d|day)/);
  if (!match) return null;
  const n = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith("d")) return Math.max(1, Math.round(n / 7));
  if (unit.startsWith("w")) return Math.round(n);
  if (unit.startsWith("m")) return Math.round(n * 4.345);
  return Math.round(n * 52);
};

export type CohortTiming = {
  status: CohortStatus;
  /** 0–100, share of the cohort's calendar that has elapsed. */
  pct: number;
  /** e.g. "Week 6 of 12", "Starts Jan 10", "Ended Mar 2". */
  label: string;
  week: number | null;
  totalWeeks: number | null;
};

const shortDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const cohortTiming = (
  cohort: Pick<SomCohort, "startDate" | "duration" | "status">,
  now: Date = new Date()
): CohortTiming => {
  const status = normalizeCohortStatus(cohort.status) ?? COHORT_STATUS.UPCOMING;
  const start = new Date(cohort.startDate);
  const totalWeeks = durationInWeeks(cohort.duration);
  const valid = !Number.isNaN(start.getTime());

  if (status === COHORT_STATUS.COMPLETED) {
    return { status, pct: 100, label: "Completed", week: totalWeeks, totalWeeks };
  }
  if (!valid || now < start || status === COHORT_STATUS.UPCOMING) {
    return {
      status,
      pct: 0,
      label: valid ? `Starts ${shortDate(start)}` : "Start date not set",
      week: null,
      totalWeeks,
    };
  }

  const elapsedWeeks = Math.floor((now.getTime() - start.getTime()) / (7 * DAY_MS)) + 1;
  if (!totalWeeks) {
    return { status, pct: 0, label: `Week ${elapsedWeeks}`, week: elapsedWeeks, totalWeeks };
  }
  const week = Math.min(elapsedWeeks, totalWeeks);
  return {
    status,
    pct: Math.min(100, Math.round((week / totalWeeks) * 100)),
    label: `Week ${week} of ${totalWeeks}`,
    week,
    totalWeeks,
  };
};

export type LearnerHealth = "Completed" | "On track" | "Behind" | "Not started";

/**
 * Progress-only health signal. The prototype's "at risk" also uses grades and
 * attendance; those are not tracked by the backend yet, so this compares unit
 * completion with how far through the cohort's calendar we are.
 */
export const learnerHealth = (
  enrollment: Pick<SomEnrollment, "completion_status" | "completion_percent">,
  timing: CohortTiming
): LearnerHealth => {
  if (enrollment.completion_status === "COMPLETED") return "Completed";
  if (timing.status !== COHORT_STATUS.ONGOING) return "On track";
  const pct = enrollment.completion_percent ?? 0;
  if (pct === 0 && (timing.week ?? 0) >= 3) return "Not started";
  if (timing.pct - pct >= 25) return "Behind";
  return "On track";
};

export const needsAttention = (health: LearnerHealth) =>
  health === "Behind" || health === "Not started";

export const ATTENTION_RULE =
  "Needs attention = in a live cohort and either no units done by week 3, or 25+ points behind the cohort calendar.";

export const fmtDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const describeRule = (rule: DueRule | null | undefined) => {
  if (!rule) return "No due rule";
  return rule.mode === "after"
    ? `${rule.days ?? 0} days after week ${rule.week} opens`
    : `Week ${rule.week} · ${rule.day ?? "Sun"} 23:59`;
};

/** Default grading category the backend uses when a unit has none set. */
export const defaultCategory = (type?: string | null) =>
  type === "assignment" ? "quiz" : type === "assignment-essay" ? "essay" : null;

/** Random id that also works on plain-http LAN dev hosts, where crypto.randomUUID is unavailable. */
export const makeId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Returns the URL only when it is http(s); learner-supplied links must never run script. */
export const safeHttpUrl = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};
