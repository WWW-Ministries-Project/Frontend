import { useNavigate } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/utils/api/apiCalls";
import { showConfirmDialog } from "@/pages/HomePage/utils";
import type { CommunityReportReason } from "@/utils/api/community/interfaces";
import { BlockConfirmModal } from "./BlockConfirmModal";
import { CommunityToast, type CommunityToastState } from "./CommunityToast";
import { ReportModal } from "./ReportModal";
import { WhoReactedModal, type WhoReactedTarget } from "./WhoReactedModal";
import {
  CommunityInteractionsContext,
  type CommunityInteractionsValue,
  type ContentTarget,
} from "./communityInteractionsContext";

const TOAST_MS = 3600;

/** Owns the shared sheets (who reacted, report, block) and the undo toast so
 *  every post card and comment can trigger them without its own copies.
 *  Mounted once by CommunityLayout so the toast survives navigating between
 *  the feed and a post. */
export const CommunityInteractionsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  const [toast, setToast] = useState<CommunityToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [whoTarget, setWhoTarget] = useState<WhoReactedTarget | null>(null);

  const [reportTarget, setReportTarget] = useState<ContentTarget | null>(null);
  const reportDone = useRef<(() => void) | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [blockTarget, setBlockTarget] = useState<ContentTarget | null>(null);
  const blockDone = useRef<(() => void) | null>(null);
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const showToast = useCallback((text: string, onUndo?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, onUndo });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const openReport = useCallback(
    (target: ContentTarget, onReported: () => void) => {
      reportDone.current = onReported;
      setReportSubmitted(false);
      setReportTarget(target);
    },
    []
  );

  const closeReport = useCallback(() => {
    // The reporter no longer sees reported content; drop it once the sheet
    // closes so the thanks state does not flash over an empty card.
    if (reportSubmitted) reportDone.current?.();
    reportDone.current = null;
    setReportTarget(null);
    setReportSubmitted(false);
  }, [reportSubmitted]);

  const submitReport = useCallback(
    async (reason: CommunityReportReason, details: string) => {
      if (!reportTarget) return;
      setReportSubmitting(true);
      try {
        await api.post.createCommunityReport({
          ...(reportTarget.kind === "post"
            ? { postId: reportTarget.id }
            : { commentId: reportTarget.id }),
          reason,
          ...(details ? { details } : {}),
        });
        setReportSubmitted(true);
      } catch {
        // ApiErrorHandler has already shown the error.
      } finally {
        setReportSubmitting(false);
      }
    },
    [reportTarget]
  );

  const openBlock = useCallback(
    (target: ContentTarget, onBlocked: () => void) => {
      blockDone.current = onBlocked;
      setBlockTarget(target);
    },
    []
  );

  const confirmBlock = useCallback(async () => {
    if (!blockTarget) return;
    setBlockSubmitting(true);
    try {
      await api.post.createCommunityBlock(
        blockTarget.kind === "post"
          ? { postId: blockTarget.id }
          : { commentId: blockTarget.id }
      );
      blockDone.current?.();
      blockDone.current = null;
      setBlockTarget(null);
      showToast("Blocked. You won't see their posts or comments.");
    } catch {
      // ApiErrorHandler has already shown the error.
    } finally {
      setBlockSubmitting(false);
    }
  }, [blockTarget, showToast]);

  const hideContent = useCallback<CommunityInteractionsValue["hideContent"]>(
    async (target, { onHidden, onRestored, restorePath }) => {
      try {
        if (target.kind === "post") {
          await api.post.hideCommunityPost(target.id);
        } else {
          await api.post.hideCommunityComment(target.id);
        }
        onHidden();
        showToast(
          target.kind === "post" ? "Post hidden" : "Comment hidden",
          async () => {
            try {
              if (target.kind === "post") {
                await api.delete.unhideCommunityPost(target.id);
              } else {
                await api.delete.unhideCommunityComment(target.id);
              }
              onRestored();
              // Hidden from a page that then navigated away (post detail):
              // the provider outlives it, so take the member back.
              if (restorePath) navigate(restorePath);
            } catch {
              // ApiErrorHandler has already shown the error.
            }
          }
        );
      } catch {
        // ApiErrorHandler has already shown the error.
      }
    },
    [navigate, showToast]
  );

  const deleteContent = useCallback<CommunityInteractionsValue["deleteContent"]>(
    (target, onDeleted) => {
      showConfirmDialog(
        `Delete this ${target.kind}?`,
        async () => {
          try {
            if (target.kind === "post") {
              await api.delete.deleteCommunityPost(target.id);
            } else {
              await api.delete.deleteCommunityComment(target.id);
            }
            onDeleted();
            showToast(target.kind === "post" ? "Post deleted" : "Comment deleted");
          } catch {
            // ApiErrorHandler has already shown the error.
          }
        },
        { message: "It will be removed for everyone.", confirmLabel: "Delete" }
      );
    },
    [showToast]
  );

  const value = useMemo<CommunityInteractionsValue>(
    () => ({
      showToast,
      openWhoReacted: setWhoTarget,
      openReport,
      openBlock,
      hideContent,
      deleteContent,
    }),
    [showToast, openReport, openBlock, hideContent, deleteContent]
  );

  return (
    <CommunityInteractionsContext.Provider value={value}>
      {children}
      <WhoReactedModal target={whoTarget} onClose={() => setWhoTarget(null)} />
      <ReportModal
        open={Boolean(reportTarget)}
        noun={reportTarget?.kind ?? "post"}
        submitting={reportSubmitting}
        submitted={reportSubmitted}
        onSubmit={submitReport}
        onClose={closeReport}
      />
      <BlockConfirmModal
        open={Boolean(blockTarget)}
        name={blockTarget?.authorFirstName || "this author"}
        submitting={blockSubmitting}
        onConfirm={confirmBlock}
        onClose={() => {
          blockDone.current = null;
          setBlockTarget(null);
        }}
      />
      <CommunityToast toast={toast} onDismiss={dismissToast} />
    </CommunityInteractionsContext.Provider>
  );
};
