import { useState } from "react";

import { cn } from "@/utils/cn";
import type { AiTask, AiTaskAction, AiTaskType } from "@/utils/api/ai/tasksInterfaces";

const TYPE_STYLES: Record<AiTaskType, { label: string; className: string }> = {
  approval: { label: "Approval", className: "bg-amber-50 text-amber-700 border-amber-200" },
  report: { label: "Report", className: "bg-blue-50 text-blue-700 border-blue-200" },
  followup: { label: "Follow-up", className: "bg-green-50 text-green-700 border-green-200" },
  finance: { label: "Finance", className: "bg-gray-100 text-gray-700 border-gray-200" },
  asset: { label: "Assets", className: "bg-gray-100 text-gray-700 border-gray-200" },
};

const SNOOZE_OPTIONS: { key: string; label: string }[] = [
  { key: "later", label: "Later today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "monday", label: "Monday" },
];

// Compute the wake-up time for a snooze option.
const snoozeDate = (key: string): Date => {
  const date = new Date();
  if (key === "later") {
    date.setHours(date.getHours() + 4);
  } else if (key === "tomorrow") {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
  } else {
    const day = date.getDay();
    const add = (8 - day) % 7 || 7; // next Monday
    date.setDate(date.getDate() + add);
    date.setHours(9, 0, 0, 0);
  }
  return date;
};

interface TaskCardProps {
  task: AiTask;
  onAction: (task: AiTask, action: AiTaskAction) => void;
  onSnooze: (task: AiTask, until: string, label: string) => void;
}

export const TaskCard = ({ task, onAction, onSnooze }: TaskCardProps) => {
  const type = TYPE_STYLES[task.type] ?? TYPE_STYLES.finance;
  const [showSnooze, setShowSnooze] = useState(false);

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className={cn("self-start rounded-full border px-2 text-xs font-semibold leading-5", type.className)}>
            {type.label}
          </span>
          <h3 className="text-base font-semibold leading-6 text-primary">{task.title}</h3>
          {task.meta ? <p className="text-sm text-gray-600">{task.meta}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setShowSnooze((prev) => !prev)}
          aria-label="Snooze"
          title="Snooze"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-lightGray bg-white text-gray-600 hover:bg-inputBackground hover:text-primary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>
      </div>

      {task.people && task.people.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {task.people.map((name) => (
            <span key={name} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium">
              {name}
            </span>
          ))}
        </div>
      ) : null}

      {task.why ? <p className="text-xs text-gray-500">{task.why}</p> : null}

      {showSnooze ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Remind me</p>
          <div className="flex flex-wrap gap-2">
            {SNOOZE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setShowSnooze(false);
                  onSnooze(task, snoozeDate(option.key).toISOString(), option.label);
                }}
                className="min-h-[40px] rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-inputBackground"
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowSnooze(false)}
              className="min-h-[40px] rounded-lg bg-transparent px-4 py-2 text-sm font-medium text-gray-600 hover:bg-primary/5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : task.actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {task.actions.map((action, index) => (
            <button
              key={action.key}
              type="button"
              onClick={() => onAction(task, action)}
              className={cn(
                "min-h-[40px] rounded-lg px-4 py-2 text-sm font-medium",
                index === 0
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "border border-primary/30 bg-white text-primary hover:bg-inputBackground"
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
};
