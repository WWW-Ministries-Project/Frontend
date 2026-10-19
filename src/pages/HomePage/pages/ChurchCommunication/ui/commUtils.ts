import { useEffect, useState } from "react";

/** Non-component helpers shared by the Communication pages. */

/** Window width, kept in sync on resize. Tables switch to cards below 900px. */
export const useViewportWidth = () => {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
};

export const WIDE_TABLE_MIN = 900;
export const PHONE_MAX = 640;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toDate = (value?: string | null): Date | null => {
  if (!value) return null;
  // Bare YYYY-MM-DD is a calendar day; read it in local time, not UTC.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "15 Nov 2026" */
export const formatDay = (value?: string | null) => {
  const date = toDate(value);
  return date ? `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` : "";
};

/** "13 Nov, 6:00 PM" */
export const formatDayTime = (value?: string | null) => {
  const date = toDate(value);
  if (!date) return "";
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${hours % 12 || 12}:${minutes} ${hours < 12 ? "AM" : "PM"}`;
};

/** "12 min ago", "3 h ago", "2 days ago", then the date. */
export const timeAgo = (value?: string | null) => {
  const date = toDate(value);
  if (!date) return "";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days} day${days > 1 ? "s" : ""} ago` : formatDay(value);
};

/** YYYY-MM-DD for today in local time. */
export const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

/** YYYY-MM-DD from any stored date, or "". */
export const toIsoDay = (value?: string | null) => (value ? String(value).slice(0, 10) : "");

export const initialsOf = (name?: string | null) =>
  String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;

/** Appends `{token}` to text, adding a space when needed. */
export const appendToken = (text: string, token: string) =>
  `${text}${text && !text.endsWith(" ") ? " " : ""}{${token}}`;

/** Message thrown by an API call, or a fallback. */
export const errorText = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message) return message;
  }
  return fallback;
};
