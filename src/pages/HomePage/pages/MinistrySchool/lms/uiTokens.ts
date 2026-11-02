/**
 * SoM design tokens — single source of truth for pill/badge tones.
 *
 * Colors are expressed as theme-aware Tailwind utility classes (bg-*-50 /
 * text-*-700 / border-*-200). The Tailwind config reroutes every color scale
 * through CSS variables that flip for dark mode, so these tones reproduce the
 * light-mode look of the design prototype while keeping dark mode working — we
 * deliberately avoid hardcoded hex here.
 *
 * The named maps below mirror the prototype's constant tables (FMT / UNIT / QT /
 * STS / PSTAT / CSTAT and gradebook cell states).
 */

export type Tone =
  | "gray"
  | "green"
  | "amber"
  | "blue"
  | "red"
  | "indigo"
  | "cyan"
  | "fuchsia"
  | "orange";

export const TONE: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-700 border-gray-200",
  green: "bg-green-50 text-green-700 border-green-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  red: "bg-red-50 text-red-800 border-red-200",
  indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  fuchsia: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
  orange: "bg-orange-50 text-orange-800 border-orange-200",
};

/** Solid dot color per tone (for legends, timeline nodes). */
export const TONE_DOT: Record<Tone, string> = {
  gray: "bg-gray-400",
  green: "bg-green-600",
  amber: "bg-amber-500",
  blue: "bg-blue-600",
  red: "bg-red-600",
  indigo: "bg-indigo-600",
  cyan: "bg-cyan-600",
  fuchsia: "bg-fuchsia-600",
  orange: "bg-orange-600",
};

/** Delivery / format mode (prototype `FMT`). */
export const DELIVERY_TONE: Record<string, Tone> = {
  "In person": "indigo",
  In_Person: "indigo",
  "Live online": "cyan",
  Online: "cyan",
  Hybrid: "fuchsia",
  "Self-paced": "green",
  "Self paced": "green",
};

/** Unit / content type (prototype `UNIT`). */
export const UNIT_TONE: Record<string, Tone> = {
  Lesson: "gray",
  Reading: "amber",
  Video: "cyan",
  PDF: "red",
  Slides: "orange",
  Quiz: "amber",
  Essay: "fuchsia",
  Exam: "red",
  "Live class": "indigo",
  Live: "green",
  Project: "gray",
};

/** Question type (prototype `QT`). */
export const QUESTION_TONE: Record<string, Tone> = {
  "Multiple choice": "indigo",
  "True / false": "cyan",
  "True/false": "cyan",
  "Short answer": "green",
  Essay: "fuchsia",
};

/** Learner health (prototype `STS`). */
export const LEARNER_STATUS_TONE: Record<string, Tone> = {
  "On track": "green",
  "At risk": "red",
  Behind: "red",
  Watch: "amber",
  Completed: "blue",
  "Not started": "amber",
};

/** Program publish state (prototype `PSTAT`). */
export const PROGRAM_STATUS_TONE: Record<string, Tone> = {
  Published: "green",
  Active: "green",
  Draft: "gray",
  Inactive: "gray",
  Archived: "gray",
};

/** Cohort state (prototype `CSTAT`). */
export const COHORT_STATUS_TONE: Record<string, Tone> = {
  Ongoing: "green",
  Upcoming: "amber",
  Completed: "blue",
};

/** Assignment / submission state. */
export const ASSIGNMENT_STATUS_TONE: Record<string, Tone> = {
  Graded: "green",
  Passed: "green",
  Submitted: "blue",
  "Due soon": "amber",
  Due: "amber",
  Pending: "amber",
  "Awaiting release": "indigo",
  "Awaiting grade": "blue",
  Late: "red",
  Missing: "red",
  "Below pass": "red",
  "Not started": "gray",
  Excused: "gray",
  "To do": "gray",
};

/** Gradebook cell state. */
export type CellState = "missing" | "toGrade" | "excused" | "pass" | "fail" | "score" | "empty";

export const CELL_TONE: Record<CellState, Tone | null> = {
  missing: "red",
  toGrade: "amber",
  excused: "gray",
  pass: "green",
  fail: "red",
  score: null, // plain text, colored by pass/fail at call site
  empty: null,
};

/**
 * Combined status → tone resolution, widest to narrowest. Lets <StatusPill>
 * accept any status string from any surface and pick a sensible tone.
 */
export const STATUS_TONE: Record<string, Tone> = {
  ...COHORT_STATUS_TONE,
  ...PROGRAM_STATUS_TONE,
  ...LEARNER_STATUS_TONE,
  ...ASSIGNMENT_STATUS_TONE,
  ...DELIVERY_TONE,
  ...UNIT_TONE,
};

export const resolveStatusTone = (status: string): Tone => STATUS_TONE[status] ?? "gray";

/**
 * Banner / inline-alert palettes (prototype banner variants). Uses -200 borders
 * and -800 text for a calmer, filled look than pills.
 */
export type BannerTone = "warn" | "info" | "success" | "preview" | "danger" | "neutral";

export const BANNER_TONE: Record<BannerTone, string> = {
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  info: "bg-blue-50 text-blue-800 border-blue-200",
  success: "bg-green-50 text-green-800 border-green-200",
  preview: "bg-orange-50 text-orange-800 border-orange-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  neutral: "bg-gray-50 text-gray-700 border-gray-200",
};
