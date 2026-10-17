import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { Modal } from "@/components/Modal";
import { cn } from "@/utils/cn";

interface RideSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Full-width actions pinned under the scrolling body. */
  footer?: ReactNode;
  /** Controls above the scrolling list (e.g. a search field). */
  toolbar?: ReactNode;
  /** Hide the visible heading (a sheet showing its own success state). */
  hideHeader?: boolean;
  className?: string;
}

/** The design's bottom sheets, rendered as centred dialogs on the web. */
export const RideSheet = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  toolbar,
  hideHeader = false,
  className,
}: RideSheetProps) => (
  <Modal
    open={open}
    onClose={onClose}
    persist={false}
    title={title}
    className={cn("max-w-md", className)}
  >
    {hideHeader ? null : (
      <div className="flex flex-none flex-col gap-4 px-5 pb-3 pt-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-primary">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-primaryGray">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-lightGray/30 text-primary hover:bg-lightGray/50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {toolbar}
      </div>
    )}
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">{children}</div>
    {footer ? (
      <div className="flex flex-none flex-col gap-3 px-5 pb-5 pt-3">
        {footer}
      </div>
    ) : null}
  </Modal>
);
