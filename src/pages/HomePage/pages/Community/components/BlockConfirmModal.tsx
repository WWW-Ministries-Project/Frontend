import { CommunitySheet } from "./CommunitySheet";
import {
  sheetPrimaryButton,
  sheetSecondaryButton,
} from "../utils/communityStyles";

interface BlockConfirmModalProps {
  open: boolean;
  /** First name, or "this author" for anonymous content. */
  name: string;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const BlockConfirmModal = ({
  open,
  name,
  submitting,
  onConfirm,
  onClose,
}: BlockConfirmModalProps) => (
  <CommunitySheet
    open={open}
    onClose={onClose}
    title={`Block ${name}?`}
    footer={
      <>
        <button type="button" className={sheetSecondaryButton} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={sheetPrimaryButton}
          disabled={submitting}
          onClick={onConfirm}
        >
          {submitting ? "Blocking…" : "Block"}
        </button>
      </>
    }
  >
    <p className="text-sm text-primaryGray">
      You won&apos;t see their posts or comments, and they won&apos;t be told.
      You can unblock them later from the Community page.
    </p>
  </CommunitySheet>
);
