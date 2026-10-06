import { LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";
import { showConfirmDialog, showNotification } from "@/pages/HomePage/utils";
import type {
  CommunityModerationItem,
  CommunityModerationStatus,
} from "@/utils/api/community/interfaces";
import { REPORT_REASON_LABEL } from "@/pages/HomePage/pages/Community/utils/communityConstants";
import { plural } from "@/pages/HomePage/pages/Community/utils/communityHelpers";

type StatusFilter = CommunityModerationStatus | "ALL";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "PENDING", label: "Needs review" },
  { value: "REMOVED", label: "Removed" },
  { value: "RESTORED", label: "Restored" },
  { value: "ALL", label: "All" },
];

const STATUS_PILL: Record<
  CommunityModerationStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Needs review", className: "bg-amber-50 text-amber-800" },
  REMOVED: { label: "Removed", className: "bg-rose-50 text-rose-700" },
  RESTORED: { label: "Restored", className: "bg-teal-50 text-teal-700" },
};

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

interface CommunityReportsQueueProps {
  canManage: boolean;
}

export const CommunityReportsQueue = ({
  canManage,
}: CommunityReportsQueueProps) => {
  const [status, setStatus] = useState<StatusFilter>("PENDING");
  const [items, setItems] = useState<CommunityModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await api.fetch.fetchCommunityModerationReports({
        status,
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (
    item: CommunityModerationItem,
    action: "remove" | "restore" | "warn"
  ) => {
    const kind = item.kind === "POST" ? "posts" : "comments";
    const id = item.kind === "POST" ? item.postId : item.commentId;
    if (!id) return;
    setBusyKey(item.key);
    try {
      await api.post.moderateCommunityContent(kind, id, action);
      showNotification(
        action === "warn"
          ? "Warning sent"
          : action === "remove"
            ? "Content removed"
            : "Content restored",
        "success"
      );
      await load();
    } catch {
      // ApiErrorHandler has already shown the error.
    } finally {
      setBusyKey(null);
    }
  };

  const pendingCount = items.filter((item) => item.status === "PENDING").length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={status === option.value}
              onClick={() => setStatus(option.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm",
                status === option.value
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-lightGray bg-white text-primaryGray hover:bg-lightGray/40"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {status === "PENDING" && !loading && !failed ? (
          <span className="text-sm text-primaryGray">
            Moderators only ·{" "}
            {pendingCount
              ? `${plural(pendingCount, "item")} to review`
              : "All caught up"}
          </span>
        ) : null}
      </div>

      {failed ? (
        <div className="rounded-lg border border-error/40 bg-errorBG p-4 text-sm text-error">
          Failed to load reported content. Please try again.
        </div>
      ) : loading && !items.length ? (
        <div className="rounded-lg border border-lightGray p-4 text-sm text-primaryGray">
          Loading reported content…
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          scope="section"
          msg={status === "PENDING" ? "All caught up" : "Nothing here"}
          description={
            status === "PENDING"
              ? "There is no reported content waiting for review."
              : "No reported content matches this filter."
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {items.map((item) => {
            const pill = STATUS_PILL[item.status] ?? STATUS_PILL.PENDING;
            const history = [...item.reports].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const latest = history[0];
            const busy = busyKey === item.key;
            return (
              <li
                key={item.key}
                className="flex flex-col gap-3 rounded-2xl border border-lightGray bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-lightGray/50 px-2 py-0.5 text-[11px] font-bold tracking-wider text-primary">
                    {item.kind}
                  </span>
                  {item.warned ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      Warning sent
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold",
                      pill.className
                    )}
                  >
                    {pill.label}
                  </span>
                </div>

                <div className="rounded-xl bg-lightGray/30 p-3">
                  <p className="mb-1 text-xs text-primaryGray">
                    Members see:{" "}
                    <strong className="text-primary">{item.shownAs}</strong>
                  </p>
                  <p className="whitespace-pre-line break-words text-sm text-primary">
                    {item.body}
                  </p>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-primaryGray">Reason</dt>
                  <dd className="text-primary">
                    {latest
                      ? REPORT_REASON_LABEL[latest.reason] ?? latest.reason
                      : "—"}
                  </dd>
                  <dt className="text-primaryGray">Original author</dt>
                  <dd className="text-primary">
                    {item.author?.name ?? "Unknown"}
                    {item.isAnonymous ? (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-primaryGray">
                        <LockClosedIcon className="h-3.5 w-3.5" />
                        Posted anonymously
                      </span>
                    ) : null}
                  </dd>
                  <dt className="text-primaryGray">Audience</dt>
                  <dd className="text-primary">{item.audienceLabel}</dd>
                </dl>

                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primaryGray">
                    Report history · {plural(item.reports.length, "report")}
                  </p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {history.map((report, index) => (
                      <li
                        key={`${report.createdAt}-${index}`}
                        className="flex flex-col border-l-2 border-lightGray pl-3"
                      >
                        <span className="text-xs text-primaryGray">
                          {formatWhen(report.createdAt)}
                        </span>
                        <span className="text-primary">
                          {REPORT_REASON_LABEL[report.reason] ?? report.reason}
                          {report.reporterName
                            ? ` · reported by ${report.reporterName}`
                            : ""}
                        </span>
                        {report.details ? (
                          <span className="text-xs text-primaryGray">
                            “{report.details}”
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>

                {canManage ? (
                  <div className="mt-auto flex flex-wrap gap-2 border-t border-lightGray pt-3">
                    <button
                      type="button"
                      disabled={busy || item.status === "REMOVED"}
                      onClick={() =>
                        showConfirmDialog(
                          `Remove this ${item.kind === "POST" ? "post" : "comment"}?`,
                          () => act(item, "remove"),
                          {
                            message: "Members will no longer see it.",
                            confirmLabel: "Remove",
                          }
                        )
                      }
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      disabled={busy || item.status === "RESTORED"}
                      onClick={() => act(item, "restore")}
                      className="rounded-lg border border-lightGray px-3 py-1.5 text-sm font-medium text-primary hover:bg-lightGray/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      disabled={busy || item.warned}
                      onClick={() =>
                        showConfirmDialog(
                          "Warn this member?",
                          () => act(item, "warn"),
                          {
                            message:
                              "They will get a notification from the moderators. Their identity is not shared with anyone else.",
                            confirmLabel: "Send warning",
                          }
                        )
                      }
                      className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Warn member
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="flex items-start gap-2 text-xs text-primaryGray">
        <ShieldCheckIcon className="h-4 w-4 flex-none" />
        Original authors of anonymous posts are visible only to authorised
        administrators. Every view is logged.
      </p>
    </section>
  );
};
