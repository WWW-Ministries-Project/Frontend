import type {
  ApprovalStep,
  ApproverType,
  EventReportApprovalConfigPayload,
  RequisitionApprovalConfigPayload,
  SingleApproverConfig,
} from "@/pages/HomePage/pages/Requisitions/types/approvalWorkflow";
import type { FinanceApprovalConfigPayload } from "@/utils/api/finance/interface";

export type WorkflowKey = "REQ" | "REP" | "FIN";

export const WORKFLOW_KEYS: WorkflowKey[] = ["REQ", "REP", "FIN"];

export const WF: Record<WorkflowKey, { title: string; description: string }> = {
  REQ: { title: "Requisition", description: "Who can raise requisitions, who approves them and in what order." },
  REP: { title: "Event report", description: "Who signs off the financial section and the final event report." },
  FIN: { title: "Finance records", description: "Who gives final approval on finance records." },
};

export const APPROVER_TYPES: { value: ApproverType; label: string }[] = [
  { value: "HEAD_OF_DEPARTMENT", label: "Head of department" },
  { value: "POSITION", label: "Position" },
  { value: "SPECIFIC_PERSON", label: "Specific person" },
];

export const DEFAULT_LOOKBACK_DAYS = 30;
export const DEFAULT_REPLY_DAYS = 3;
export const MAX_REPLY_DAYS = 30;

/** One approver: the head of department, a position or a person. `value` is the position or user id. */
export interface StepDraft {
  type: ApproverType;
  value: number | null;
}

/** Editable shape shared by the three workflows; each uses the fields it needs. */
export interface WorkflowDraft {
  requesters: number[];
  steps: StepDraft[];
  /** Event report: who signs off the financial section. */
  finance: StepDraft;
  /** Finance records: the one approver. */
  approver: number | null;
  notify: number[];
  lookback: string;
  reply: string;
  active: boolean;
}

/** What a card holds: `exists` false means the workflow was never set up. */
export interface StoredWorkflow {
  exists: boolean;
  draft: WorkflowDraft;
}

export const emptyStep = (): StepDraft => ({ type: "POSITION", value: null });

export const emptyDraft = (): WorkflowDraft => ({
  requesters: [],
  steps: [emptyStep()],
  finance: emptyStep(),
  approver: null,
  notify: [],
  lookback: String(DEFAULT_LOOKBACK_DAYS),
  reply: String(DEFAULT_REPLY_DAYS),
  active: false,
});

export const cloneDraft = (draft: WorkflowDraft): WorkflowDraft => ({
  ...draft,
  requesters: [...draft.requesters],
  steps: draft.steps.map((step) => ({ ...step })),
  finance: { ...draft.finance },
  notify: [...draft.notify],
});

/* ----------------------------- Response parsing ---------------------------- */

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);

const positiveInt = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const idList = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  const ids: number[] = [];
  value.forEach((item) => {
    const id = positiveInt(item);
    if (id && !ids.includes(id)) ids.push(id);
  });
  return ids;
};

const parseType = (value: unknown): ApproverType | null => {
  const type = String(value ?? "").toUpperCase();
  return type === "HEAD_OF_DEPARTMENT" || type === "POSITION" || type === "SPECIFIC_PERSON" ? type : null;
};

const parseApprover = (raw: unknown): StepDraft | null => {
  if (!isRecord(raw)) return null;
  const type = parseType(raw.type);
  if (!type) return null;
  if (type === "POSITION") return { type, value: positiveInt(raw.position_id) };
  if (type === "SPECIFIC_PERSON") return { type, value: positiveInt(raw.user_id) };
  return { type, value: null };
};

/** The GET can return one config, a list of configs, or null. */
const pickConfig = (payload: unknown, module: string): UnknownRecord | null => {
  if (Array.isArray(payload)) {
    const match = payload.find((item) => isRecord(item) && item.module === module);
    return isRecord(match) ? match : null;
  }
  if (!isRecord(payload)) return null;
  if (payload.module && payload.module !== module) return null;
  return payload;
};

const parseSteps = (raw: unknown): StepDraft[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((step) => ({ order: Number(step.order) || 0, step: parseApprover(step) }))
    .sort((a, b) => a.order - b.order)
    .map((item) => item.step)
    .filter((step): step is StepDraft => !!step);
};

export const parseRequisition = (payload: unknown): StoredWorkflow => {
  const config = pickConfig(payload, "REQUISITION");
  if (!config) return { exists: false, draft: emptyDraft() };
  const steps = parseSteps(config.approvers);
  return {
    exists: true,
    draft: {
      ...emptyDraft(),
      // Save back only the people picked here; the API adds everyone whose
      // role can manage Requisition on its own. Older APIs send only the merged list.
      requesters: idList(config.configured_requester_user_ids).length
        ? idList(config.configured_requester_user_ids)
        : idList(config.requester_user_ids),
      steps: steps.length ? steps : [emptyStep()],
      notify: idList(config.notification_user_ids),
      lookback: String(positiveInt(config.similar_item_lookback_days) ?? DEFAULT_LOOKBACK_DAYS),
      reply: String(positiveInt(config.approval_reply_days) ?? DEFAULT_REPLY_DAYS),
      active: config.is_active === undefined ? true : Boolean(config.is_active),
    },
  };
};

