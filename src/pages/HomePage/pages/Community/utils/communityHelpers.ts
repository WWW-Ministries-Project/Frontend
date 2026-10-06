import { relativePath } from "@/utils/const";
import { decodeToken } from "@/utils/helperFunctions";
import type {
  CommunityComment,
  CommunityPost,
  CommunityPostAudience,
  CommunityReactionSummary,
} from "@/utils/api/community/interfaces";
import { REACTIONS } from "./communityConstants";

/** Community is members-only: guests get 403 from every member endpoint, so
 *  the UI hides it rather than showing a broken feed. */
export const isGuestViewer = (): boolean => {
  try {
    return decodeToken()?.is_guest === true;
  } catch {
    return false;
  }
};

/** Member-portal post route; `commentId` highlights a comment (deep links). */
export const communityPostPath = (postId: number, commentId?: number | null) =>
  `${relativePath.member.community}/posts/${postId}${
    commentId ? `?comment=${commentId}` : ""
  }`;

export const plural = (count: number, word: string): string =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

export const firstName = (name?: string | null): string =>
  (name || "").trim().split(/\s+/)[0] || "";

export const initialsOf = (name?: string | null): string => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return `${first}${last}`.toUpperCase();
};

/** Compact relative time: "Just now", "5m", "3h", "Yesterday", "4d", "12 Mar". */
export const timeAgo = (iso?: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  const time = date.getTime();
  if (Number.isNaN(time)) return "";

  const diffMinutes = Math.floor((Date.now() - time) / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== new Date().getFullYear()
      ? { year: "numeric" }
      : {}),
  });
};

export const isToday = (iso?: string | null): boolean => {
  if (!iso) return false;
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString();
};

/** [short label, "visible to …" phrase] for an audience. */
export const audienceLabels = (
  audience: CommunityPostAudience
): { short: string; full: string } => {
  switch (audience.kind) {
    case "DEPARTMENT": {
      const name = audience.departmentName || "your department";
      return { short: name, full: `members of ${name}` };
    }
    case "SELECTED": {
      const members = audience.members ?? [];
      if (members.length > 0 && members.length <= 3) {
        const names = members.map((member) => firstName(member.name)).join(", ");
        return { short: names, full: names };
      }
      const count = audience.memberCount ?? members.length;
      const label = count ? plural(count, "selected member") : "selected members";
      return { short: label, full: label };
    }
    case "ONLY_ME":
      return { short: "Only you", full: "only you" };
    case "CHURCH":
    default:
      return { short: "Whole church", full: "the whole church" };
  }
};

export const findReaction = (
  reactions: CommunityReactionSummary[],
  type: CommunityReactionSummary["type"]
): CommunityReactionSummary | undefined =>
  reactions.find((reaction) => reaction.type === type);

export const totalReactions = (reactions: CommunityReactionSummary[]): number =>
  reactions.reduce((sum, reaction) => sum + (reaction.count || 0), 0);

/** Footer line under a post. Rules follow the Community design:
 *  prayer posts talk about praying, every other post about reactions. */
export const reactionSummaryText = (post: CommunityPost): string => {
  if (post.type === "PRAYER") {
    const pray = findReaction(post.reactions, "PRAY");
    const count = pray?.count ?? 0;
    if (pray?.reacted) {
      return count <= 1
        ? "You're praying"
        : `You and ${plural(count - 1, "other")} are praying`;
    }
    if (!count) return "Be the first to pray";
    return count === 1 ? "1 person is praying" : `${count} people are praying`;
  }

  const total = totalReactions(post.reactions);
  if (total === 0) return "No reactions yet";

  if (post.reactions.some((reaction) => reaction.reacted)) {
    return total === 1 ? "You reacted" : `You and ${plural(total - 1, "other")}`;
  }

  const ordered = REACTIONS.map((meta) => findReaction(post.reactions, meta.type));
  const firstReactor = ordered
    .flatMap((reaction) => reaction?.sample ?? [])
    .find((person) => Boolean(person?.name));

  if (!firstReactor) return plural(total, "reaction");
  const name = firstName(firstReactor.name);
  return total > 1 ? `${name} and ${plural(total - 1, "other")}` : name;
};

/** Optimistic toggle of one reaction type in a summary list. */
export const toggleReactionLocally = (
  reactions: CommunityReactionSummary[],
  type: CommunityReactionSummary["type"]
): CommunityReactionSummary[] => {
  const exists = reactions.some((reaction) => reaction.type === type);
  const base = exists
    ? reactions
    : [...reactions, { type, count: 0, reacted: false, sample: [] }];

  return base.map((reaction) =>
    reaction.type === type
      ? {
          ...reaction,
          reacted: !reaction.reacted,
          count: Math.max(0, reaction.count + (reaction.reacted ? -1 : 1)),
        }
      : reaction
  );
};

export const authorDisplayName = (
  item: Pick<CommunityPost | CommunityComment, "isAnonymous" | "author">
): string => (item.isAnonymous || !item.author ? "Anonymous" : item.author.name);

export const errorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};
