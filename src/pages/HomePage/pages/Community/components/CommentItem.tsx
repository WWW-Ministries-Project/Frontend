import { useRef } from "react";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";
import type {
  CommunityComment,
  CommunityCommentReactionType,
  CommunityReactionSummary,
} from "@/utils/api/community/interfaces";
import { REACTIONS } from "../utils/communityConstants";
import {
  findReaction,
  firstName,
  timeAgo,
  toggleReactionLocally,
  totalReactions,
} from "../utils/communityHelpers";
import { CommunityAvatar } from "./CommunityAvatar";
import { useCommunityInteractions } from "./communityInteractionsContext";
import { CommunityBody } from "./CommunityBody";
import { ContentOptionsMenu } from "./ContentOptionsMenu";

interface CommentItemProps {
  comment: CommunityComment;
  isReply?: boolean;
  highlighted: boolean;
  canManage: boolean;
  /** Patches only this comment's reactions, functionally, so replies added
   *  while a request is in flight are kept. */
  onReactionsChange: (
    commentId: number,
    update: (reactions: CommunityReactionSummary[]) => CommunityReactionSummary[]
  ) => void;
  onRemove: () => void;
  onRestore: () => void;
  onBlocked: () => void;
  onReply: (comment: CommunityComment) => void;
}

const COMMENT_REACTIONS: {
  type: CommunityCommentReactionType;
  emoji: string;
  label: string;
  onClass: string;
}[] = [
  {
    type: "PRAY",
    emoji: "🙏",
    label: "Pray",
    onClass: "bg-violet-50 text-violet-700",
  },
  {
    type: "LOVE",
    emoji: "❤️",
    label: "Love",
    onClass: "bg-rose-50 text-rose-700",
  },
];

export const CommentItem = ({
  comment,
  isReply,
  highlighted,
  canManage,
  onReactionsChange,
  onRemove,
  onRestore,
  onBlocked,
  onReply,
}: CommentItemProps) => {
  const interactions = useCommunityInteractions();
  const anonymous = comment.isAnonymous || !comment.author;
  const name = comment.isMine
    ? "You"
    : anonymous
      ? "Anonymous"
      : comment.author?.name ?? "Anonymous";
  const total = totalReactions(comment.reactions);
  const target = {
    kind: "comment" as const,
    id: comment.id,
    authorFirstName: anonymous ? null : firstName(comment.author?.name),
  };

  // Only the latest reaction request may apply its response or roll back.
  const reactionSeq = useRef(0);

  const toggle = async (type: CommunityCommentReactionType) => {
    const seq = ++reactionSeq.current;
    const before = comment.reactions;
    onReactionsChange(comment.id, (reactions) =>
      toggleReactionLocally(reactions, type)
    );
    try {
      const response = await api.post.toggleCommunityCommentReaction(
        comment.id,
        type
      );
      if (seq !== reactionSeq.current) return;
      const next = response.data;
      if (Array.isArray(next)) onReactionsChange(comment.id, () => next);
    } catch {
      // ApiErrorHandler has already shown the error.
      if (seq !== reactionSeq.current) return;
      onReactionsChange(comment.id, () => before);
    }
  };

  return (
    <div
      id={`community-comment-${comment.id}`}
      className={cn("flex gap-3", isReply && "ml-11")}
    >
      <CommunityAvatar
        person={comment.author}
        anonymous={anonymous}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "rounded-2xl border px-4 py-2.5 transition-colors",
            highlighted
              ? "border-amber-300 bg-amber-50"
              : "border-transparent bg-lightGray/30"
          )}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-primary">{name}</span>
            {comment.isPostAuthor ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                Author
              </span>
            ) : null}
            <span className="text-xs text-primaryGray">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <CommunityBody
            body={comment.body}
            className="mt-1 text-sm text-primary"
          />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
          {COMMENT_REACTIONS.map((reaction) => {
            const on = Boolean(
              findReaction(comment.reactions, reaction.type)?.reacted
            );
            return (
              <button
                key={reaction.type}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(reaction.type)}
                className={cn(
                  "rounded-full px-2 py-1 font-medium",
                  on ? reaction.onClass : "text-primaryGray hover:bg-lightGray/40"
                )}
              >
                <span aria-hidden>{reaction.emoji}</span> {reaction.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onReply(comment)}
            className="rounded-full px-2 py-1 font-medium text-primaryGray hover:bg-lightGray/40"
          >
            Reply
          </button>
          <ContentOptionsMenu
            noun="comment"
            size="sm"
            isMine={comment.isMine}
            canDelete={canManage}
            blockName={target.authorFirstName || "this author"}
            onDelete={() => interactions.deleteContent(target, onRemove)}
            onReport={() => interactions.openReport(target, onRemove)}
            onHide={() =>
              interactions.hideContent(target, {
                onHidden: onRemove,
                onRestored: onRestore,
              })
            }
            onBlock={() => interactions.openBlock(target, onBlocked)}
          />
          {total > 0 ? (
            <button
              type="button"
              onClick={() =>
                interactions.openWhoReacted({ kind: "comment", id: comment.id })
              }
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-lightGray bg-white px-2 py-0.5 text-primaryGray hover:bg-lightGray/30"
              aria-label={`${total} reactions`}
            >
              <span aria-hidden>
                {REACTIONS.filter(
                  (meta) =>
                    (findReaction(comment.reactions, meta.type)?.count ?? 0) > 0
                )
                  .map((meta) => meta.emoji)
                  .slice(0, 3)
                  .join("")}
              </span>
              {total}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
