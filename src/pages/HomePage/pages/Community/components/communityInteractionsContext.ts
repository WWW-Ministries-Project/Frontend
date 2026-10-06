import { createContext, useContext } from "react";
import type { WhoReactedTarget } from "./WhoReactedModal";

export interface ContentTarget {
  kind: "post" | "comment";
  id: number;
  /** First name of the author, or null when the content is anonymous. */
  authorFirstName: string | null;
}

export interface CommunityInteractionsValue {
  showToast: (text: string, onUndo?: () => void) => void;
  openWhoReacted: (target: WhoReactedTarget) => void;
  openReport: (target: ContentTarget, onReported: () => void) => void;
  openBlock: (target: ContentTarget, onBlocked: () => void) => void;
  hideContent: (
    target: ContentTarget,
    handlers: {
      onHidden: () => void;
      onRestored: () => void;
      /** Where to navigate after Undo, when the hiding page has gone. */
      restorePath?: string;
    }
  ) => void;
  deleteContent: (target: ContentTarget, onDeleted: () => void) => void;
}

export const CommunityInteractionsContext =
  createContext<CommunityInteractionsValue | null>(null);

export const useCommunityInteractions = (): CommunityInteractionsValue => {
  const value = useContext(CommunityInteractionsContext);
  if (!value) {
    throw new Error(
      "useCommunityInteractions must be used inside CommunityInteractionsProvider"
    );
  }
  return value;
};
