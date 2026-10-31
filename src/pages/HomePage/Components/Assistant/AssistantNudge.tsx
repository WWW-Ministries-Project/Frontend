// Proactive nudge shown when items are overdue and the drawer is closed.
interface AssistantNudgeProps {
  overdue: number;
  onOpen: () => void;
  onDismiss: () => void;
}

export const AssistantNudge = ({ overdue, onOpen, onDismiss }: AssistantNudgeProps) => {
  const plural = overdue > 1;

  return (
    <div
      role="status"
      className="pointer-events-auto fixed bottom-28 right-6 z-[110] flex w-80 max-w-[calc(100vw-32px)] gap-3 rounded-xl border border-[#D8DAE5] bg-white p-4 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#080D2D] text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
        </svg>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-semibold text-[#080D2D]">
          {overdue} item{plural ? "s are" : " is"} overdue
        </p>
        <p className="text-sm text-gray-600">Open the assistant to clear what’s waiting on you.</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="min-h-[40px] rounded-lg bg-[#080D2D] px-4 py-2 text-sm font-medium text-white hover:bg-[#080D2D]/90"
          >
            Show me
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[40px] rounded-lg bg-transparent px-4 py-2 text-sm font-medium text-[#080D2D] hover:bg-[#080D2D]/5"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
