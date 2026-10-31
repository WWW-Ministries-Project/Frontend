import { api } from "@/utils/api/apiCalls";
import type { DeptReportSelector } from "@/utils/api/reports/interfaces";
import type { QueueItem, QueueKind } from "@/utils/api/workspaces/interfaces";
import type { VisitorType } from "@/utils/api/visitors/interfaces";
import {
  COMPLETED_STATUS,
  responsibleMemberIds,
  saveFollowUp,
  setResponsibleMembers,
} from "@/utils/api/visitors/visitorActions";

/*
 * Queue actions run the same module endpoints the module pages use; the
 * workspace endpoint itself only reads.
 */

export type ActionInput = "note" | "assignee" | "followup";

export interface ActionValues {
  note: string;
  assignee: { id: string; name: string } | null;
  followType: string;
  userId: string;
}

export interface QueueAction {
  key: string;
  label: string;
  tone: "primary" | "secondary" | "danger";
  /** What the modal must collect before this can run. */
  input?: ActionInput;
  /** Leaves Home instead of acting (e.g. reschedule). */
  to?: (item: QueueItem) => string;
  /** Toast title after it succeeds. */
  doneTitle: string;
  /** Toast title when it fails ("Couldn't …"). */
  failTitle: string;
  run?: (item: QueueItem, values: ActionValues) => Promise<unknown>;
  /** Whether the caller's role allows it: the same action key the module checks. */
  allowed?: (access: QueueAccess) => boolean;
}

/** Role checks for queue actions (see useQueueAccess). */
export interface QueueAccess {
  hasAction: (qualified: string) => boolean;
  /** The role switched "Domain.action" off on purpose. */
  switchedOff: (qualified: string) => boolean;
  canSignOffDeptReports: () => boolean;
}

/*
 * Requisition steps and department heads come from relationships (approval
 * chain, department head), not the level, so the role can only switch those
 * actions off; the server lists only items the caller can act on.
 */
const notSwitchedOff = (key: string) => (access: QueueAccess) => !access.switchedOff(key);
const needs = (key: string) => (access: QueueAccess) => access.hasAction(key);

export const KIND_META: Record<QueueKind, { eyebrow: string; tab: string }> = {
  requisition: { eyebrow: "REQUISITION", tab: "Requisitions" },
  dept_report: { eyebrow: "DEPARTMENT REPORT", tab: "Reports" },
  appointment: { eyebrow: "APPOINTMENT REQUEST", tab: "Appointments" },
  join_request: { eyebrow: "JOIN REQUEST", tab: "Join" },
  visitor: { eyebrow: "VISITOR", tab: "Visitors" },
  weekly_record: { eyebrow: "WEEKLY RECORD", tab: "Weekly records" },
  sermon: { eyebrow: "SERMON", tab: "Sermons" },
  follow_up: { eyebrow: "VISITOR FOLLOW-UP", tab: "Follow-ups" },
};

export const PATHS = {
  requisitions: "/home/requests/staff_requests",
  requisitionNew: "/home/requests?new=1",
  requisitionAnalytics: "/home/requests/analytics",
  deptReports: "/home/reports/department",
  executiveSummary: "/home/reports/executive-summary",
  appointments: "/home/appointments",
  joinRequests: "/home/membership/membership-management/join-requests",
  visitors: "/home/visitors",
  visitor: (id: number | string) => `/home/visitors/visitor/${id}`,
  finance: "/home/finance",
  financeRecord: (id: number | string) => `/home/finance/${id}`,
  financeNew: "/home/finance/create",
  pledges: "/home/finance/pledges",
  sermons: "/home/communication/sermons",
  events: "/home/events/events",
  lifeCenters: "/home/life-centers",
  assets: "/home/assets",
  eventAttendance: "/home/church-attendance/event-attendance",
  notifications: "/home/notifications",
  deptReport: (key: string, periodType: string, periodKey: string) =>
    `/home/reports/department/${encodeURIComponent(key)}?period_type=${encodeURIComponent(
      periodType
    )}&period_key=${encodeURIComponent(periodKey)}`,
} as const;

/** "Open in …" target for the detail modal. */
export const fullLink = (item: QueueItem): { label: string; to: string } => {
  switch (item.kind) {
    case "requisition":
      return { label: "Open in Requisitions", to: `/home/requests/${window.btoa(String(item.ref_id))}` };
    case "dept_report":
      return item.selector
        ? {
            label: "Open in Department reports",
            to: PATHS.deptReport(item.selector.report_key, item.selector.period_type, item.selector.period_key),
          }
        : { label: "Open in Department reports", to: PATHS.deptReports };
    case "appointment":
      return { label: "Open in Appointments", to: PATHS.appointments };
    case "join_request":
      return { label: "Open in Membership manager", to: PATHS.joinRequests };
    case "visitor":
    case "follow_up":
      return { label: "Open in Visitors", to: PATHS.visitor(item.ref_id) };
    case "weekly_record":
      return { label: "Open in Finance Manager", to: PATHS.financeRecord(item.ref_id) };
    case "sermon":
      return { label: "Open in Sermons", to: PATHS.sermons };
  }
};

const approveRequisition: QueueAction = {
  key: "approve",
  label: "Approve",
  tone: "primary",
  doneTitle: "Requisition approved",
  failTitle: "Couldn't approve the requisition",
  allowed: notSwitchedOff("Requisition.approve"),
  run: (item) => api.post.requisitionApprovalAction({ requisition_id: Number(item.ref_id), action: "APPROVE" }),
};

