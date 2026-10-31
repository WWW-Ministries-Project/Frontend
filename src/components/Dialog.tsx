import {
  describeError,
  notify,
  recentApiErrorToast,
} from "@/components/feedback/notify";
import { useDialogStore } from "@/pages/HomePage/store/globalComponentsStore";
import { cn } from "@/utils/cn";
import { useEffect, useId, useRef, useState } from "react";

const Spinner = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    className="animate-spin"
    aria-hidden="true"
  >
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);

/** Global confirm dialog. Opened via showDeleteDialog / showConfirmDialog / confirmAction. */
export const Dialog = () => {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const inputId = useId();
  const { dialogData } = useDialogStore();
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dialogData.showModal) {
      setTyped("");
      setPending(false);
      setError(null);
      if (!dialog.current?.open) dialog.current?.showModal();
      cancelRef.current?.focus();
    } else {
      dialog.current?.close();
    }
  }, [dialogData.showModal, dialogData.onConfirm]);

  const isDanger = (dialogData.tone ?? "danger") === "danger";
  const title =
    dialogData.title ?? `Delete ${dialogData.name ?? "this record"}?`;
  const points =
    dialogData.points ??
    (dialogData.message === undefined ? ["This can't be undone."] : []);
  const confirmLabel = dialogData.confirmLabel ?? "Delete";
  const cancelLabel = dialogData.cancelLabel ?? "Cancel";
  const mustType = dialogData.typeToConfirm?.trim();
  const canConfirm = !pending && (!mustType || typed.trim() === mustType);

  const cancel = () => {
    if (pending) return;
    dialogData.onCancel();
  };

  const confirm = () => {
    if (!canConfirm) return;
    setError(null);
    const result = dialogData.onConfirm();
    if (!result || typeof (result as Promise<unknown>).then !== "function")
      return;
    setPending(true);
    (result as Promise<unknown>)
      .then(() => {
        setPending(false);
        useDialogStore.getState().dialogDataReset();
      })
      .catch((err: unknown) => {
        setPending(false);
        // The error shows inside the dialog; drop the automatic toast.
        const recent = recentApiErrorToast();
        if (recent) notify.dismiss(recent.id);
        setError(describeError(err, { preferServerMessage: true }).message);
      });
  };

  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) cancel();
      }}
      className="w-[calc(100%-2rem)] max-w-[480px] rounded-2xl border border-lightGray bg-white p-6 text-sm leading-5 text-primary backdrop:bg-primary/45"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          {isDanger ? (
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-error/10 text-error"
              aria-hidden="true"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
              </svg>
            </span>
          ) : null}
          <div className="flex min-w-0 flex-col gap-2">
            <h2 id={titleId} className="text-xl font-semibold leading-7">
              {title}
            </h2>
            {dialogData.message !== undefined ? (
              <div className="text-primaryGray">{dialogData.message}</div>
            ) : null}
            {points.length > 0 ? (
              <ul className="list-disc pl-[18px] text-primaryGray">
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {mustType && !dialogData.blocked ? (
          <div className="flex flex-col gap-1">
            <label htmlFor={inputId}>
              Type <span className="font-semibold">{mustType}</span> to confirm
            </label>
            <input
              id={inputId}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirm();
                }
              }}
              autoComplete="off"
              className="h-10 rounded-lg border border-mainGray/35 bg-white px-3 text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex gap-2 rounded-lg border border-error/25 bg-error/5 px-3 py-2 text-primary"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="mt-0.5 flex-shrink-0 text-error"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5.5M12 16v.5" />
            </svg>
            <p>
              <span className="font-semibold">Nothing was changed.</span>{" "}
              {error}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={cancel}
            disabled={pending}
            className="min-h-10 rounded-lg border border-primary/30 bg-white px-4 py-2 font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          {dialogData.blocked ? null : (
            <button
              type="button"
              onClick={confirm}
              disabled={!canConfirm}
              aria-busy={pending}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-lg px-5 py-2 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                isDanger
                  ? "bg-error hover:bg-error/90"
                  : "bg-primary hover:bg-primary/90",
              )}
            >
              {pending ? <Spinner /> : null}
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
};
