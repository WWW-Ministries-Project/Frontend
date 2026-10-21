import * as Dialog from "@radix-ui/react-dialog";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { FormEvent, ReactNode } from "react";
import { cn } from "@/utils/cn";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
} from "./rideClasses";

interface RideSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Actions pinned under the scrolling body. */
  footer?: ReactNode;
  /** Hide the visible header (a sheet showing its own success state). */
  hideHeader?: boolean;
  /** Wrap the body in a form; Enter submits. */
  onSubmit?: () => void;
  /** Keep the sheet open on outside click / Escape (e.g. while saving). */
  locked?: boolean;
  className?: string;
}

/** The design's sheet: a bottom sheet on phones, a centred dialog from
 *  640px up (max 560px wide). */
export const RideSheet = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  hideHeader = false,
  onSubmit,
  locked = false,
  className,
}: RideSheetProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.();
  };

  const body = (
    <>
      {hideHeader ? null : (
        <div className="flex flex-none items-start gap-3 border-b border-gray-200 px-4 py-5 tablet:px-6">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Dialog.Title className="text-xl font-semibold leading-7 text-primary">
              {title}
            </Dialog.Title>
            {subtitle ? (
              <Dialog.Description className="text-sm text-primaryGray">
                {subtitle}
              </Dialog.Description>
            ) : null}
          </div>
          <Dialog.Close
            aria-label="Close"
            disabled={locked}
            className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg text-mainGray hover:bg-gray-100 disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
          </Dialog.Close>
        </div>
      )}
      {hideHeader ? (
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 text-sm text-primary tablet:px-6">
        {children}
      </div>
      {footer ? (
        <div className="flex flex-none flex-wrap justify-end gap-2 border-t border-gray-200 px-4 py-4 tablet:px-6">
          {footer}
        </div>
      ) : null}
    </>
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !locked) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[130] bg-primary/45" />
        <div className="pointer-events-none fixed inset-0 z-[130] flex items-end justify-center tablet:items-center tablet:p-4">
          <Dialog.Content
            aria-describedby={undefined}
            className={cn(
              "pointer-events-auto flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-lightGray bg-white shadow-2xl animate-toast-in focus:outline-none tablet:w-[min(560px,100%)] tablet:rounded-2xl",
              className
            )}
          >
            {onSubmit ? (
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                {body}
              </form>
            ) : (
              body
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/** Cancel + the sheet's main action. Put the sheet in `onSubmit` mode so
 *  the main action is a submit button. */
export const SheetActions = ({
  onCancel,
  submitLabel,
  submittingLabel,
  submitting = false,
  danger = false,
  cancelLabel = "Cancel",
  disabled = false,
}: {
  onCancel: () => void;
  submitLabel: string;
  submittingLabel?: string;
  submitting?: boolean;
  danger?: boolean;
  cancelLabel?: string;
  disabled?: boolean;
}) => (
  <>
    <button
      type="button"
      onClick={onCancel}
      disabled={submitting}
      className={btnSecondary}
    >
      {cancelLabel}
    </button>
    <button
      type="submit"
      disabled={submitting || disabled}
      className={danger ? btnDanger : btnPrimary}
    >
      {submitting ? (submittingLabel ?? `${submitLabel}…`) : submitLabel}
    </button>
  </>
);

/** Inline error inside a sheet. */
export const SheetError = ({ message }: { message: string | null }) =>
  message ? (
    <p role="alert" className="text-sm text-red-700 dark:text-red-300">
      {message}
    </p>
  ) : null;
