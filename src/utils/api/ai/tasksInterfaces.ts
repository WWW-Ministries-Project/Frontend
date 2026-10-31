// Assistant "For you" task feed. Mirrors the backend /ai/tasks contract.
export type AiTaskType = "approval" | "report" | "followup" | "finance" | "asset";

export type AiTaskGroupKey = "overdue" | "today" | "week";

export type AiTaskActionKind = "approve" | "assign" | "generate" | "sms" | "open";

export interface AiTaskAction {
  key: string;
  label: string;
  kind: AiTaskActionKind;
}

export interface AiTask {
  id: string;
  source: string;
  type: AiTaskType;
  title: string;
  meta: string;
  why?: string;
  people?: string[];
  group: AiTaskGroupKey;
  actions: AiTaskAction[];
  screen?: string;
  state?: "done" | "snoozed";
}

export interface AiTaskGroup {
  key: AiTaskGroupKey;
  label: string;
  color: string;
  items: AiTask[];
}

export interface AiTasksSummary {
  total: number;
  overdue: number;
  doneToday: number;
}

export interface AiTasksResponse {
  summary: AiTasksSummary;
  groups: AiTaskGroup[];
  warnings?: string[];
}
