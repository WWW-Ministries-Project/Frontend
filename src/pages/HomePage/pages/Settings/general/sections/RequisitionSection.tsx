import { useNavigate } from "react-router-dom";

import { InlineAlert } from "@/components/feedback";
import { Pill, UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { plural } from "@/pages/HomePage/pages/Settings/utils/settingsModel";
import { cn } from "@/utils/cn";

import { MAX_REPLY_DAYS } from "../../approvals/approvalsModel";
import { isWholePositive, type ReqDraft, selectClass } from "../generalModel";
import { Card, LoadFailed, RowsSkeleton, SectionTitle } from "../generalUi";
import type { RulesDraft } from "../useRulesDraft";

const WORKFLOW_PATH = "/home/settings/approvals?edit=REQ";

const ROWS: { key: keyof ReqDraft; label: string; description: string; max?: number }[] = [
  {
    key: "lookback",
    label: "Similar-item lookback (days)",
    description: "Approvers see matching items requested in this period.",
  },
  {
    key: "reply",
    label: "Reply time (days)",
    description: "After this, it’s overdue and the approver gets a daily reminder.",
    max: MAX_REPLY_DAYS,
  },
];

/**
 * Requisition timing, edited with the rest of the page's rules. Who can request
 * and who approves are edited in Approvals; this links straight to that editor.
 */
export const RequisitionSection = ({ rules, canEdit }: { rules: RulesDraft; canEdit: boolean }) => {
  const navigate = useNavigate();
  const req = rules.value("req");
  const stored = rules.reqStored;
  const ready = !!stored?.exists;
  const editable = canEdit && ready;

  return (
    <>
      <SectionTitle
        title="Requisition"
        text="How long approvers have to reply and how far back they see similar requests. Who can request and who approves are set in the requisition workflow."
        action={
          canEdit && ready ? (
            <UiButton tone="secondary" onClick={() => navigate(WORKFLOW_PATH)}>
              Edit requisition workflow
            </UiButton>
          ) : undefined
        }
      />
      {rules.status.req === "error" ? (
        <LoadFailed what="requisition settings" onRetry={() => void rules.load("req")} />
      ) : !req || rules.status.req === "loading" ? (
        <RowsSkeleton rows={2} />
      ) : (
        <>
          {!ready && (
            <InlineAlert
              tone="warning"
              title="Requisition approvals aren’t set up yet"
              action={canEdit ? { label: "Set up workflow", onClick: () => navigate(WORKFLOW_PATH) } : undefined}
            >
              Choose who can raise requisitions and who approves them first. Then you can change the timing here.
            </InlineAlert>
          )}
          <Card>
            {ROWS.map((row) => {
              const value = req[row.key];
              const valid = isWholePositive(value) && (!row.max || Number(value) <= row.max);
              return (
                <div key={row.key} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#E5E7EB] p-4">
                  <div className="flex min-w-0 flex-[1_1_220px] flex-col">
                    <span className="text-sm font-medium text-primary">{row.label}</span>
                    <span className="text-xs text-[#6B7280]">{row.description}</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={row.max}
                    step={1}
                    inputMode="numeric"
                    value={value}
                    disabled={!editable}
                    aria-label={row.label}
                    aria-invalid={!valid}
                    onChange={(event) => {
                      const next = event.target.value;
                      rules.set("req", (draft) => ({ ...draft, [row.key]: next }));
                    }}
                    className={cn(selectClass, "w-24", !valid && "border-[#B91C1C] focus:border-[#B91C1C]")}
                  />
                </div>
              );
            })}
            {stored && ready && (
              <div className="flex flex-wrap items-center gap-2 bg-[#F8F9FC] px-4 py-3 text-xs text-[#4B5563]">
                <Pill tone={stored.draft.active ? "success" : "neutral"}>
                  {stored.draft.active ? "Approvals on" : "Approvals off"}
                </Pill>
                <span>
                  {plural(stored.draft.requesters.length, "person", "people")} can request ·{" "}
                  {plural(stored.draft.steps.length, "approval step")}
                </span>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
};
