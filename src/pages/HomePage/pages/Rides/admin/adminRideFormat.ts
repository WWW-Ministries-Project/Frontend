/** "6 Oct 2026, 09:14" for an ISO timestamp; empty when unparseable. */
export const formatWhen = (iso: string | null | undefined) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/** "6 Oct 2026" for an ISO timestamp; empty when unparseable. */
export const formatDay = (iso: string | null | undefined) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
};
