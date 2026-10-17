import { CheckCircleIcon } from "@heroicons/react/24/solid";

export interface CommunityToastState {
  id: number;
  text: string;
  onUndo?: () => void;
}

interface CommunityToastProps {
  toast: CommunityToastState | null;
  onDismiss: () => void;
}

/** Small bottom toast with an optional Undo, used for reversible actions
 *  (hide). The app-wide `showNotification` has no action slot. */
export const CommunityToast = ({ toast, onDismiss }: CommunityToastProps) => {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-6 z-[140] mx-auto flex max-w-md items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm text-white shadow-2xl"
    >
      <CheckCircleIcon className="h-5 w-5 flex-none text-amber-300" />
      <span className="flex-1">{toast.text}</span>
      {toast.onUndo ? (
        <button
          type="button"
          className="rounded-md px-2 py-1 font-semibold text-amber-300 hover:bg-white/10"
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
        >
          Undo
        </button>
      ) : null}
    </div>
  );
};
