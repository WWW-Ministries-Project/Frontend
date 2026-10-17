/** Community — the members' feed. Shapes mirror the shared
 *  Backend ⇄ Frontend ⇄ Mobile contract (camelCase on the wire). An important
 *  church message is a post with `type: "MESSAGE"` and `isImportant`. */

export type CommunityPostType =
  | "PRAYER"
  | "TESTIMONY"
  | "DISCUSSION"
  | "CELEBRATION"
  | "QUESTION"
  | "MESSAGE"
  | "GENERAL";

export type CommunityAudience = "CHURCH" | "DEPARTMENT" | "SELECTED" | "ONLY_ME";

export type CommunityReactionType =
  | "PRAY"
  | "LOVE"
  | "PRAISE"
  | "CELEBRATE"
  | "SUPPORT";

export type CommunityCommentReactionType = Extract<
  CommunityReactionType,
  "PRAY" | "LOVE"
>;

export type CommunityReportReason =
  | "INAPPROPRIATE"
  | "HARASSMENT"
  | "SAFEGUARDING"
  | "SPAM"
  | "MISLEADING"
  | "OTHER";

export type CommunityModerationStatus = "PENDING" | "REMOVED" | "RESTORED";

export type CommunityFeedFilter =
  | "all"
  | "prayer"
  | "testimony"
  | "discussion"
  | "department";

export interface CommunityPerson {
  id: number;
  name: string;
  initials: string;
  avatarUrl: string | null;
  department: string | null;
}

export interface CommunityReactionSummary {
  type: CommunityReactionType;
  count: number;
  /** The viewer reacted with this type. */
  reacted: boolean;
  /** Up to 3 most recent reactors. */
  sample: { id: number; name: string }[];
}

export interface CommunityPostAudience {
  kind: CommunityAudience;
  departmentId: number | null;
  departmentName: string | null;
  /** DEPARTMENT: department size; SELECTED: number of recipients. */
  memberCount: number | null;
  /** SELECTED only, and only returned to the author. */
  members: { id: number; name: string }[] | null;
}

export interface CommunityPost {
  id: number;
  type: CommunityPostType;
  /** Rich text wrapped in `<html>…</html>` (mobile editor), or legacy plain
   *  text with newlines preserved. Render with `CommunityBody`. */
  body: string;
  audience: CommunityPostAudience;
  isAnonymous: boolean;
  isImportant: boolean;
  /** True for the viewer's own posts, including anonymous ones. */
  isMine: boolean;
  /** Null when anonymous — member endpoints never leak it. */
  author: CommunityPerson | null;
  images: string[];
  createdAt: string;
  /** All five types are always present; count may be 0. */
  reactions: CommunityReactionSummary[];
  commentCount: number;
  status: "ACTIVE" | "REMOVED";
}

export interface CommunityComment {
  id: number;
  postId: number;
  parentId: number | null;
  body: string;
  isAnonymous: boolean;
  isMine: boolean;
  /** Commenter is the post author with the same anonymity as the post. */
  isPostAuthor: boolean;
  author: CommunityPerson | null;
  createdAt: string;
  /** PRAY and LOVE only. */
  reactions: CommunityReactionSummary[];
  /** Top-level comments only; replies carry []. */
  replies: CommunityComment[];
}

export interface CommunityDepartment {
  id: number;
  name: string;
  memberCount: number;
  latest: {
    /** Null means the latest post is anonymous. */
    authorName: string | null;
    body: string;
    createdAt: string;
  } | null;
}

export interface CommunityNotification {
  id: number;
  type: string;
  title: string;
  /** The leading bold part of `title`; null for anonymous/system. */
  actorName: string | null;
  body: string | null;
  postId: number | null;
  commentId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface CommunityMe {
  canManage: boolean;
  /** Community view permission. */
  canModerate: boolean;
  departments: CommunityDepartment[];
  /** 0 unless canModerate. */
  pendingReports: number;
  unreadNotifications: number;
}

export interface CommunityPostDetail {
  post: CommunityPost;
  comments: CommunityComment[];
}

export interface CommunityReactor {
  type: CommunityReactionType;
  user: CommunityPerson;
}

export interface CommunityBlock {
  id: number;
  /** Null when blocked via anonymous content. */
  name: string | null;
}

export interface CreateCommunityPostDto {
  type: CommunityPostType;
  body: string;
  audience: CommunityAudience;
  departmentId?: number;
  memberIds?: number[];
  isAnonymous?: boolean;
  isImportant?: boolean;
  imageUrls?: string[];
}

export interface UpdateCommunityPostDto {
  body: string;
}

export interface CreateCommunityCommentDto {
  body: string;
  parentId?: number;
  isAnonymous?: boolean;
}

export interface CreateCommunityReportDto {
  postId?: number;
  commentId?: number;
  reason: CommunityReportReason;
  details?: string;
}

export interface CreateCommunityBlockDto {
  postId?: number;
  commentId?: number;
  userId?: number;
}

/* ---- Moderation / admin ---- */

export type CommunityModerationKind = "posts" | "comments";

export interface CommunityModerationReport {
  reason: CommunityReportReason;
  details: string | null;
  createdAt: string;
  reporterName: string;
}

export interface CommunityModerationItem {
  /** e.g. "POST:12" */
  key: string;
  kind: "POST" | "COMMENT";
  postId: number;
  commentId: number | null;
  /** "Anonymous" or the author's name — what members see. */
  shownAs: string;
  author: { id: number; name: string };
  isAnonymous: boolean;
  audienceLabel: string;
  body: string;
  status: CommunityModerationStatus;
  warned: boolean;
  reports: CommunityModerationReport[];
}

export interface CommunityAdminPost extends CommunityPost {
  realAuthor: { id: number; name: string };
}

export interface CommunityAuditLogEntry {
  id: number;
  actorName: string;
  action: string;
  postId: number | null;
  commentId: number | null;
  createdAt: string;
}
