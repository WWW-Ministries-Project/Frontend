import { DateTime } from "luxon";
import { ApprovalInstance } from "../types/approvalWorkflow";
import {
  getActedByDisplayName,
  getApproverDisplayName,
} from "../utils/requestMetadata";

type RequisitionApprovalTimelineProps = {
  approvalInstances: ApprovalInstance[];
  currentApprovalStep: ApprovalInstance | null;
};

const typeLabelMap: Record<ApprovalInstance["step_type"], string> = {
  HEAD_OF_DEPARTMENT: "Head of Department",
  POSITION: "Position",
  SPECIFIC_PERSON: "Specific Person",
};

const statusBadgeMap: Record<
  ApprovalInstance["status"],
  { label: string; className: string }
> = {
  WAITING: {
    label: "Waiting",
    className: "bg-[#EDEFF5] text-lighterBlack",
  },
  PENDING: {
    label: "Pending",
    className: "bg-[#FFEFD2] text-[#996A13]",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-[#D2F4EA] text-[#039855]",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-[#F9DADA] text-[#D14343]",
  },
};

function RequisitionApprovalTimeline({
  approvalInstances,
  currentApprovalStep,
}: Readonly<RequisitionApprovalTimelineProps>) {
  return (
    <section className="space-y-3 rounded-xl border border-lightGray p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-primary">Approval Timeline</h3>
        <span className="text-xs text-primaryGray">Source: approval_instances</span>
      </div>

      {approvalInstances.length === 0 ? (
        <p className="rounded-lg border border-dashed border-lightGray px-3 py-4 text-center text-sm text-primaryGray">
          No approval steps available.
        </p>
      ) : (
        <div className="space-y-3">
          {approvalInstances.map((step) => {
            const statusMeta = statusBadgeMap[step.status];
            const actedAt = step.acted_at ? DateTime.fromISO(step.acted_at) : null;
            const isCurrent = currentApprovalStep?.id === step.id;
            const approverName = getApproverDisplayName(step);
            const actedByName = getActedByDisplayName(step);

            return (
              <article
                key={step.id}
                className="rounded-lg border border-lightGray bg-white p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">
                    Step {step.step_order}: {typeLabelMap[step.step_type]}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-xs text-primaryGray">
                  <p>Approver: {approverName}</p>
                  {isCurrent && <p className="font-medium text-primary">Current pending step</p>}
                  {actedByName !== "N/A" && <p>Acted By: {actedByName}</p>}
                  {actedAt?.isValid && (
                    <p>Acted At: {actedAt.toFormat("dd LLL yyyy, HH:mm")}</p>
                  )}
                  {step.comment && <p>Comment: {step.comment}</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RequisitionApprovalTimeline;
