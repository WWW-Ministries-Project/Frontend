import { FinanceApprovalStatus } from "@/utils/api/finance/interface";

const STATUS_STYLES: Record<FinanceApprovalStatus, string> = {
  DRAFT: "border border-slate-200 bg-slate-100 text-slate-700",
  PENDING_APPROVAL: "border border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border border-emerald-200 bg-emerald-50 text-emerald-700",
};

const STATUS_LABELS: Record<FinanceApprovalStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
};

export const FinanceStatusBadge = ({
  status,
}: {
  status?: FinanceApprovalStatus | null;
}) => {
  const resolvedStatus = status || "DRAFT";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[resolvedStatus]}`}
    >
      {STATUS_LABELS[resolvedStatus]}
    </span>
  );
};
