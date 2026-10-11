import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type { DispatchStatus, MessageDispatch } from "@/utils/api/messaging/interfaces";
import { DispatchDetail } from "./DispatchDetail";

const STATUS_STYLE: Record<DispatchStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  QUEUED: "bg-yellow-50 text-yellow-700",
  SENT: "bg-green-50 text-green-700",
  CANCELLED: "bg-lightGray text-gray-600",
  FAILED: "bg-red-50 text-red-700",
};
const STATUS_LABEL: Record<DispatchStatus, string> = {
  SCHEDULED: "Scheduled",
  QUEUED: "Sending",
  SENT: "Sent",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

export const audienceSummary = (d: MessageDispatch) => {
  const a = d.audience;
  if (!a) return "—";
  if (a.scope === "DEPARTMENTS") return `${a.departmentIds.length} department${a.departmentIds.length === 1 ? "" : "s"}`;
  if (a.scope === "PEOPLE") return `${a.userIds.length} ${a.userIds.length === 1 ? "person" : "people"}`;
  return ["Whole church", a.includeGuests && "guests", a.includeVisitors && "visitors"].filter(Boolean).join(" + ");
};

export const channelSummary = (d: MessageDispatch) => {
  if (!d.counts) return "";
  const parts: string[] = [];
  const add = (label: string, c: { sent: number; failed: number; skipped: number }) =>
    parts.push(`${label} ${c.sent}✓${c.failed ? ` ${c.failed}✗` : ""}${c.skipped ? ` ${c.skipped} skipped` : ""}`);
  if (d.channels.sms) add("SMS", d.counts.sms);
  if (d.channels.email) add("Email", d.counts.email);
  if (d.channels.inApp) add("In-app", d.counts.inApp);
  return parts.join(" · ");
};

export const DispatchHistory = ({ refreshKey, canManage }: { refreshKey: number; canManage: boolean }) => {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MessageDispatch | null>(null);
  const [rows, setRows] = useState<MessageDispatch[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const requestId = useRef(0);

  // Plain fetch (not useFetch): useFetch toggles the full-screen loader and
  // would flash it on every poll. requestId drops out-of-order responses.
  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const response = await api.fetch.fetchMessageDispatches({ kind: "GENERAL", page, limit: 20 });
      if (id !== requestId.current) return;
      setRows(response.data ?? []);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch {
      // ApiErrorHandler has already shown the error.
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // While anything is sending or scheduled, poll so counts move.
  const active = rows.some((r) => r.status === "QUEUED" || r.status === "SCHEDULED");
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, [active, load]);

  return (
    <section className="rounded-xl border border-lightGray bg-white">
      <h3 className="border-b border-lightGray px-5 py-3 text-base font-semibold text-primary">Sent and scheduled</h3>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-500">No messages yet.</p>
      ) : (
        <ul className="divide-y divide-lightGray">
          {rows.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => setSelected(d)} className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-3 text-left hover:bg-lightGray/40">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.title}</span>
                  <span className="block text-xs text-gray-500">
                    {audienceSummary(d)} · {d.createdByName ?? "—"} ·{" "}
                    {new Date(d.scheduledFor ?? d.createdAt).toLocaleString()}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-gray-600">{channelSummary(d)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[d.status]}`}>{STATUS_LABEL[d.status]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2 border-t border-lightGray px-5 py-2 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">Previous</button>
          <span>{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">Next</button>
        </div>
      )}
      <DispatchDetail
        dispatch={selected}
        canManage={canManage}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
    </section>
  );
};
