import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";
import { decodeToken } from "@/utils/helperFunctions";
import type { QueryType } from "@/utils/interfaces";
import type {
  CommunityDepartment,
  CommunityFeedFilter,
  CommunityPost,
} from "@/utils/api/community/interfaces";
import { CommunityAvatar } from "./components/CommunityAvatar";
import { CommunityNotificationsPanel } from "./components/CommunityNotificationsPanel";
import { CommunitySheet } from "./components/CommunitySheet";
import {
  CreatePostModal,
  type AudienceSelection,
} from "./components/CreatePostModal";
import { MyCommunitiesPanel } from "./components/MyCommunitiesPanel";
import { BlockedMembersPanel } from "./components/BlockedMembersPanel";
import { PostCard } from "./components/PostCard";
import { useCommunityMe } from "./hooks/useCommunityMe";
import {
  FEED_EMPTY_COPY,
  FEED_FILTERS,
  FEED_PAGE_SIZE,
} from "./utils/communityConstants";
import { plural } from "./utils/communityHelpers";

const ADMIN_REPORTS_PATH = "/home/communication/community?tab=reported";

/** /member/community. Rendered inside CommunityLayout, which handles guests
 *  and provides the shared interactions. */
const MemberCommunityFeed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = decodeToken();
  const viewerName = token?.name ?? "";
  const { me, loaded: meLoaded, refresh: refreshMe, setUnread } =
    useCommunityMe();

  // `?department=` is only honoured for one of the viewer's own departments;
  // anything else falls back to the whole feed.
  const departmentParam = Number(searchParams.get("department"));
  const requestedDepartment =
    Number.isFinite(departmentParam) && departmentParam > 0
      ? departmentParam
      : null;
  const department = requestedDepartment
    ? me.departments.find((item) => item.id === requestedDepartment)
    : undefined;
  const departmentId = department?.id ?? null;
  // Until /community/me answers we cannot tell whether the requested
  // department is the viewer's, so hold the first load.
  const waitingForMe = Boolean(requestedDepartment) && !meLoaded;

  const [filter, setFilter] = useState<CommunityFeedFilter>("all");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerAudience, setComposerAudience] = useState<
    AudienceSelection | undefined
  >(undefined);
  const [communitiesOpen, setCommunitiesOpen] = useState(false);
  const [blockRefresh, setBlockRefresh] = useState(0);
  const removedRef = useRef(
    new Map<number, { post: CommunityPost; index: number }>()
  );
  const requestRef = useRef(0);

  const feedQuery = useMemo<QueryType>(
    (): QueryType =>
      departmentId ? { filter: "department", departmentId } : { filter },
    [departmentId, filter]
  );

  const load = useCallback(
    async (skip: number) => {
      const requestId = ++requestRef.current;
      if (skip === 0) {
        setLoading(true);
        setFailed(false);
      } else {
        setLoadingMore(true);
      }
      try {
        const response = await api.fetch.fetchCommunityFeed({
          ...feedQuery,
          skip,
          take: FEED_PAGE_SIZE,
        });
        if (requestId !== requestRef.current) return;
        const page = Array.isArray(response.data) ? response.data : [];
        setPosts((current) => {
          if (skip === 0) return page;
          const seen = new Set(current.map((post) => post.id));
          return [...current, ...page.filter((post) => !seen.has(post.id))];
        });
        setTotal(Number(response.meta?.total ?? page.length) || 0);
      } catch {
        if (requestId === requestRef.current && skip === 0) setFailed(true);
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [feedQuery]
  );

  useEffect(() => {
    if (!waitingForMe) load(0);
  }, [load, waitingForMe]);

  // Dashboard "Share a testimony or prayer request…" lands here with ?compose=1.
  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      setComposerAudience(undefined);
      setComposerOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("compose");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const updatePost = (updated: CommunityPost) =>
    setPosts((current) =>
      current.map((post) => (post.id === updated.id ? updated : post))
    );

  const removePost = (postId: number) => {
    setPosts((current) => {
      const index = current.findIndex((post) => post.id === postId);
      if (index >= 0) {
        removedRef.current.set(postId, { post: current[index], index });
      }
      return current.filter((post) => post.id !== postId);
    });
    setTotal((value) => Math.max(0, value - 1));
  };

  const restorePost = (postId: number) => {
    const removed = removedRef.current.get(postId);
    if (!removed) return;
    removedRef.current.delete(postId);
    setPosts((current) => {
      if (current.some((post) => post.id === postId)) return current;
      const next = [...current];
      next.splice(Math.min(removed.index, next.length), 0, removed.post);
      return next;
    });
    setTotal((value) => value + 1);
  };

  const onBlocked = () => {
    setBlockRefresh((value) => value + 1);
    load(0);
  };

  /** Whether a just-created post would appear in the feed being shown. */
  const belongsToCurrentFeed = (post: CommunityPost): boolean => {
    if (departmentId) {
      return (
        post.audience.kind === "DEPARTMENT" &&
        post.audience.departmentId === departmentId
      );
    }
    switch (filter) {
      case "prayer":
        return post.type === "PRAYER";
      case "testimony":
        return post.type === "TESTIMONY";
      case "discussion":
        return post.type === "DISCUSSION";
      case "department":
        return post.audience.kind === "DEPARTMENT";
      case "all":
      default:
        return true;
    }
  };

  const openComposer = (audience?: AudienceSelection) => {
    setComposerAudience(audience);
    setComposerOpen(true);
  };

  const selectDepartment = (item: CommunityDepartment | null) => {
    const next = new URLSearchParams(searchParams);
    if (item) next.set("department", String(item.id));
    else next.delete("department");
    setSearchParams(next);
    setCommunitiesOpen(false);
  };

  const emptyCopy: [string, string] = departmentId
    ? [
        "No posts from your department yet.",
        `Start a conversation with ${department?.name ?? "your department"}.`,
      ]
    : filter === "department"
      ? [
          "No posts from your department yet.",
          `Start a conversation with ${
            me.departments.length === 1
              ? me.departments[0].name
              : "your department"
          }.`,
        ]
      : FEED_EMPTY_COPY[filter];

  const departmentAudience: AudienceSelection | undefined = department
    ? { kind: "DEPARTMENT", departmentId: department.id }
    : undefined;

  const sidebar = (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-lightGray bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-primary">
          My communities
        </h2>
        <MyCommunitiesPanel
          departments={me.departments}
          activeDepartmentId={departmentId}
          onSelect={selectDepartment}
        />
      </section>
      {me.canModerate ? (
        <Link
          to={ADMIN_REPORTS_PATH}
          className="flex items-center gap-3 rounded-2xl border border-lightGray bg-white p-4 hover:bg-lightGray/20"
        >
          <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <ShieldCheckIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-primary">
              Reported content
            </span>
            <span className="block text-xs text-primaryGray">
              Community moderation
            </span>
          </span>
          {me.pendingReports > 0 ? (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
              {me.pendingReports}
            </span>
          ) : null}
        </Link>
      ) : null}
      <BlockedMembersPanel
        refreshKey={blockRefresh}
        onUnblocked={() => load(0)}
      />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          {departmentId ? (
            <button
              type="button"
              onClick={() => selectDepartment(null)}
              className="mb-1 inline-flex items-center gap-1 text-sm text-primaryGray hover:text-primary"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Community
            </button>
          ) : null}
          <h1 className="truncate text-2xl font-semibold text-primary">
            {departmentId ? department?.name ?? "Department" : "Community"}
          </h1>
          <p className="text-sm text-primaryGray">
            {departmentId && department
              ? `Department · ${plural(department.memberCount, "member")}`
              : "Prayer, testimonies and discussions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCommunitiesOpen(true)}
            aria-label="My communities"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-lightGray bg-white text-primary hover:bg-lightGray/40 lg:hidden"
          >
            <UserGroupIcon className="h-5 w-5" />
          </button>
          <CommunityNotificationsPanel
            unreadCount={me.unreadNotifications}
            onUnreadChange={setUnread}
            onRefresh={refreshMe}
          />
          <button
            type="button"
            onClick={() => openComposer(departmentAudience)}
            className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            {department ? `Post to ${department.name}` : "Create post"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          {!departmentId ? (
            <div
              role="tablist"
              aria-label="Filter posts"
              className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            >
              {FEED_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === option.value}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "flex-none rounded-full border px-4 py-1.5 text-sm transition-colors",
                    filter === option.value
                      ? "border-amber-300 bg-amber-50 font-semibold text-amber-800"
                      : "border-lightGray bg-white text-primaryGray hover:bg-lightGray/30"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-3 rounded-2xl border border-lightGray bg-white p-3">
            <CommunityAvatar
              person={{
                name: viewerName,
                initials: "",
                avatarUrl: token?.profile_img || null,
              }}
            />
            <button
              type="button"
              onClick={() => openComposer(departmentAudience)}
              className="flex-1 rounded-full bg-lightGray/30 px-4 py-2.5 text-left text-sm text-primaryGray hover:bg-lightGray/50"
            >
              What&apos;s on your heart?
            </button>
            <button
              type="button"
              onClick={() => openComposer(departmentAudience)}
              className="hidden flex-none rounded-lg border border-lightGray px-3 py-2 text-sm font-medium text-primary hover:bg-lightGray/30 tablet:inline-flex"
            >
              Create post
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4" aria-busy>
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-2xl border border-lightGray bg-lightGray/20"
                />
              ))}
            </div>
          ) : failed ? (
            <div className="rounded-2xl border border-error/40 bg-errorBG p-4 text-sm text-error">
              The community feed could not be loaded.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => load(0)}
              >
                Try again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-lightGray bg-white px-6 py-10 text-center">
              <p className="text-lg font-semibold text-primary">{emptyCopy[0]}</p>
              <p className="mt-1 text-sm text-primaryGray">{emptyCopy[1]}</p>
              <button
                type="button"
                onClick={() => openComposer(departmentAudience)}
                className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Create post
              </button>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canManage={me.canManage}
                  onChange={updatePost}
                  onRemove={() => removePost(post.id)}
                  onRestore={() => restorePost(post.id)}
                  onBlocked={onBlocked}
                />
              ))}
              {posts.length < total ? (
                <button
                  type="button"
                  onClick={() => load(posts.length)}
                  disabled={loadingMore}
                  className="mx-auto inline-flex min-h-10 items-center rounded-lg border border-lightGray bg-white px-5 py-2 text-sm font-medium text-primary hover:bg-lightGray/30 disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              ) : null}
            </>
          )}
        </div>

        <aside className="hidden lg:block">{sidebar}</aside>
      </div>

      <CommunitySheet
        open={communitiesOpen}
        onClose={() => setCommunitiesOpen(false)}
        title="My communities"
      >
        {sidebar}
      </CommunitySheet>

      <CreatePostModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={(post) => {
          if (!belongsToCurrentFeed(post)) {
            load(0);
            return;
          }
          setPosts((current) => [
            post,
            ...current.filter((item) => item.id !== post.id),
          ]);
          setTotal((value) => value + 1);
        }}
        canManage={me.canManage}
        departments={me.departments}
        viewerName={viewerName}
        initialAudience={composerAudience}
      />
    </div>
  );
};

export default MemberCommunityFeed;
