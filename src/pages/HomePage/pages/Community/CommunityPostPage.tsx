import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import { api } from "@/utils/api/apiCalls";
import { relativePath } from "@/utils/const";
import type {
  CommunityComment,
  CommunityPost,
  CommunityReactionSummary,
} from "@/utils/api/community/interfaces";
import { CommentItem } from "./components/CommentItem";
import { PostCard } from "./components/PostCard";
import { useCommunityMe } from "./hooks/useCommunityMe";
import { POST_TYPES } from "./utils/communityConstants";
import {
  authorDisplayName,
  communityPostPath,
  firstName,
} from "./utils/communityHelpers";

interface ReplyTarget {
  parentId: number;
  name: string;
}

const parseCommentParam = (value: string | null): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/** The comment plus its replies: what disappears when it is removed. */
const findCommentWeight = (
  comments: CommunityComment[],
  id: number
): number => {
  for (const comment of comments) {
    if (comment.id === id) return 1 + comment.replies.length;
    if (comment.replies.some((reply) => reply.id === id)) return 1;
  }
  return 0;
};

const countComments = (comments: CommunityComment[]) =>
  comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0);

/** Applies `fn` to the comment with `id`, whether top-level or a reply.
 *  Returning null removes it. */
const mapComment = (
  comments: CommunityComment[],
  id: number,
  fn: (comment: CommunityComment) => CommunityComment | null
): CommunityComment[] =>
  comments.flatMap((comment) => {
    if (comment.id === id) {
      const next = fn(comment);
      return next ? [next] : [];
    }
    return [{ ...comment, replies: mapComment(comment.replies, id, fn) }];
  });

/** /member/community/posts/:id. Rendered inside CommunityLayout, which
 *  handles guests and provides the shared interactions. */
