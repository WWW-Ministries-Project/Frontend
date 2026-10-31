import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useAssistantStore } from "@/store/assistantStore";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import type { AiTask, AiTaskAction, AiTasksResponse } from "@/utils/api/ai/tasksInterfaces";

import { TaskCard } from "../TaskCard";

const EMPTY: AiTasksResponse = { summary: { total: 0, overdue: 0, doneToday: 0 }, groups: [] };

const taskKey = (task: AiTask) => `${task.source}:${task.id}`;

interface ForYouTabProps {
  greetingName: string;
}

export const ForYouTab = ({ greetingName }: ForYouTabProps) => {
  const navigate = useNavigate();
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const setTasksCount = useAssistantStore((state) => state.setTasksCount);
  const [data, setData] = useState<AiTasksResponse>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const res = await api.fetch.fetchAiTasks(buildBranchQuery(activeBranchId));
        setData(res.data ?? EMPTY);
      } catch {
        setError("Couldn't load your tasks. Try again shortly.");
      } finally {
        setLoading(false);
      }
    },
    [activeBranchId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setTasksCount(data.summary.total);
  }, [data.summary.total, setTasksCount]);

  const onAction = (task: AiTask, action: AiTaskAction) => {
    if (action.kind === "open" && task.screen) {
      navigate(task.screen);
      return;
    }
    // Approve/assign/generate/sms are wired to module endpoints in a later phase.
    notify.info({ title: "Available soon", message: "This action will be wired up shortly." });
  };

  const onSnooze = async (task: AiTask, until: string, label: string) => {
    const key = taskKey(task);
    // Optimistic: drop the task from its group now.
    setData((prev) => ({
      ...prev,
      groups: prev.groups
        .map((group) => ({ ...group, items: group.items.filter((item) => taskKey(item) !== key) }))
        .filter((group) => group.items.length > 0),
      summary: { ...prev.summary, total: Math.max(0, prev.summary.total - 1) },
    }));

    try {
      await api.post.setAiTaskState({ task_key: key, state: "snoozed", snoozed_until: until, label });
      notify.success({
        title: `Snoozed until ${label.toLowerCase()}`,
        message: task.title,
        action: {
          label: "Undo",
          onClick: () => {
            void api.delete.clearAiTaskState(key).then(() => load(false));
          },
        },
      });
    } catch {
      notify.error({ title: "Couldn't snooze", message: "Try again." });
      void load(false);
    }
  };

  const { summary, groups } = data;
  const done = summary.doneToday;
  const progressPct = summary.total + done > 0 ? Math.round((done / (summary.total + done)) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <div className="flex flex-col gap-2 rounded-xl border border-[#D8DAE5] bg-[#F8F9FC] p-4">
        <p className="text-base font-semibold text-[#080D2D]">
          {greeting}, {greetingName}.
        </p>
        <p className="text-sm text-gray-600">
          {summary.total > 0
            ? `You have ${summary.total} item${summary.total > 1 ? "s" : ""} waiting${
                summary.overdue > 0 ? ` — ${summary.overdue} overdue.` : "."
              }`
            : "Nothing is waiting on you right now."}
        </p>
        {summary.total + done > 0 ? (
          <div className="mt-1 flex flex-col gap-1">
            <p className="text-xs text-gray-500">
              {done} of {summary.total + done} done today
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-[#080D2D] transition-[width]" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      {loading ? (
        <p className="py-6 text-center text-sm text-gray-500">Loading your tasks…</p>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0FDF4] text-[#15803D]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p className="text-base font-semibold text-[#080D2D]">You’re all caught up</p>
          <p className="text-sm text-gray-600">I’ll remind you when something new needs you.</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: group.color }}>
              {group.label} · {group.items.length}
            </p>
            {group.items.map((task) => (
              <TaskCard key={taskKey(task)} task={task} onAction={onAction} onSnooze={onSnooze} />
            ))}
          </div>
        ))
      )}
    </div>
  );
};
