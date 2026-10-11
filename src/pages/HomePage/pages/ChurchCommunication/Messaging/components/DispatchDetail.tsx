import { useEffect, useState } from "react";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils";
import type { QueryType } from "@/utils/interfaces";
import type {
  MessageDispatch,
  MessageRecipient,
  RecipientChannel,
  RecipientStatus,
} from "@/utils/api/messaging/interfaces";

const CHANNEL_LABEL: Record<RecipientChannel, string> = { SMS: "SMS", EMAIL: "Email", IN_APP: "In-app" };

interface DispatchDetailProps {
  dispatch: MessageDispatch | null;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export const DispatchDetail = ({ dispatch, canManage, onClose, onChanged }: DispatchDetailProps) => {
  const [rows, setRows] = useState<MessageRecipient[]>([]);
  const [channel, setChannel] = useState<RecipientChannel | "">("");
  const [status, setStatus] = useState<RecipientStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setChannel("");
    setStatus("");
    setPage(1);
  }, [dispatch?.id]);

  useEffect(() => {
    if (!dispatch) return;
    let cancelled = false;
    (async () => {
      try {
        const query: QueryType = { page, limit: 50 };
        if (channel) query.channel = channel;
        if (status) query.status = status;
        const response = await api.fetch.fetchMessageRecipients(dispatch.id, query);
        if (!cancelled) {
          setRows(response.data ?? []);
          setTotalPages(response.meta?.totalPages ?? 1);
        }
      } catch {
        // ApiErrorHandler has already shown the error.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, channel, status, page]);

  const act = async (action: "cancel" | "retry") => {
    if (!dispatch) return;
    setBusy(true);
    try {
      if (action === "cancel") {
        await api.post.cancelMessageDispatch(dispatch.id);
        showNotification("Scheduled message cancelled", "success");
      } else {
        const response = await api.post.retryFailedMessages(dispatch.id);
        showNotification(`Retrying ${response.data.retried} failed message(s)`, "success");
      }
      onChanged();
      onClose();
    } catch {
      // ApiErrorHandler has already shown the error.
    } finally {
      setBusy(false);
    }
  };

  const failed =
    (dispatch?.counts?.sms.failed ?? 0) + (dispatch?.counts?.email.failed ?? 0) + (dispatch?.counts?.inApp.failed ?? 0);

  return (
    <Modal open={!!dispatch} onClose={onClose} title={dispatch?.title ?? "Message"}>
      {dispatch && (
        <div className="flex max-h-[85vh] w-[min(94vw,760px)] flex-col">
          <div className="space-y-2 border-b border-lightGray p-5">
            <p className="text-lg font-semibold text-primary">{dispatch.title}</p>
            <p className="whitespace-pre-wrap rounded-lg bg-lightGray/50 p-3 text-sm">{dispatch.body}</p>
            {dispatch.error && <p className="text-sm text-red-600">{dispatch.error}</p>}
          </div>
          <div className="flex flex-wrap gap-2 px-5 pt-3 text-sm">
            <select value={channel} onChange={(e) => { setChannel(e.target.value as RecipientChannel | ""); setPage(1); }} className="rounded border border-lightGray p-1">
              <option value="">All channels</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
              <option value="IN_APP">In-app</option>
            </select>
            <select value={status} onChange={(e) => { setStatus(e.target.value as RecipientStatus | ""); setPage(1); }} className="rounded border border-lightGray p-1">
              <option value="">All statuses</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="SKIPPED">Skipped</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div className="flex-1 overflow-auto px-5 py-3">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-500">
                <tr><th className="py-1">Name</th><th>Channel</th><th>To</th><th>Status</th></tr>
              </thead>
              <tbody className="divide-y divide-lightGray">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5">{r.recipient_name}</td>
                    <td>{CHANNEL_LABEL[r.channel]}</td>
                    <td className="max-w-[180px] truncate">{r.address ?? "—"}</td>
                    <td>
                      {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                      {r.error && <span className="block text-xs text-gray-500">{r.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-4 text-sm text-gray-500">No recipients match.</p>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-lightGray px-5 py-3">
            <span className="text-sm">
              {totalPages > 1 && (
                <>
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="mr-2 disabled:opacity-40">Previous</button>
                  {page} / {totalPages}
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="ml-2 disabled:opacity-40">Next</button>
                </>
              )}
            </span>
            <span className="flex gap-2">
              {canManage && dispatch.status === "SCHEDULED" && (
                <Button value="Cancel message" variant="secondary" disabled={busy} onClick={() => act("cancel")} />
              )}
              {canManage && failed > 0 && dispatch.status !== "SCHEDULED" && (
                <Button value={`Retry ${failed} failed`} variant="primary" disabled={busy} onClick={() => act("retry")} />
              )}
              <Button value="Close" variant="secondary" onClick={onClose} />
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};