export const parseEventReport = (payload: unknown): StoredWorkflow => {
  const config = pickConfig(payload, "EVENT_REPORT");
  if (!config) return { exists: false, draft: emptyDraft() };
  const steps = parseSteps(config.approvers);
  return {
    exists: true,
    draft: {
      ...emptyDraft(),
      steps: steps.length ? steps : [emptyStep()],
      finance: parseApprover(config.finance_approver) ?? emptyStep(),
      notify: idList(config.notification_user_ids),
      active: config.is_active === undefined ? true : Boolean(config.is_active),
    },
  };
};

/** The finance GET always answers; no approver means it was never set up. */
export const parseFinance = (payload: unknown): StoredWorkflow => {
  if (!isRecord(payload)) return { exists: false, draft: emptyDraft() };
  const approver = positiveInt(payload.finance_approver_user_id);
  return {
    exists: approver !== null,
    draft: {
      ...emptyDraft(),
      approver,
      notify: idList(payload.notification_user_ids),
      active: approver === null ? false : payload.is_active === undefined ? true : Boolean(payload.is_active),
    },
  };
};

/* --------------------------------- Payloads -------------------------------- */

const stepPayload = (step: StepDraft): SingleApproverConfig => {
  if (step.type === "POSITION") return { type: step.type, position_id: step.value ?? undefined };
  if (step.type === "SPECIFIC_PERSON") return { type: step.type, user_id: step.value ?? undefined };
  return { type: step.type };
};

const stepsPayload = (steps: StepDraft[]): ApprovalStep[] =>
  steps.map((step, index) => ({ order: index + 1, ...stepPayload(step) }));

export const requisitionPayload = (draft: WorkflowDraft, active: boolean): RequisitionApprovalConfigPayload => ({
  module: "REQUISITION",
  requester_user_ids: draft.requesters,
  approvers: stepsPayload(draft.steps),
  notification_user_ids: draft.notify,
  similar_item_lookback_days: Number(draft.lookback),
  approval_reply_days: Number(draft.reply),
  is_active: active,
});

export const eventReportPayload = (draft: WorkflowDraft, active: boolean): EventReportApprovalConfigPayload => ({
  approvers: stepsPayload(draft.steps),
  finance_approver: stepPayload(draft.finance),
  notification_user_ids: draft.notify,
  is_active: active,
});

export const financePayload = (draft: WorkflowDraft, active: boolean): FinanceApprovalConfigPayload => ({
  finance_approver_user_id: draft.approver,
  notification_user_ids: draft.notify,
  is_active: active,
});

/* ------------------------------- Validation -------------------------------- */

export const stepIsOpen = (step: StepDraft) => step.type !== "HEAD_OF_DEPARTMENT" && !step.value;

const isWholeDays = (value: string, max?: number) => {
  const n = Number(value);
  return value.trim() !== "" && Number.isInteger(n) && n > 0 && (!max || n <= max);
};

export const lookbackOk = (draft: WorkflowDraft) => isWholeDays(draft.lookback);
export const replyOk = (draft: WorkflowDraft) => isWholeDays(draft.reply, MAX_REPLY_DAYS);

export const workflowErrors = (key: WorkflowKey, draft: WorkflowDraft): string[] => {
  const errors: string[] = [];
  if (key === "REQ" && !draft.requesters.length) errors.push("Choose at least one person who can raise requisitions.");
  if (key === "REP" && stepIsOpen(draft.finance)) errors.push("Choose who approves the financial report.");
  if (key !== "FIN" && draft.steps.some(stepIsOpen)) errors.push("Finish every approval step: pick its position or person.");
  if (key === "FIN" && !draft.approver) errors.push("Choose the finance approver.");
  if (key === "REQ" && !lookbackOk(draft)) errors.push("Similar-item lookback must be a whole number of days.");
  if (key === "REQ" && !replyOk(draft)) errors.push("Reply time must be between 1 and 30 days.");
  return errors;
};

/* --------------------------------- Labels ---------------------------------- */

export const hodNote = (key: WorkflowKey) =>
  key === "REQ"
    ? "Whoever heads the requester’s department approves this step."
    : "Whoever heads the report owner’s department approves this step.";

export const stepLabel = (
  step: StepDraft,
  key: WorkflowKey,
  positionName: (id: number) => string,
  personName: (id: number) => string
) => {
  if (step.type === "HEAD_OF_DEPARTMENT") {
    return key === "REQ" ? "Requester’s head of department" : "Report owner’s head of department";
  }
  if (step.type === "POSITION") return step.value ? positionName(step.value) : "Position not chosen";
  return step.value ? personName(step.value) : "Person not chosen";
};

export const reqNote = (draft: WorkflowDraft) => {
  const reply = Number(draft.reply);
  return `Approvers see similar items requested in the last ${draft.lookback} days, and have ${draft.reply} ${
    reply === 1 ? "day" : "days"
  } to reply before it’s overdue. Overdue approvers get a reminder each morning.`;
};
