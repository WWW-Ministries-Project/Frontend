import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { api } from "@/utils/api/apiCalls";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import type { CommunityAuditLogEntry } from "@/utils/api/community/interfaces";
import { CommunityPager } from "./CommunityPager";

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  VIEW_ANON_AUTHOR: "Viewed anonymous author",
  REMOVE: "Removed content",
  RESTORE: "Restored content",
  WARN: "Warned member",
};

const humanizeAction = (action: string) =>
  ACTION_LABELS[action] ??
  action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());

const columns: ColumnDef<CommunityAuditLogEntry>[] = [
  {
    id: "createdAt",
    header: "When",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-primaryGray">
        {new Date(row.original.createdAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </span>
    ),
  },
  {
    id: "actorName",
    header: "Administrator",
    cell: ({ row }) => (
      <span className="text-sm text-primary">{row.original.actorName}</span>
    ),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <span className="text-sm text-primary">
        {humanizeAction(row.original.action)}
      </span>
    ),
  },
  {
    id: "target",
    header: "Content",
    cell: ({ row }) => {
      const { postId, commentId } = row.original;
      if (commentId) {
        return (
          <span className="text-sm text-primaryGray">
            Comment #{commentId}
            {postId ? ` on post #${postId}` : ""}
          </span>
        );
      }
      return (
        <span className="text-sm text-primaryGray">
          {postId ? `Post #${postId}` : "—"}
        </span>
      );
    },
  },
];

/** Every moderator action and every view of an anonymous author. */
export const CommunityAuditLog = () => {
  const [skip, setSkip] = useState(0);
  const [entries, setEntries] = useState<CommunityAuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await api.fetch.fetchCommunityAuditLog({
        skip,
        take: PAGE_SIZE,
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      setEntries(rows);
      setTotal(Number(response.meta?.total ?? rows.length) || 0);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [skip]);

  useEffect(() => {
    load();
  }, [load]);

  if (failed) {
    return (
      <div className="rounded-lg border border-error/40 bg-errorBG p-4 text-sm text-error">
        Failed to load the audit log. Please try again.
      </div>
    );
  }

  if (!loading && entries.length === 0) {
    return (
      <EmptyState
        scope="section"
        msg="No activity yet"
        description="Moderator actions and views of anonymous authors are recorded here."
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <TableComponent
        columns={columns}
        data={entries}
        displayedCount={PAGE_SIZE}
        headClass="text-xs uppercase tracking-wide"
      />
      <CommunityPager
        skip={skip}
        take={PAGE_SIZE}
        total={total}
        loading={loading}
        onChange={setSkip}
      />
    </section>
  );
};
