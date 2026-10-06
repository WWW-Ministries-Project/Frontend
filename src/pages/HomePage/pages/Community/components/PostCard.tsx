import {
  ChatBubbleOvalLeftIcon,
  FaceSmileIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";
import { showNotification } from "@/pages/HomePage/utils";
import type {
  CommunityPost,
  CommunityReactionType,
} from "@/utils/api/community/interfaces";
import { REACTIONS, REACTION_BY_TYPE } from "../utils/communityConstants";
import {
  audienceLabels,
  authorDisplayName,
  communityPostPath,
  errorMessage,
  findReaction,
  firstName,
  plural,
  reactionSummaryText,
  timeAgo,
  toggleReactionLocally,
  totalReactions,
} from "../utils/communityHelpers";
import { CommunityAvatar } from "./CommunityAvatar";
import { useCommunityInteractions } from "./communityInteractionsContext";
import { ContentOptionsMenu } from "./ContentOptionsMenu";
import { PostTypePill } from "./PostTypePill";

interface PostCardProps {
  post: CommunityPost;
  /** "feed" clamps the body to 5 lines and links to the detail page. */
  variant?: "feed" | "detail";
  canManage: boolean;
  onChange: (post: CommunityPost) => void;
  /** Hidden, reported or deleted: drop it from the list. */
  onRemove: () => void;
  /** Undo of a hide: put it back. */
  onRestore: () => void;
  /** The author was blocked; the list should refetch. */
  onBlocked: () => void;
  highlighted?: boolean;
}

export const PostCard = ({
  post,
  variant = "feed",
  canManage,
  onChange,
  onRemove,
  onRestore,
  onBlocked,
  highlighted,
}: PostCardProps) => {
  const interactions = useCommunityInteractions();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const postRef = useRef(post);
  postRef.current = post;

  useEffect(() => {
    if (!pickerOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [pickerOpen]);

  const isPrayer = post.type === "PRAYER";
  const isFeed = variant === "feed";
  const audience = audienceLabels(post.audience);
  const authorName = authorDisplayName(post);
  const detailPath = communityPostPath(post.id);
  const pray = findReaction(post.reactions, "PRAY");
  const total = totalReactions(post.reactions);
  const target = {
    kind: "post" as const,
    id: post.id,
    authorFirstName:
      post.isAnonymous || !post.author ? null : firstName(post.author.name),
  };

  const toggleReaction = async (type: CommunityReactionType) => {
    const before = postRef.current;
    const wasReacted = Boolean(findReaction(before.reactions, type)?.reacted);
    onChange({
      ...before,
      reactions: toggleReactionLocally(before.reactions, type),
    });

    if (type === "PRAY" && isPrayer && !wasReacted) {
      interactions.showToast(
        before.isMine
          ? "You're praying for your own request."
          : "Thank you for praying. They'll know their church family is with them."
      );
    }

    try {
      const response = await api.post.toggleCommunityPostReaction(before.id, type);
      if (Array.isArray(response.data)) {
        onChange({ ...postRef.current, reactions: response.data });
      }
    } catch (error) {
      onChange({ ...postRef.current, reactions: before.reactions });
      showNotification(
        errorMessage(error, "Your reaction could not be saved."),
        "error",
        "Community"
      );
    }
  };

  const body = (
    <p
      className={cn(
        "whitespace-pre-line break-words text-[15px] leading-6 text-primary",
        isFeed && "line-clamp-5"
      )}
    >
      {post.body}
    </p>
  );

  return (
    <article
      id={`community-post-${post.id}`}
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm transition-colors sm:p-5",
        highlighted
          ? "border-amber-400 ring-2 ring-amber-200"
          : post.isImportant
            ? "border-amber-300"
            : "border-lightGray"
      )}
    >
      {post.isImportant ? (
        <div className="-mx-4 -mt-4 mb-4 flex items-center gap-2 rounded-t-2xl border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-amber-800 sm:-mx-5 sm:-mt-5 sm:px-5">
          <MapPinIcon className="h-4 w-4" />
          Important · From church leadership
        </div>
      ) : null}

      <header className="flex items-start gap-3">
        <CommunityAvatar person={post.author} anonymous={post.isAnonymous} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary">
            {authorName}
          </p>
          <p className="truncate text-xs text-primaryGray">
            {timeAgo(post.createdAt)} · {audience.short}
          </p>
        </div>
        <PostTypePill type={post.type} />
        <ContentOptionsMenu
          noun="post"
          isMine={post.isMine}
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
      </header>

      {post.isMine && post.isAnonymous ? (
        <p className="mt-3 inline-flex rounded-full bg-lightGray/40 px-3 py-1 text-xs text-primaryGray">
          Posted anonymously · only you see it&apos;s yours
        </p>
      ) : null}

      <div className="mt-3">
        {isFeed ? (
          <Link to={detailPath} className="block focus:outline-none">
            {body}
          </Link>
        ) : (
          body
        )}
      </div>

      {post.images.length > 0 ? (
        <div
          className={cn(
            "mt-3 grid gap-2",
            post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          {post.images.slice(0, 4).map((src, index) => (
            <a
              key={`${src}-${index}`}
              href={src}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl border border-lightGray bg-lightGray/30"
            >
              <img
                src={src}
                alt={`Photo ${index + 1} of ${post.images.length}`}
                className={cn(
                  "w-full object-cover",
                  post.images.length === 1 ? "max-h-96" : "h-40"
                )}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isPrayer ? (
          <button
            type="button"
            aria-pressed={Boolean(pray?.reacted)}
            onClick={() => toggleReaction("PRAY")}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
              pray?.reacted
                ? "border-violet-300 bg-violet-50 text-violet-700"
                : "border-lightGray bg-white text-primary hover:bg-lightGray/30"
            )}
          >
            <span aria-hidden>🙏</span>
            {pray?.reacted ? "Praying" : "I'm praying"}
          </button>
        ) : (
          <>
            {REACTIONS.map((meta) => {
              const reaction = findReaction(post.reactions, meta.type);
              if (!reaction || reaction.count <= 0) return null;
              return (
                <button
                  key={meta.type}
                  type="button"
                  aria-pressed={reaction.reacted}
                  aria-label={`${meta.label}, ${reaction.count}`}
                  onClick={() => toggleReaction(meta.type)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-sm transition-colors",
                    reaction.reacted
                      ? "border-amber-300 bg-amber-50 font-semibold text-amber-800"
                      : "border-lightGray bg-white text-primaryGray hover:bg-lightGray/30"
                  )}
                >
                  <span aria-hidden>{meta.emoji}</span>
                  {reaction.count}
                </button>
              );
            })}
            <div ref={pickerRef} className="relative">
              <button
                type="button"
                aria-label="Add reaction"
                aria-expanded={pickerOpen}
                onClick={() => setPickerOpen((value) => !value)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-primaryGray/50 text-primaryGray hover:bg-lightGray/30"
              >
                <FaceSmileIcon className="h-4 w-4" />
              </button>
              {pickerOpen ? (
                <div className="absolute bottom-10 left-0 z-20 flex gap-1 rounded-full border border-lightGray bg-white p-1 shadow-xl">
                  {REACTIONS.map((meta) => {
                    const reacted = Boolean(
                      findReaction(post.reactions, meta.type)?.reacted
                    );
                    return (
                      <button
                        key={meta.type}
                        type="button"
                        title={meta.label}
                        aria-label={meta.label}
                        aria-pressed={reacted}
                        onClick={() => {
                          setPickerOpen(false);
                          toggleReaction(meta.type);
                        }}
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform hover:scale-110",
                          reacted && "bg-amber-50"
                        )}
                      >
                        {meta.emoji}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </>
        )}
        {isFeed ? (
          <Link
            to={detailPath}
            aria-label="Comment"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-lightGray text-primaryGray hover:bg-lightGray/30"
          >
            <ChatBubbleOvalLeftIcon className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <footer className="mt-3 flex items-center justify-between gap-3 border-t border-lightGray/70 pt-3 text-sm">
        <button
          type="button"
          disabled={total === 0}
          onClick={() =>
            interactions.openWhoReacted({ kind: "post", id: post.id, isPrayer })
          }
          className="min-w-0 truncate text-left text-primaryGray enabled:hover:text-primary enabled:hover:underline disabled:cursor-default"
        >
          {!isPrayer && total > 0 ? (
            <span aria-hidden className="mr-1">
              {REACTIONS.filter(
                (meta) => (findReaction(post.reactions, meta.type)?.count ?? 0) > 0
              )
                .slice(0, 3)
                .map((meta) => REACTION_BY_TYPE[meta.type].emoji)
                .join("")}
            </span>
          ) : null}
          {reactionSummaryText(post)}
        </button>
        {isFeed ? (
          <Link
            to={detailPath}
            className="flex-none font-medium text-primaryGray hover:text-primary hover:underline"
          >
            {post.commentCount ? plural(post.commentCount, "comment") : "Comment"}
          </Link>
        ) : (
          <span className="flex-none text-primaryGray">
            {post.commentCount ? plural(post.commentCount, "comment") : ""}
          </span>
        )}
      </footer>

      {!isFeed ? (
        <p className="mt-3 text-xs text-primaryGray">
          Visible to {audience.full}
        </p>
      ) : null}
    </article>
  );
};