const CommunityPostDetail = () => {
  const { id } = useParams();
  const postId = Number(id);
  const [searchParams] = useSearchParams();
  const commentParam = searchParams.get("comment");
  const navigate = useNavigate();
  const { me } = useCommunityMe();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [text, setText] = useState("");
  const [replyAnonymously, setReplyAnonymously] = useState(true);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const removedRef = useRef(
    new Map<number, { snapshot: CommunityComment[]; weight: number }>()
  );
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    if (!Number.isFinite(postId) || postId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.fetch.fetchCommunityPost(postId);
      if (requestId !== requestRef.current) return;
      if (!response.data?.post) {
        setNotFound(true);
        return;
      }
      setPost(response.data.post);
      setComments(
        Array.isArray(response.data.comments) ? response.data.comments : []
      );
      setNotFound(false);
    } catch {
      if (requestId === requestRef.current) setNotFound(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [postId]);

  // Refetch when the post changes, and when a notification for this same post
  // lands with a different ?comment= (it may be a comment we haven't loaded).
  useEffect(() => {
    load();
  }, [load, commentParam]);

  useEffect(() => {
    setHighlightId(parseCommentParam(commentParam));
  }, [commentParam]);

  // A different post: drop the draft reply aimed at the previous one.
  useEffect(() => {
    setReplyTo(null);
    setText("");
  }, [postId]);

  // Notification deep links: scroll the highlighted comment into view.
  useEffect(() => {
    if (loading || !highlightId) return;
    const element = document.getElementById(`community-comment-${highlightId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [loading, highlightId]);

  const backToFeed = () => navigate(relativePath.member.community);

  const updateCommentReactions = (
    commentId: number,
    update: (reactions: CommunityReactionSummary[]) => CommunityReactionSummary[]
  ) =>
    setComments((current) =>
      mapComment(current, commentId, (comment) => ({
        ...comment,
        reactions: update(comment.reactions),
      }))
    );

  const removeComment = (commentId: number) => {
    // Removing a top-level comment takes its replies with it.
    const weight = findCommentWeight(comments, commentId);
    removedRef.current.set(commentId, { snapshot: comments, weight });
    setComments((current) => mapComment(current, commentId, () => null));
    setPost((current) =>
      current
        ? {
            ...current,
            commentCount: Math.max(0, current.commentCount - weight),
          }
        : current
    );
  };

  const restoreComment = (commentId: number) => {
    const removed = removedRef.current.get(commentId);
    if (!removed) return;
    removedRef.current.delete(commentId);
    setComments(removed.snapshot);
    setPost((current) =>
      current
        ? { ...current, commentCount: current.commentCount + removed.weight }
        : current
    );
  };

  const startReply = (comment: CommunityComment, parentId: number) => {
    const anonymous = comment.isAnonymous || !comment.author;
    setReplyTo({
      parentId,
      name: comment.isMine
        ? "yourself"
        : anonymous
          ? "Anonymous"
          : firstName(comment.author?.name),
    });
    inputRef.current?.focus();
  };

  const offerAnonymous = Boolean(post?.isMine && post.isAnonymous);

  const send = async () => {
    const body = text.trim();
    if (!body || !post || sending) return;
    setSending(true);
    try {
      const response = await api.post.createCommunityComment(post.id, {
        body,
        ...(replyTo ? { parentId: replyTo.parentId } : {}),
        ...(offerAnonymous ? { isAnonymous: replyAnonymously } : {}),
      });
      const created = response.data;
      if (created) {
        setComments((current) =>
          replyTo
            ? current.map((comment) =>
                comment.id === replyTo.parentId
                  ? { ...comment, replies: [...comment.replies, created] }
                  : comment
              )
            : [...current, { ...created, replies: created.replies ?? [] }]
        );
        setPost((current) =>
          current
            ? { ...current, commentCount: current.commentCount + 1 }
            : current
        );
        setHighlightId(created.id);
      }
      setText("");
      setReplyTo(null);
    } catch {
      // ApiErrorHandler has already shown the error; keep the draft.
    } finally {
      setSending(false);
    }
  };

  if (loading && !post) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <div className="h-48 animate-pulse rounded-2xl border border-lightGray bg-lightGray/20" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <EmptyState
          scope="page"
          msg="This post isn't available"
          description="It may have been removed, or it isn't shared with you."
        />
        <div className="text-center">
          <Link
            to={relativePath.member.community}
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  const typeMeta = POST_TYPES[post.type] ?? POST_TYPES.GENERAL;
  const commentTotal = countComments(comments);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 pb-40 md:p-6 md:pb-40">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={backToFeed}
          aria-label="Back to Community"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-lightGray bg-white text-primary hover:bg-lightGray/40"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-primary">
            {typeMeta.label}
          </h1>
          <p className="truncate text-sm text-primaryGray">
            {authorDisplayName(post)}
          </p>
        </div>
      </div>

      <PostCard
        post={post}
        variant="detail"
        canManage={me.canManage}
        onChange={setPost}
        onRemove={backToFeed}
        onRestore={load}
        restorePath={communityPostPath(post.id)}
        onBlocked={backToFeed}
      />

      <section className="mt-6" aria-labelledby="community-comments-heading">
        <h2
          id="community-comments-heading"
          className="mb-3 text-xs font-semibold uppercase tracking-wider text-primaryGray"
        >
          {commentTotal ? `Comments · ${commentTotal}` : "Comments"}
        </h2>
        {comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-lightGray bg-white px-4 py-6 text-center text-sm text-primaryGray">
            No comments yet. Be the first to encourage them.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {comments.map((comment) => (
              <li key={comment.id} className="flex flex-col gap-3">
                <CommentItem
                  comment={comment}
                  highlighted={highlightId === comment.id}
                  canManage={me.canManage}
                  onReactionsChange={updateCommentReactions}
                  onRemove={() => removeComment(comment.id)}
                  onRestore={() => restoreComment(comment.id)}
                  onBlocked={load}
                  onReply={(target) => startReply(target, comment.id)}
                />
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    isReply
                    highlighted={highlightId === reply.id}
                    canManage={me.canManage}
                    onReactionsChange={updateCommentReactions}
                    onRemove={() => removeComment(reply.id)}
                    onRestore={() => restoreComment(reply.id)}
                    onBlocked={load}
                    // One level only: replying to a reply joins its parent.
                    onReply={(target) => startReply(target, comment.id)}
                  />
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-lightGray bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 md:px-6">
          {replyTo ? (
            <div className="mb-2 flex items-center justify-between text-xs text-primaryGray">
              <span>
                Replying to <strong className="text-primary">{replyTo.name}</strong>
              </span>
              <button
                type="button"
                aria-label="Cancel reply"
                onClick={() => setReplyTo(null)}
                className="rounded p-1 hover:bg-lightGray/40"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          {offerAnonymous ? (
            <label className="mb-2 flex items-center gap-2 text-xs text-primaryGray">
              <input
                type="checkbox"
                checked={replyAnonymously}
                onChange={(event) => setReplyAnonymously(event.target.checked)}
                className="h-4 w-4 accent-amber-600"
              />
              Comment anonymously, like your post
            </label>
          ) : null}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={text}
              rows={1}
              maxLength={2000}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Write a comment…"
              aria-label="Write a comment"
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-lightGray bg-white px-4 py-2.5 text-sm text-primary focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={send}
              disabled={!text.trim() || sending}
              aria-label="Send comment"
              className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-45"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPostDetail;
