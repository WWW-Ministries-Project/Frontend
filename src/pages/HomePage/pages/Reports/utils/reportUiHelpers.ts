import { useEffect, useState } from "react";

export const severityPill = (severity: "act" | "watch") =>
  severity === "act"
    ? { tone: "danger" as const, label: "▲ Act now" }
    : { tone: "warning" as const, label: "● Watch" };

export const initialsOf = (name: string) => {
  const parts = String(name || "")
    .replace(/^(Rev\.|Pastor|Bishop|Mr\.|Mrs\.|Ms\.|Dr\.)\s+/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

/** Tracks the viewport width so list pages can swap tables for cards. */
export const useIsWide = (breakpoint = 768) => {
  const [wide, setWide] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= breakpoint
  );
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return wide;
};

/** While `active`, browser printing shows only the element marked `data-print-root`. */
export const usePrintRoot = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    document.body.classList.add("report-printing");
    return () => document.body.classList.remove("report-printing");
  }, [active]);
};

/** Prints only the marked element once, e.g. for an "Export PDF" button. */
export const printReport = () => {
  document.body.classList.add("report-printing");
  const done = () => {
    document.body.classList.remove("report-printing");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
};
