import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { Modal } from "@/components/Modal";
import { cn } from "@/utils/cn";

interface CommunitySheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** The design's bottom sheets, rendered as centred dialogs on the web. */
export const CommunitySheet = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
}: CommunitySheetProps) => (
  <Modal
    open={open}
    onClose={onClose}
    persist={false}
    title={title}
    className={cn("max-w-md", className)}
  >
    <div className="flex items-start gap-3 border-b border-lightGray px-5 py-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-primaryGray">{subtitle}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="rounded-lg p-1 text-primaryGray hover:bg-lightGray/40"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
    {footer ? (
      <div className="flex justify-end gap-3 border-t border-lightGray px-5 py-4">
        {footer}
      </div>
    ) : null}
  </Modal>
);
