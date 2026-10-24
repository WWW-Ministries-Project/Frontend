import { useEffect, useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type {
  CommunityAdminPost,
  CommunityAuditLogEntry,
  CommunityModerationItem,
  CommunityModerationStatus,
  CommunityPostType,
} from "@/utils/api/community/interfaces";
import type { DepartmentType } from "@/utils/api/settings/departmentInterfaces";

import PageOutline from "../../Components/PageOutline";
import { communityBodyToPlainText } from "../Community/utils/communityBody";
import { POST_TYPES, REPORT_REASON_LABEL } from "../Community/utils/communityConstants";
import { audienceLabels } from "../Community/utils/communityHelpers";
import {
  Field,
  KpiCard,
  PageHeading,
  Pill,
  PillTabs,
  SearchInput,
  SelectInput,
  TextArea,
  UiButton,
  type PillTone,
} from "../MembershipManagement/components/membershipUi";
import {
  CheckCard,
  ChoiceButtons,
  CommDialog,
  FieldHint,
  ListEmpty,
} from "./ui/commUi";
import {
  WIDE_TABLE_MIN,
  errorText,
  formatDayTime,
  initialsOf,
  plural,
  timeAgo,
  useViewportWidth,
} from "./ui/commUtils";

type Tab = "posts" | "reported" | "audit";
type ReportTab = CommunityModerationStatus | "ALL";

const PAGE_SIZE = 50;
const AUDIT_QUERY = { skip: 0, take: 50 };
const MAX_MESSAGE = 2000;

/** Pill colour per post type; church messages are dark like the design. */
const TYPE_TONE: Partial<Record<CommunityPostType, PillTone>> = {
  PRAYER: "info",
  TESTIMONY: "success",
  CELEBRATION: "warning",
  MESSAGE: "primary",
};

const TypePill = ({ type }: { type: CommunityPostType }) =>
  type === "MESSAGE" ? (
    <span className="inline-block whitespace-nowrap rounded-full border border-primary bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
      Church message
    </span>
  ) : (
    <Pill tone={TYPE_TONE[type] ?? "neutral"}>{POST_TYPES[type]?.label ?? type}</Pill>
  );

const AUDIT_VERB: Record<string, string> = {
  REMOVE: "removed content by",
  RESTORE: "restored content by",
  WARN: "warned",
  PIN: "pinned a post by",
  UNPIN: "unpinned a post by",
  POST_MESSAGE: "posted a church message",
  VIEW_ANON_AUTHOR: "viewed the author of an anonymous post by",
};

const totalReactions = (post: CommunityAdminPost) =>
  post.reactions.reduce((sum, reaction) => sum + reaction.count, 0);

interface MessageDraft {
  body: string;
  audience: "church" | "dept";
  departmentId: string;
  pin: boolean;
  notifyMembers: boolean;
  comments: boolean;
}

const useDebounced = <T,>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const CommunityManager = () => {
  const { hasPermission } = useAccessControl();
  const canManage = hasPermission("manage_community");
  const wide = useViewportWidth() >= WIDE_TABLE_MIN;

  const [tab, setTab] = useState<Tab>("posts");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [take, setTake] = useState(PAGE_SIZE);
  const [reportTab, setReportTab] = useState<ReportTab>("PENDING");
  const debouncedQ = useDebounced(q.trim());

  const postsQuery = useMemo(() => {
    const query: Record<string, string | number> = { skip: 0, take };
    if (debouncedQ) query.q = debouncedQ;
    if (type) query.type = type;
    if (status) query.status = status;
    return query;
  }, [debouncedQ, type, status, take]);

  const stats = useFetch(api.fetch.fetchCommunityAdminStats, undefined, false, { silent: true });
  const posts = useFetch(api.fetch.fetchCommunityAdminPosts, postsQuery, false, { silent: true });
  const reports = useFetch(api.fetch.fetchCommunityModerationReports, { status: reportTab }, false, { silent: true });
  const audit = useFetch(api.fetch.fetchCommunityAuditLog, AUDIT_QUERY, false, { silent: true });
  useEffect(() => setTake(PAGE_SIZE), [debouncedQ, type, status]);

  const postRows: CommunityAdminPost[] = posts.data?.data ?? [];
  const postTotal = posts.data?.meta?.total ?? postRows.length;
  const reportRows: CommunityModerationItem[] = useMemo(
    () => [...(reports.data?.data ?? [])].sort((a, b) => b.reports.length - a.reports.length),
    [reports.data]
  );
  const auditRows: CommunityAuditLogEntry[] = audit.data?.data ?? [];
  const s = stats.data?.data;

  const refreshAll = async () => {
    await Promise.all([posts.refetch(), reports.refetch(), stats.refetch(), audit.refetch()]);
  };

  /* --------------------------------- actions --------------------------------- */

  const moderatePost = (post: CommunityAdminPost, action: "remove" | "restore") => {
    const run = async () => {
      await api.post.moderateCommunityContent("posts", post.id, action);
      await refreshAll();
      notify.success(
        action === "remove"
          ? {
              title: "Post removed",
              message: `${post.realAuthor.name} can no longer see it in the feed.`,
              undo: async () => {
                await api.post.moderateCommunityContent("posts", post.id, "restore");
                await refreshAll();
              },
              undoneTitle: "Post restored",
            }
          : { title: "Post restored", message: "It’s back in the feed." }
      );
    };
    if (action === "restore") return run();
    confirmAction({
      title: "Remove this post?",
      points: ["It disappears from the Community feed for everyone.", "You can restore it later from the Removed filter."],
      confirmLabel: "Remove post",
      cancelLabel: "Keep post",
      tone: "danger",
      onConfirm: run,
    });
  };

  const togglePin = async (post: CommunityAdminPost) => {
    const pinned = !post.isPinned;
    await api.post.pinCommunityPost(post.id, pinned);
    await posts.refetch();
    notify.success({ title: pinned ? "Pinned to the top of the feed" : "Unpinned" });
  };

  const actOnReport = async (item: CommunityModerationItem, action: "remove" | "restore" | "warn", label: "keep" | "remove" | "warn" | "restore") => {
    const kind = item.kind === "POST" ? "posts" : "comments";
    const id = item.kind === "POST" ? item.postId : (item.commentId as number);
    await api.post.moderateCommunityContent(kind, id, action);
    await refreshAll();
    const noun = item.kind === "POST" ? "Post" : "Comment";
    const people = plural(item.reports.length, "person", "people");
    const toast = {
      keep: { title: "Reports dismissed", message: `The ${noun.toLowerCase()} stays visible.` },
      remove: { title: `${noun} removed`, message: `The ${people} who reported it are told it was removed.` },
      warn: { title: `Warning sent to ${item.author.name}`, message: "They get an in-app notice about the community guidelines." },
      restore: { title: `${noun} restored`, message: "It’s visible again." },
    }[label];
    notify.success(toast);
  };

  /* ------------------------------ church message ------------------------------ */

  const [draft, setDraft] = useState<MessageDraft | null>(null);
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [tried, setTried] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const openMessage = () => {
    setDraft({ body: "", audience: "church", departmentId: "", pin: true, notifyMembers: true, comments: true });
    setTried(false);
    setErrors([]);
    if (!departments.length) {
      api.fetch
        .fetchDepartments()
        .then((response) => setDepartments(response.data ?? []))
        .catch(() => undefined);
    }
  };

  const postMessage = async () => {
    if (!draft) return;
    setTried(true);
    const list: string[] = [];
    if (!draft.body.trim()) list.push("Write the message.");
    if (draft.audience === "dept" && !draft.departmentId) list.push("Choose the department that should see it.");
    setErrors(list);
    if (list.length) return;
    setSaving(true);
    try {
      await api.post.createCommunityPost({
        type: "MESSAGE",
        body: draft.body.trim(),
        audience: draft.audience === "dept" ? "DEPARTMENT" : "CHURCH",
        departmentId: draft.audience === "dept" ? Number(draft.departmentId) : undefined,
        isPinned: draft.pin,
        isImportant: draft.notifyMembers,
        commentsEnabled: draft.comments,
      });
      const where =
        draft.audience === "dept"
          ? departments.find((department) => String(department.id) === draft.departmentId)?.name ?? "the department"
          : "Whole church";
      setDraft(null);
      setTab("posts");
      await refreshAll();
      notify.success({
        title: "Church message posted",
        message: `${draft.pin ? "Pinned to the top of " : "Posted to "}${where}${draft.notifyMembers ? ". Members get a notification." : "."}`,
      });
    } catch (error) {
      setErrors([errorText(error, "The message wasn't posted. Try again.")]);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------- render ---------------------------------- */

  const postActions = (post: CommunityAdminPost, size: "sm" | "md" = "sm") => {
    if (!canManage) return null;
    const removed = post.status === "REMOVED";
    return (
      <>
        {removed && (
          <UiButton size={size} onClick={() => moderatePost(post, "restore")}>
            Restore
          </UiButton>
        )}
        {!removed && post.type === "MESSAGE" && (
          <UiButton size={size} onClick={() => togglePin(post)}>
            {post.isPinned ? "Unpin" : "Pin"}
          </UiButton>
        )}
        {!removed && (
          <UiButton size={size} tone="danger" onClick={() => moderatePost(post, "remove")}>
            Remove
          </UiButton>
        )}
      </>
    );
  };

  const authorOf = (post: CommunityAdminPost) =>
    post.isAnonymous ? `${post.realAuthor.name} (anonymous)` : post.realAuthor.name;
  const engagementOf = (post: CommunityAdminPost) =>
    `${plural(totalReactions(post), "reaction")} · ${plural(post.commentCount, "comment")}`;

  const filtersOn = !!(debouncedQ || type || status);
  const pendingCount = s?.pendingReview ?? 0;

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Community"
        subtitle="Prayer requests, testimonies and discussions from members, plus messages from the church."
        actions={
          canManage ? (
            <UiButton tone="primary" onClick={openMessage}>
              New church message
            </UiButton>
          ) : undefined
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        <KpiCard
          label="Posts this week"
          value={s ? s.postsThisWeek : "—"}
          sub={s ? `${s.memberPostsThisWeek} from members` : undefined}
        />
        <KpiCard
          label="Prayer requests"
          value={s ? s.prayerRequestsThisWeek : "—"}
          sub={s ? `This week · ${plural(s.prayerRepliesThisWeek, "reply", "replies")}` : undefined}
        />
        <KpiCard
          label="Needs review"
          value={s ? s.pendingReview : "—"}
          sub={
            s ? (
              <span className={s.pendingReview ? "text-amber-700" : "text-green-700"}>
                {s.pendingReview && s.oldestPendingAt ? `Oldest ${timeAgo(s.oldestPendingAt)}` : "Queue is clear"}
              </span>
            ) : undefined
          }
        />
        <KpiCard label="Removed this month" value={s ? s.removedThisMonth : "—"} sub="Posts and comments" />
      </div>

      <PillTabs
        ariaLabel="Community sections"
        className="self-start"
        tabs={[
          { key: "posts", label: "Posts" },
          { key: "reported", label: "Reported", count: pendingCount || null },
          { key: "audit", label: "Audit log" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "posts" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Search posts or authors"
              ariaLabel="Search posts"
              className="max-w-[420px]"
            />
            <div className="ml-auto flex flex-wrap gap-2">
              <SelectInput
                aria-label="Post type"
                className="w-auto"
                value={type}
                onChange={(event) => setType(event.target.value)}
                options={[
                  { value: "", label: "All types" },
                  ...(Object.keys(POST_TYPES) as CommunityPostType[]).map((key) => ({
                    value: key,
                    label: key === "MESSAGE" ? "Church message" : POST_TYPES[key].label,
                  })),
                ]}
              />
              <SelectInput
                aria-label="Post status"
                className="w-auto"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                options={[
                  { value: "", label: "Any status" },
                  { value: "ACTIVE", label: "Visible" },
                  { value: "REMOVED", label: "Removed" },
                ]}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {plural(postTotal, "post")}
            {filtersOn ? " match" : ""}. Pinned church messages stay at the top of the member feed.
          </p>

          {posts.loading && postRows.length === 0 ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : postRows.length === 0 ? (
            <ListEmpty>
              {filtersOn ? "No posts match. Clear the search or change the filters." : "No posts yet."}
            </ListEmpty>
          ) : wide ? (
            <div className="overflow-x-auto rounded-lg border border-lightGray bg-white shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[minmax(280px,2.6fr)_minmax(130px,1fr)_minmax(120px,1fr)_minmax(110px,0.8fr)_minmax(100px,0.8fr)_190px] gap-3 bg-lightGray px-6 py-4 text-sm font-semibold text-primary">
                  <span>Post</span>
                  <span>Type</span>
                  <span>Audience</span>
                  <span>Engagement</span>
                  <span>Posted</span>
                  <span />
                </div>
                {postRows.map((post) => {
                  const removed = post.status === "REMOVED";
                  return (
                    <div
                      key={post.id}
                      className={`grid min-h-16 grid-cols-[minmax(280px,2.6fr)_minmax(130px,1fr)_minmax(120px,1fr)_minmax(110px,0.8fr)_minmax(100px,0.8fr)_190px] items-center gap-3 border-b border-lightGray px-6 py-3 text-sm text-primary hover:bg-lightGray/20 ${removed ? "opacity-60" : ""}`}
                    >
                      <div className="flex min-w-0 gap-3">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                          {initialsOf(post.realAuthor.name)}
                        </span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="flex items-center gap-2 font-semibold">
                            {authorOf(post)}
                            {post.isPinned && !removed && <span className="text-xs font-semibold text-secondary">Pinned</span>}
                          </p>
                          <p className="line-clamp-2 text-gray-600">{communityBodyToPlainText(post.body)}</p>
                        </div>
                      </div>
                      <div>
                        <TypePill type={post.type} />
                      </div>
                      <p className="text-gray-600">{audienceLabels(post.audience).short}</p>
                      <p className="text-gray-600">{engagementOf(post)}</p>
                      <div>
                        <p>{timeAgo(post.createdAt)}</p>
                        {removed && <p className="text-xs text-red-700">Removed</p>}
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">{postActions(post)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {postRows.map((post) => (
                <div
                  key={post.id}
                  className={`flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4 ${post.status === "REMOVED" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                      {initialsOf(post.realAuthor.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary">{authorOf(post)}</p>
                      <p className="text-xs text-gray-500">
                        {timeAgo(post.createdAt)} · {audienceLabels(post.audience).short}
                        {post.isPinned && post.status !== "REMOVED" ? " · Pinned" : ""}
                      </p>
                    </div>
                    <TypePill type={post.type} />
                  </div>
                  <p className="whitespace-pre-line text-sm text-gray-700">{communityBodyToPlainText(post.body)}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">{engagementOf(post)}</span>
                    <div className="flex flex-wrap gap-2">{postActions(post, "md")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {postRows.length < postTotal && (
            <UiButton className="self-center" onClick={() => setTake((prev) => prev + PAGE_SIZE)} disabled={posts.loading}>
              {posts.loading ? "Loading…" : "Show more posts"}
            </UiButton>
          )}
        </>
      )}

      {tab === "reported" && (
        <>
          <PillTabs
            ariaLabel="Report status"
            className="self-start"
            tabs={[
              { key: "PENDING", label: "Needs review" },
              { key: "REMOVED", label: "Removed" },
              { key: "RESTORED", label: "Kept" },
              { key: "ALL", label: "All" },
            ]}
            value={reportTab}
            onChange={setReportTab}
          />
          {reports.loading && reportRows.length === 0 ? (
            <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          ) : reportRows.length === 0 ? (
            <ListEmpty>
              {reportTab === "PENDING" ? "Nothing to review. Reported posts and comments appear here." : "Nothing here yet."}
            </ListEmpty>
          ) : (
            <div className="flex flex-col gap-4">
              {reportRows.map((item) => {
                const reasons = item.reports.reduce<Record<string, number>>((acc, report) => {
                  const label = REPORT_REASON_LABEL[report.reason] ?? report.reason;
                  acc[label] = (acc[label] ?? 0) + 1;
                  return acc;
                }, {});
                const firstAt = item.reports.map((report) => report.createdAt).sort()[0];
                const kind = item.kind === "POST" ? "Post" : "Comment";
                const pill =
                  item.status === "PENDING" ? (
                    <Pill tone="warning">Needs review</Pill>
                  ) : item.status === "REMOVED" ? (
                    <Pill tone="danger">Removed</Pill>
                  ) : (
                    <Pill tone="success">Kept</Pill>
                  );
                return (
                  <article key={item.key} className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <p className="text-sm font-semibold text-primary">
                        {item.author.name}
                        {item.isAnonymous ? " (posted anonymously)" : ""}
                      </p>
                      <span className="text-xs text-gray-500">
                        {kind} · {item.audienceLabel}
                      </span>
                      <span className="ml-auto">{pill}</span>
                    </div>
                    <p className="rounded-lg border border-gray-200 bg-inputBackground px-4 py-3 text-sm text-gray-700 [text-wrap:pretty]">
                      {communityBodyToPlainText(item.body)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {Object.entries(reasons).map(([label, count]) => (
                        <Pill key={label} tone="warning">
                          {label}
                          {count > 1 ? ` ×${count}` : ""}
                        </Pill>
                      ))}
                      <span className="text-xs text-gray-500">
                        Reported by {plural(item.reports.length, "person", "people")}
                        {firstAt ? ` · first ${timeAgo(firstAt)}` : ""}
                        {item.warned ? " · author warned" : ""}
                      </span>
                    </div>
                    {canManage && (
                      <div className="flex flex-wrap justify-end gap-2">
                        {item.status === "PENDING" ? (
                          <>
                            <UiButton tone="ghost" className="text-primary hover:bg-primary/5" onClick={() => actOnReport(item, "restore", "keep")}>
                              Keep it
                            </UiButton>
                            <UiButton disabled={item.warned} onClick={() => actOnReport(item, "warn", "warn")}>
                              {item.warned ? "Warned" : "Warn author"}
                            </UiButton>
                            <button
                              type="button"
                              onClick={() => actOnReport(item, "remove", "remove")}
                              className="min-h-10 rounded-lg bg-error px-4 py-2 text-sm font-medium text-white hover:bg-error/90"
                            >
                              Remove {kind.toLowerCase()}
                            </button>
                          </>
                        ) : item.status === "REMOVED" ? (
                          <UiButton onClick={() => actOnReport(item, "restore", "restore")}>Restore</UiButton>
                        ) : (
                          <UiButton tone="danger" onClick={() => actOnReport(item, "remove", "remove")}>
                            Remove
                          </UiButton>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "audit" &&
        (audit.loading && auditRows.length === 0 ? (
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        ) : auditRows.length === 0 ? (
          <ListEmpty>No moderation actions yet.</ListEmpty>
        ) : (
          <div className="overflow-hidden rounded-xl border border-lightGray bg-white">
            {auditRows.map((entry) => (
              <div key={entry.id} className="flex flex-wrap gap-x-4 gap-y-1 border-b border-gray-200 px-5 py-4 text-sm last:border-b-0">
                <span className="flex-[0_0_150px] text-gray-500">{formatDayTime(entry.createdAt)}</span>
                <p className="min-w-0 flex-[1_1_260px] text-primary">
                  <b className="font-semibold">{entry.actorName}</b> {AUDIT_VERB[entry.action] ?? entry.action.toLowerCase()}
                  {entry.action !== "POST_MESSAGE" && entry.targetAuthorName ? ` ${entry.targetAuthorName}` : ""}{" "}
                  {entry.targetExcerpt && <span className="text-gray-600">“{entry.targetExcerpt}”</span>}
                </p>
              </div>
            ))}
          </div>
        ))}

      {draft && (
        <CommDialog
          open
          onClose={() => setDraft(null)}
          busy={saving}
          title="New church message"
          subtitle="Posted to Community as an official message from the church."
          errors={errors}
          buttons={[
            { label: "Cancel", onClick: () => setDraft(null) },
            { label: "Post message", onClick: postMessage, tone: "primary" },
          ]}
        >
          <Field label="Message *">
            <TextArea
              rows={5}
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              placeholder="Share an announcement with the church"
              maxLength={MAX_MESSAGE}
              hasError={tried && !draft.body.trim()}
            />
            <FieldHint>
              {draft.body.length} / {MAX_MESSAGE}
            </FieldHint>
          </Field>
          <ChoiceButtons
            label="Who sees it"
            value={draft.audience}
            onChange={(value) => setDraft({ ...draft, audience: value })}
            options={[
              { value: "church", label: "Whole church" },
              { value: "dept", label: "One department" },
            ]}
          />
          {draft.audience === "dept" && (
            <Field label="Department *">
              <SelectInput
                value={draft.departmentId}
                onChange={(event) => setDraft({ ...draft, departmentId: event.target.value })}
                hasError={tried && !draft.departmentId}
                options={[
                  { value: "", label: departments.length ? "Choose a department" : "Loading departments…" },
                  ...departments.map((department) => ({ value: String(department.id), label: department.name })),
                ]}
              />
            </Field>
          )}
          <CheckCard
            checked={draft.pin}
            onChange={(value) => setDraft({ ...draft, pin: value })}
            label="Pin to the top of the feed"
            help="Stays above member posts until you unpin it."
          />
          <CheckCard
            checked={draft.notifyMembers}
            onChange={(value) => setDraft({ ...draft, notifyMembers: value })}
            label="Send a push notification"
            help="Members get an alert on their phone. Use for time-sensitive messages."
          />
          <CheckCard
            checked={draft.comments}
            onChange={(value) => setDraft({ ...draft, comments: value })}
            label="Allow comments"
            help="Members can reply under the message."
          />
        </CommDialog>
      )}
    </PageOutline>
  );
};

export default CommunityManager;
