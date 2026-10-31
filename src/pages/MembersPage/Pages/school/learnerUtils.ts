import { useFetch } from "@/CustomHooks/useFetch";
import type { Tone } from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import { api } from "@/utils/api/apiCalls";
import type { LearnerAssessment, LearnerEnrollment, SessionMode } from "@/utils";
import { useMemo } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 7;

/** Shared fetch for the learner overview; most learner pages read from it. */
export const useLearnerOverview = () => {
  const { data, loading, error, refetch } = useFetch(api.fetch.fetchLearnerOverview);
  const enrollments = useMemo<LearnerEnrollment[]>(() => data?.data ?? [], [data]);
  const active = useMemo(() => enrollments.filter((e) => !e.completed), [enrollments]);
  return { enrollments, active, loading: loading && !data, error, refetch };
};

/** An assessed unit with the enrollment it belongs to. */
export type LearnerAssignment = LearnerAssessment & {
  programId: number;
  programTitle: string;
  enrollmentCompleted: boolean;
};

export const flattenAssignments = (enrollments: LearnerEnrollment[]): LearnerAssignment[] =>
  enrollments
    .flatMap((e) =>
      e.assessments.map((a) => ({
        ...a,
        programId: e.program.id,
        programTitle: e.program.title,
        enrollmentCompleted: e.completed,
      }))
    )
    .sort((a, b) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });

export type AssignmentState = "graded" | "submitted" | "late" | "due" | "todo" | "locked" | "excused";

export const assignmentState = (a: LearnerAssessment, now = new Date()): AssignmentState => {
  switch (a.status) {
    case "graded":
    case "overridden":
      return "graded";
    case "needs_grading":
      return "submitted";
    case "missing":
      return "late";
    case "excused":
      return "excused";
    default: {
      if (!a.isActive) return "locked";
      if (!a.dueDate) return "todo";
      const days = (new Date(a.dueDate).getTime() - now.getTime()) / DAY_MS;
      return days <= DUE_SOON_DAYS ? "due" : "todo";
    }
  }
};

export const ASSIGNMENT_STATE: Record<AssignmentState, { label: string; tone: Tone }> = {
  graded: { label: "Graded", tone: "green" },
  submitted: { label: "Submitted", tone: "blue" },
  late: { label: "Missing", tone: "red" },
  due: { label: "Due soon", tone: "amber" },
  todo: { label: "Not started", tone: "gray" },
  locked: { label: "Not open yet", tone: "gray" },
  excused: { label: "Excused", tone: "gray" },
};

/** Work the learner still owes: open and due soon, not started, or overdue. */
export const isOutstanding = (a: LearnerAssignment) =>
  !a.enrollmentCompleted && ["due", "todo", "late"].includes(assignmentState(a));

export const ASSESSMENT_TYPE: Record<string, string> = {
  assignment: "Quiz",
  "assignment-essay": "Essay",
};

export const SESSION_MODE: Record<SessionMode, { label: string; tone: Tone }> = {
  IN_PERSON: { label: "In person", tone: "gray" },
  ONLINE: { label: "Online", tone: "blue" },
  HYBRID: { label: "Hybrid", tone: "indigo" },
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Due today", "Due in 3 days", "2 days ago". */
export const relativeDay = (value: string | null | undefined, now = new Date()) => {
  if (!value) return "No due date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No due date";
  const diff = Math.round((startOfDay(d) - startOfDay(now)) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
};

export const shortDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

export const timeRange = (start: string, end: string | null) => {
  const fmt = (v: string) =>
    new Date(v).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
};

export const dayParts = (value: string) => {
  const d = new Date(value);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.getDate(),
    month: d.toLocaleDateString("en-US", { month: "short" }),
  };
};

export const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : `${Math.round(value)}%`;

/** Builds a Google Calendar link so a learner can save a session. */
export const calendarLink = (s: {
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  meetingLink: string | null;
}) => {
  const stamp = (v: string) => new Date(v).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = s.endsAt ?? new Date(new Date(s.startsAt).getTime() + 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: s.title,
    dates: `${stamp(s.startsAt)}/${stamp(end)}`,
    location: s.location ?? s.meetingLink ?? "",
    details: s.meetingLink ? `Join: ${s.meetingLink}` : "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
