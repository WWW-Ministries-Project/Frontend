import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { api } from "@/utils/api/apiCalls";
import { showConfirmDialog, showNotification } from "@/pages/HomePage/utils";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import type {
  CommunityAdminPost,
  CommunityPostType,
} from "@/utils/api/community/interfaces";
import { PostTypePill } from "@/pages/HomePage/pages/Community/components/PostTypePill";
import { POST_TYPES } from "@/pages/HomePage/pages/Community/utils/communityConstants";
import {
  audienceLabels,
  errorMessage,
  totalReactions,
} from "@/pages/HomePage/pages/Community/utils/communityHelpers";
import { CommunityPager } from "./CommunityPager";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

interface CommunityAdminPostsProps {
  canManage: boolean;
  /** Bumped by the page after a new church message is posted. */
  refreshKey: number;
}

const selectClass =
  "h-10 rounded-lg border border-lightGray bg-white px-3 text-sm text-primary focus:border-primary focus:outline-none";

export const CommunityAdminPosts = ({
  canManage,
  refreshKey,
}: CommunityAdminPostsProps) => {
  const [type, setType] = useState<CommunityPostType | "">("");
  const [status, setStatus] = useState<"" | "ACTIVE" | "REMOVED">("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [skip, setSkip] = useState(0);
  const [posts, setPosts] = useState<CommunityAdminPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setSkip(0);
  }, [type, status, query]);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await api.fetch.fetchCommunityAdminPosts({
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(query ? { q: query } : {}),
        skip,
        take: PAGE_SIZE,
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      setPosts(rows);
      setTotal(Number(response.meta?.total ?? rows.length) || 0);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [type, status, query, skip]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const moderate = useCallback(
    async (post: CommunityAdminPost, action: "remove" | "restore") => {
      setBusyId(post.id);
      try {
        await api.post.moderateCommunityContent("posts", post.id, action);
        showNotification(
          action === "remove" ? "Post removed" : "Post restored",
          "success"
        );
        await load();
      } catch (error) {
        showNotification(
          errorMessage(error, "The post could not be updated."),
          "error",
          "Community"
        );
      } finally {
        setBusyId(null);
      }
    },
    [load]
  );

  const columns = useMemo<ColumnDef<CommunityAdminPost>[]>(
    () => [
      {
        id: "post",
        header: "Post",
        cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="flex max-w-md flex-col gap-1 py-1">
              <div className="flex flex-wrap items-center gap-2">
                <PostTypePill type={post.type} />
                {post.isImportant ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    Important
                  </span>
                ) : null}
              </div>
              <p className="line-clamp-2 whitespace-pre-line text-sm text-primary">
                {post.body}
              </p>
              {post.images.length ? (
                <span className="text-xs text-primaryGray">
                  {post.images.length} photo{post.images.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "author",
        header: "Author",
        cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-primary">
                {post.realAuthor?.name ?? post.author?.name ?? "Unknown"}
              </span>
              {post.isAnonymous ? (
                <span className="inline-flex w-fit rounded-full border border-lightGray bg-lightGray/40 px-2 py-0.5 text-[11px] font-semibold text-primaryGray">
                  🔒 Anonymous
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "audience",
        header: "Audience",
        cell: ({ row }) => (
          <span className="text-sm text-primary">
            {audienceLabels(row.original.audience).short}
          </span>
        ),
      },
      {
        id: "engagement",
        header: "Engagement",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-primaryGray">
            {totalReactions(row.original.reactions)} reactions ·{" "}
            {row.original.commentCount} comments
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Posted",
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
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.status === "REMOVED" ? (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
              Removed
            </span>
          ) : (
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
              Active
            </span>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const post = row.original;
          if (!canManage) return null;
          const removed = post.status === "REMOVED";
          return (
            <button
              type="button"
              disabled={busyId === post.id}
              onClick={(event) => {
                event.stopPropagation();
                if (removed) {
                  moderate(post, "restore");
                  return;
                }
                showConfirmDialog(
                  "Remove this post?",
                  () => moderate(post, "remove"),
                  {
                    message:
                      "Members will no longer see it. You can restore it later.",
                    confirmLabel: "Remove",
                  }
                );
              }}
              className={
                removed
                  ? "rounded-lg border border-lightGray px-3 py-1.5 text-sm font-medium text-primary hover:bg-lightGray/40 disabled:opacity-50"
                  : "rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              }
            >
              {removed ? "Restore" : "Remove"}
            </button>
          );
        },
      },
    ],
    [busyId, canManage, moderate]
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-primaryGray">
          Type
          <select
            className={selectClass}
            value={type}
            onChange={(event) =>
              setType(event.target.value as CommunityPostType | "")
            }
          >
            <option value="">All types</option>
            {(Object.keys(POST_TYPES) as CommunityPostType[]).map((key) => (
              <option key={key} value={key}>
                {POST_TYPES[key].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-primaryGray">
          Status
          <select
            className={selectClass}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "" | "ACTIVE" | "REMOVED")
            }
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="REMOVED">Removed</option>
          </select>
        </label>
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-medium text-primaryGray">
          Search
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search post text or author"
            className={selectClass}
          />
        </label>
      </div>

      {failed ? (
        <div className="rounded-lg border border-error/40 bg-errorBG p-4 text-sm text-error">
          Failed to load community posts. Please try again.
        </div>
      ) : !loading && posts.length === 0 ? (
        <EmptyState
          scope="section"
          msg="No posts found"
          description="Posts members share in Community will appear here."
        />
      ) : (
        <>
          <TableComponent
            columns={columns}
            data={posts}
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
        </>
      )}
    </section>
  );
};
