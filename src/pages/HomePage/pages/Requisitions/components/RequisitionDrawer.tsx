import { useCallback, useEffect, useRef, useState } from "react";

import { notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";
import type { RequisitionOverviewDetail } from "@/utils/api/requisitions/interfaces";

import type { CommDialogButton } from "../../ChurchCommunication/ui/commUi";
import { useViewportWidth } from "../../ChurchCommunication/ui/commUtils";
import { TextArea, UiButton } from "../../MembershipManagement/components/membershipUi";
import {
  type Row,
  type SimilarGroup,
  canAct,
  dur,
  fileNameOf,
  firstName,
  fmtD,
  fmtDT,
  fmtDay,
  isSafeUrl,
  money,
  pendingStep,
  pillOf,
  rejectedStep,
  requesterCanEdit,
  similarFromApi,
  titleOf,
  waitDays,
} from "../utils/requisitionModel";
import type { RequisitionsData } from "../utils/useRequisitionsData";
import { ApprovalTimeline, DrawerSection, RequisitionDrawerShell, SimilarBox } from "./requisitionUi";

const TONE_TEXT = {
  neutral: "bg-[#374151]",
  info: "bg-blue-600",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
} as const;

const ALERT = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  success: "border-green-200 bg-green-50 text-green-700",
} as const;


export interface DrawerIntents {
  onEdit: (detail: RequisitionOverviewDetail) => void;
  onSign: (row: Row) => void;
  onApprove: (row: Row, similar: SimilarGroup[]) => void;
  onReject: (row: Row) => void;
  onRevise: (detail: RequisitionOverviewDetail) => void;
  onDelete: (row: Row) => void;
  onRemind: (row: Row) => void;
}

