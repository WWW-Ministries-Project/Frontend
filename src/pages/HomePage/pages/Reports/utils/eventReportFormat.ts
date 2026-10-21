import type { PillSpec } from "./reportTypes";

export type EventKind = "SERVICE" | "PROGRAM" | "ACTIVITY" | "OTHER";

/* Event type colours used across the Events module. */
export const EVENT_TYPE_COLOR: Record<EventKind, string> = {
  SERVICE: "#FFD700",
  PROGRAM: "#00CFC1",
  ACTIVITY: "#FF6B4D",
  OTHER: "#C1BFFF",
};

export const EVENT_TYPE_LABEL: Record<EventKind, string> = {
  SERVICE: "Service",
  PROGRAM: "Programme",
  ACTIVITY: "Activity",
  OTHER: "Other",
};

export const eventTypeOf = (raw: string | null | undefined): EventKind => {
  const value = String(raw || "").toUpperCase();
  return value === "SERVICE" || value === "PROGRAM" || value === "ACTIVITY" ? value : "OTHER";
};

export const eventStatusPill = (label: string | null | undefined): PillSpec =>
  label === "Approved"
    ? { tone: "success", label: "Approved" }
    : label === "Returned"
      ? { tone: "danger", label: "Returned" }
      : { tone: "warning", label: "Pending approval" };

export const fmtEventDate = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

/** "09:00" / "9:00 AM" → "09:00"; ISO date-times → local HH:mm. */
export const fmtClock = (value: string | null | undefined) => {
  if (!value) return "";
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
  }
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i.exec(text);
  if (!match) return text;
  let hours = Number(match[1]);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
};

export const fmtEventTime = (start?: string | null, end?: string | null) => {
  const a = fmtClock(start);
  const b = fmtClock(end);
  return a && b ? `${a} – ${b}` : a || b;
};
