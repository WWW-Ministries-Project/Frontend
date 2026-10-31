import { cn } from "@/utils/cn";
import type { AiTask, AiTaskAction, AiTaskType } from "@/utils/api/ai/tasksInterfaces";

const TYPE_STYLES: Record<AiTaskType, { label: string; className: string }> = {
  approval: { label: "Approval", className: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]" },
  report: { label: "Report", className: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]" },
  followup: { label: "Follow-up", className: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]" },
  finance: { label: "Finance", className: "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]" },
  asset: { label: "Assets", className: "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]" },
};

interface TaskCardProps {
  task: AiTask;
  onAction: (task: AiTask, action: AiTaskAction) => void;
}

export const TaskCard = ({ task, onAction }: TaskCardProps) => {
  const type = TYPE_STYLES[task.type] ?? TYPE_STYLES.finance;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-[#D8DAE5] bg-white p-4">
      <div className="flex flex-col gap-2">
        <span className={cn("self-start rounded-full border px-2 text-xs font-semibold leading-5", type.className)}>
          {type.label}
        </span>
        <h3 className="text-base font-semibold leading-6 text-[#080D2D]">{task.title}</h3>
        <p className="text-sm text-gray-600">{task.meta}</p>
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

      {task.actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {task.actions.map((action, index) => (
            <button
              key={action.key}
              type="button"
              onClick={() => onAction(task, action)}
              className={cn(
                "min-h-[40px] rounded-lg px-4 py-2 text-sm font-medium",
                index === 0
                  ? "bg-[#080D2D] text-white hover:bg-[#080D2D]/90"
                  : "border border-[#080D2D]/30 bg-white text-[#080D2D] hover:bg-[#F8F9FC]"
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