export const RequisitionDrawer = ({
  rowId,
  data,
  version,
  intents,
  onClose,
}: {
  rowId: number | null;
  data: RequisitionsData;
  /** Bumped by the parent after an action so the open drawer reloads. */
  version: number;
  intents: DrawerIntents;
  onClose: () => void;
}) => {
  const phone = useViewportWidth() < 640;
  const { me, now, replyDays, lookbackDays, isManager, loadDetail, comment } = data;
  const [detail, setDetail] = useState<RequisitionOverviewDetail | null>(null);
  const [similar, setSimilar] = useState<SimilarGroup[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  // The id the drawer currently wants; responses for any other id are dropped.
  const wanted = useRef<number | null>(null);

  const load = useCallback(
    async (id: number) => {
      try {
        const next = await loadDetail(id);
        if (wanted.current !== id) return;
        setDetail(next);
        if (next && next.status === "PENDING" && (canAct(next, me) || isManager)) {
          const response = await api.fetch
            .fetchRequisitionPreApprovalSimilarItems({ requisition_id: id })
            .catch(() => null);
          if (wanted.current === id) setSimilar(similarFromApi(response?.data, id));
        } else {
          setSimilar([]);
        }
      } catch (error) {
        if (wanted.current !== id) return;
        notify.fromError(error, { title: "Couldn’t open this requisition" });
        onClose();
      }
    },
    [loadDetail, me, isManager, onClose]
  );

  useEffect(() => {
    wanted.current = rowId;
    if (rowId === null) {
      setDetail(null);
      setDraft("");
      return;
    }
    void load(rowId);
  }, [rowId, version, load]);

  const open = rowId !== null;
  const row = detail && detail.id === rowId ? detail : null;

  if (!open) return null;
  if (!row) {
    return (
      <RequisitionDrawerShell open onClose={onClose} title="Loading requisition…" buttons={[]}>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </RequisitionDrawerShell>
    );
  }

  const mine = row.requester.id === me;
  const act = canAct(row, me);
  const step = pendingStep(row);
  const waited = waitDays(row, now);
  const rejected = rejectedStep(row);

  let alert: { text: string; tone: keyof typeof ALERT } | null = null;
  if (row.status === "DRAFT") alert = { text: "This is a draft. Approvers can’t see it until you sign and submit.", tone: "info" };
  else if (row.status === "REJECTED" && rejected)
    alert = {
      text: `Rejected by ${rejected.approver.name} on ${fmtD(rejected.acted_at)}: “${rejected.comment || "No reason given"}”${
        row.revised_to ? ` Revised as ${row.revised_to.generated_id}.` : ""
      }`,
      tone: "danger",
    };
  else if (act)
    alert = {
      text: `Waiting for your approval${
        waited > replyDays ? ` for ${dur(waited)}, over the ${replyDays}-day reply time` : ""
      }. Check the items and any similar past requests, then approve or reject.`,
      tone: waited > replyDays ? "warning" : "info",
    };
  else if (step && waited > replyDays)
    alert = {
      text: `With ${step.approver.name} for ${dur(waited)}, over the ${replyDays}-day reply time.${
        row.last_reminder_at ? ` Reminder sent ${fmtDT(row.last_reminder_at)}.` : ""
      }`,
      tone: "warning",
    };
  else if (row.status === "APPROVED")
    alert = { text: `Fully approved on ${fmtD(row.decided_at)}. Finance has been notified to release funds.`, tone: "success" };

  const buttons: CommDialogButton[] = [];
  if (mine && row.status === "DRAFT") {
    buttons.push(
      { label: "Delete", tone: "danger", onClick: () => intents.onDelete(row) },
      { label: "Edit", onClick: () => intents.onEdit(row) },
      { label: "Sign and submit", tone: "primary", onClick: () => intents.onSign(row) }
    );
  } else if (requesterCanEdit(row, me)) {
    buttons.push({ label: "Edit", onClick: () => intents.onEdit(row) });
  }
  if (mine && row.status === "REJECTED" && !row.revised_to) {
    buttons.push({ label: "Revise as new draft", tone: "primary", onClick: () => intents.onRevise(row) });
  }
  if (act) {
    buttons.push(
      { label: "Reject", tone: "danger", onClick: () => intents.onReject(row) },
      { label: "Approve", tone: "primary", onClick: () => intents.onApprove(row, similar) }
    );
  }
  if (isManager && step && !act) {
    buttons.push({ label: `Send reminder to ${firstName(step.approver.name)}`, onClick: () => intents.onRemind(row) });
  }
  if (!buttons.length) buttons.push({ label: "Close", onClick: onClose });

  const facts: [string, string][] = [
    ["Department", row.department.name],
    ["Event or programme", row.event?.name || "None"],
    ["Needed by", fmtDay(row.needed_by)],
    ["Submitted", row.submitted_at ? fmtD(row.submitted_at) : "Not yet"],
    ...(row.revised_from ? ([["Revised from", row.revised_from.generated_id]] as [string, string][]) : []),
  ];

  const post = async () => {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    try {
      await comment(row.id, text);
      setDraft("");
      await load(row.id);
    } catch (error) {
      notify.fromError(error, { title: "Couldn’t post your comment" });
    } finally {
      setPosting(false);
    }
  };

  const pill = pillOf(row, me, now, replyDays);

  return (
    <RequisitionDrawerShell
      open
      onClose={onClose}
      pill={pill}
      gid={row.generated_id}
      title={titleOf(row)}
      meta={`Raised by ${row.requester.name} · ${row.department.name}`}
      amount={money(row.total_amount, row.currency)}
      buttons={buttons}
    >
      {alert && (
        <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${ALERT[alert.tone]}`}>
          {alert.text}
        </p>
      )}

      <DrawerSection title="Approval progress" className="gap-3">
        {row.steps.length ? (
          <ApprovalTimeline row={row} me={me} now={now} reply={replyDays} />
        ) : (
          <p className="text-sm text-gray-500">
            {row.status === "DRAFT"
              ? "Approvers are set when you submit, from the approval workflow in settings."
              : "This requisition was approved under the old process, so step details aren’t available."}
          </p>
        )}
      </DrawerSection>

      {similar.length > 0 && (
        <SimilarBox
          groups={similar}
          lookbackDays={lookbackDays}
          helper="Check these before approving, in case the item is already in the store."
        />
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-4">
        {facts.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-sm font-medium text-primary">{value}</span>
          </div>
        ))}
      </div>

      <DrawerSection title="Items">
        <div className="overflow-hidden rounded-lg border border-lightGray text-sm">
          {!phone && (
            <div className="grid grid-cols-[minmax(0,1fr)_56px_110px_120px] gap-3 bg-lightGray px-4 py-3 font-semibold text-primary">
              <span>Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit price</span>
              <span className="text-right">Total</span>
            </div>
          )}
          {row.products.map((item) => (
            <div key={item.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-gray-200 px-4 py-3">
              <span className="min-w-0 flex-[1_1_200px] font-medium text-primary">{item.name}</span>
              <span className="flex-[0_0_56px] text-right text-gray-600">{item.quantity}</span>
              <span className="flex-[0_0_110px] text-right text-gray-600">{money(item.unit_price, row.currency)}</span>
              <span className="ml-auto flex-[0_0_120px] text-right font-semibold text-primary">
                {money(item.quantity * item.unit_price, row.currency)}
              </span>
            </div>
          ))}
          <div className="flex justify-between gap-3 bg-inputBackground px-4 py-3 font-semibold text-primary">
            <span>Total</span>
            <span>{money(row.total_amount, row.currency)}</span>
          </div>
        </div>
      </DrawerSection>

      <DrawerSection title="Why it’s needed" className="gap-1">
        <p className="text-sm text-gray-700">{row.purpose || "No reason given."}</p>
      </DrawerSection>

      <DrawerSection title="Attachments">
        {row.attachments.length ? (
          <div className="flex flex-wrap gap-2">
            {row.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={isSafeUrl(attachment.url) ? attachment.url : undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-lightGray bg-inputBackground px-3 py-1.5 text-sm text-primary hover:no-underline hover:bg-gray-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--color-gray-600))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
                  <path d="M14 3v5h5" />
                </svg>
                <span className="max-w-[220px] truncate">{fileNameOf(attachment.url)}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No quotes or photos attached.</p>
        )}
      </DrawerSection>

      <DrawerSection title="Comments" className="gap-3">
        {row.comments.map((entry) => (
          <div key={entry.id} className="flex flex-col gap-0.5 rounded-lg bg-inputBackground px-4 py-3">
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-primary">{entry.name}</span> · {fmtDT(entry.created_at)}
            </p>
            <p className="text-sm text-gray-700">{entry.comment}</p>
          </div>
        ))}
        {!row.comments.length && <p className="text-sm text-gray-500">No comments yet.</p>}
        <div className="flex items-end gap-2">
          <TextArea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Ask a question or add a note for everyone on this requisition"
            aria-label="Add a comment"
            className="min-w-0 flex-1"
          />
          <UiButton onClick={post} disabled={posting || !draft.trim()}>
            {posting ? "Posting…" : "Post"}
          </UiButton>
        </div>
      </DrawerSection>

      <DrawerSection title="History">
        <ol className="m-0 flex list-none flex-col p-0">
          {row.history.map((entry, index) => (
            <li key={`${entry.at}-${index}`} className="flex gap-3 pb-3">
              <span className={`mt-[5px] h-2.5 w-2.5 flex-shrink-0 rounded-full ${TONE_TEXT[entry.tone]}`} />
              <div>
                <p className="text-sm text-primary">{entry.text}</p>
                <p className="text-xs text-gray-500">{fmtDT(entry.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </DrawerSection>
    </RequisitionDrawerShell>
  );
};