const rejectRequisition: QueueAction = {
  key: "reject",
  label: "Reject",
  tone: "danger",
  input: "note",
  doneTitle: "Requisition rejected",
  failTitle: "Couldn't reject the requisition",
  allowed: notSwitchedOff("Requisition.approve"),
  run: (item, { note }) =>
    api.post.requisitionApprovalAction({ requisition_id: Number(item.ref_id), action: "REJECT", comment: note.trim() }),
};

const reportSelector = (item: QueueItem) => item.selector as unknown as DeptReportSelector;

export const actionsFor = (item: QueueItem, access: QueueAccess): QueueAction[] =>
  allActionsFor(item).filter((action) => !action.allowed || action.allowed(access));

const signOff = (access: QueueAccess) => access.canSignOffDeptReports();

const allActionsFor = (item: QueueItem): QueueAction[] => {
  switch (item.kind) {
    case "requisition":
      return [approveRequisition, rejectRequisition];
    case "dept_report":
      // Approve/return need the report key and period, which only arrive via
      // `selector`; without it the item links to the report instead.
      if (!item.selector) return [];
      return [
        {
          key: "approve",
          label: "Approve",
          tone: "primary",
          doneTitle: "Report approved",
          failTitle: "Couldn't approve the report",
          allowed: signOff,
          run: (it) => api.post.approveDepartmentReport(reportSelector(it)),
        },
        {
          key: "return",
          label: "Return",
          tone: "secondary",
          input: "note",
          doneTitle: "Report returned",
          failTitle: "Couldn't return the report",
          allowed: signOff,
          run: (it, { note }) => api.post.returnDepartmentReport({ ...reportSelector(it), note: note.trim() }),
        },
      ];
    case "appointment":
      return [
        {
          key: "confirm",
          label: "Confirm",
          tone: "primary",
          doneTitle: "Appointment confirmed",
          failTitle: "Couldn't confirm the appointment",
          run: (it) => api.post.appointmentBookingAction(Number(it.ref_id), { action: "accept" }),
        },
        {
          key: "reschedule",
          label: "Reschedule",
          tone: "secondary",
          to: () => PATHS.appointments,
          doneTitle: "",
          failTitle: "",
        },
      ];
    case "join_request":
      return [
        {
          key: "approve",
          label: "Approve",
          tone: "primary",
          doneTitle: "Join request approved",
          failTitle: "Couldn't approve the join request",
          allowed: notSwitchedOff("Membership_Management.decide_join_request"),
          run: (it) => api.put.approveJoinRequest({ id: Number(it.ref_id) }),
        },
        {
          key: "decline",
          label: "Decline",
          tone: "danger",
          input: "note",
          doneTitle: "Join request declined",
          failTitle: "Couldn't decline the join request",
          allowed: notSwitchedOff("Membership_Management.decide_join_request"),
          run: (it, { note }) => api.put.declineJoinRequest({ id: Number(it.ref_id), decline_reason: note.trim() }),
        },
      ];
    case "visitor":
      return [
        {
          key: "assign",
          label: "Assign",
          tone: "primary",
          input: "assignee",
          doneTitle: "Visitor assigned",
          failTitle: "Couldn't assign the visitor",
          allowed: needs("Visitors.assign_responsible"),
          run: async (it, { assignee }) => {
            const res = await api.fetch.fetchVisitorById({ id: String(it.ref_id) });
            const visitor = res.data as unknown as VisitorType;
            const ids = responsibleMemberIds(visitor);
            const next = Number(assignee?.id);
            return setResponsibleMembers(visitor, ids.includes(next) ? ids : [...ids, next]);
          },
        },
      ];
    case "weekly_record":
      return [
        {
          key: "approve",
          label: "Approve",
          tone: "primary",
          doneTitle: "Weekly record approved",
          failTitle: "Couldn't approve the weekly record",
          allowed: needs("Financials.approve"),
          run: (it) => api.post.approveFinancial(String(it.ref_id)),
        },
        {
          key: "return",
          label: "Return",
          tone: "secondary",
          input: "note",
          doneTitle: "Weekly record returned",
          failTitle: "Couldn't return the weekly record",
          allowed: needs("Financials.approve"),
          run: (it, { note }) => api.post.returnFinancial(String(it.ref_id), note.trim()),
        },
      ];
    case "sermon":
      return [
        {
          key: "publish",
          label: "Publish",
          tone: "primary",
          doneTitle: "Sermon published",
          failTitle: "Couldn't publish the sermon",
          allowed: needs("Sermons.publish"),
          run: (it) => api.post.publishSermon(Number(it.ref_id)),
        },
      ];
    case "follow_up":
      return [
        {
          key: "record",
          label: "Record follow-up",
          tone: "primary",
          input: "followup",
          doneTitle: "Follow-up recorded",
          failTitle: "Couldn't record the follow-up",
          allowed: needs("Visitors.record_follow_up"),
          run: (it, { note, followType, userId }) =>
            saveFollowUp(it.ref_id, {
              date: new Date().toISOString().slice(0, 10),
              type: followType,
              assignedTo: userId,
              notes: note.trim(),
              status: COMPLETED_STATUS,
            }, it.follow_up_id ?? undefined),
        },
      ];
  }
};

/** Why an action can't run yet, or null when its inputs are complete. */
export const missingInput = (action: QueueAction, values: ActionValues): string | null => {
  if (action.input === "note" && !values.note.trim()) return "Add a note so the requester knows why.";
  if (action.input === "assignee" && !values.assignee) return "Pick who will follow this visitor up.";
  if (action.input === "followup") {
    if (!values.followType) return "Pick how you followed up.";
    if (!values.note.trim()) return "Add a short note about the follow-up.";
  }
  return null;
};
