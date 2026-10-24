import { useEffect, useState } from "react";

import { Modal } from "@/components/Modal";
import { MemberPicker } from "@/pages/HomePage/pages/AppointmentsManagement/Components/appointmentUi";
import { useActiveMemberOptions } from "@/pages/HomePage/pages/MembershipManagement/components/departments/useActiveMemberOptions";
import {
  Pill,
  SelectInput,
  TextArea,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { FOLLOW_UP_TYPES } from "@/pages/HomePage/pages/VisitorManagement/utils/visitorHelpers";
import type { QueueItem } from "@/utils/api/workspaces/interfaces";
import { cn } from "@/utils/cn";

import {
  actionsFor,
  type ActionValues,
  fullLink,
  KIND_META,
  missingInput,
  type QueueAction,
} from "./queueActions";
import { ghs, nf } from "./wsFormat";

const STEP_MARK = {
  ok: { cls: "border-green-700 bg-green-700 text-white", mark: "✓" },
  cur: { cls: "border-amber-200 bg-amber-50 text-amber-700", mark: "●" },
  wait: { cls: "border-lightGray bg-transparent text-gray-500", mark: "" },
} as const;

const NOTE_ID = "ws-queue-note";
const focusNote = () => document.getElementById(NOTE_ID)?.focus();

const EMPTY: Omit<ActionValues, "userId"> = { note: "", assignee: null, followType: "" };

/**
 * Detail view for one queue item with prev/next, the item's actions and the
 * inputs they need (note, person, follow-up type). After a decision the
 * parent advances to the next item.
 */
export const QueueModal = ({
  item,
  index,
  total,
  busy,
  focusAction,
  onPrev,
  onNext,
  onClose,
  onAction,
  go,
}: {
  item: QueueItem | null;
  index: number;
  total: number;
  busy: boolean;
  focusAction?: string;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onAction: (action: QueueAction, values: Omit<ActionValues, "userId">) => void;
  go: (to: string) => void;
}) => {
  const [values, setValues] = useState(EMPTY);
  const [problem, setProblem] = useState<string | null>(null);
  const memberOptions = useActiveMemberOptions(item?.kind === "visitor");

  useEffect(() => {
    setValues(EMPTY);
    setProblem(null);
  }, [item?.id]);

  useEffect(() => {
    if (!item || !focusAction) return;
    const action = actionsFor(item).find((a) => a.key === focusAction);
    if (action?.input === "note" || action?.input === "followup") {
      window.setTimeout(() => focusNote(), 50);
    }
  }, [item, focusAction]);

  if (!item) return null;
  const actions = actionsFor(item);
  const negative = actions.find((a) => a.input === "note");
  const needsNote = !!negative || actions.some((a) => a.input === "followup");
  const needsPerson = actions.some((a) => a.input === "assignee");
  const needsType = actions.some((a) => a.input === "followup");
  const detail = item.detail;
  const link = fullLink(item);
  const itemsTotal = detail?.items?.reduce((sum, row) => sum + (Number(row.amount) || 0), 0) ?? 0;

  const trigger = (action: QueueAction) => {
    if (action.to) {
      onClose();
      go(action.to(item));
      return;
    }
    const missing = missingInput(action, { ...values, userId: "" });
    if (missing) {
      setProblem(missing);
      if (action.input !== "assignee") focusNote();
      return;
    }
    setProblem(null);
    onAction(action, values);
  };

  return (
    <Modal
      open
      persist={false}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={item.title}
      description={item.sub}
      className="max-w-[672px] overflow-hidden"
    >
      <div className="flex min-h-0 flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold tracking-[0.04em] text-gray-500">
              {KIND_META[item.kind].eyebrow} · {index + 1} of {total}
            </span>
            <h2 className="break-words text-xl font-semibold leading-7 text-primary">{item.title}</h2>
            <p className="text-gray-600">{item.sub}</p>
          </div>
          <div className="flex flex-shrink-0 gap-1">
            {[
              { label: "Previous item", text: "‹", onClick: onPrev, disabled: index <= 0 },
              { label: "Next item", text: "›", onClick: onNext, disabled: index >= total - 1 },
              { label: "Close", text: "✕", onClick: onClose, disabled: busy },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                aria-label={btn.label}
                onClick={btn.onClick}
                disabled={btn.disabled}
                className="h-9 w-9 rounded-[10px] border border-lightGray bg-transparent text-primary disabled:opacity-40"
              >
                {btn.text}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
          {(item.amount !== null && item.amount !== undefined) || item.pill ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {item.amount !== null && item.amount !== undefined ? (
                <span className="text-2xl font-semibold leading-8">{ghs(item.amount)}</span>
              ) : null}
              {item.pill ? <Pill tone={item.pill.tone}>{item.pill.label}</Pill> : null}
            </div>
          ) : null}

          <div className="grid gap-x-4 gap-y-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
            {(detail?.fields?.length ? detail.fields : [["Details", item.sub] as [string, string]]).map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="break-words font-medium">{value}</span>
              </div>
            ))}
          </div>

          {detail?.text ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">{detail.text_label || "Notes"}</span>
              <p className="whitespace-pre-line rounded-lg border border-gray-200 bg-inputBackground px-4 py-3">{detail.text}</p>
            </div>
          ) : null}

          {detail?.items?.length ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">
                {item.kind === "weekly_record" ? "Collections" : item.kind === "dept_report" ? "Figures" : "Items"}
              </span>
              <div className="overflow-hidden rounded-lg border border-lightGray">
                {detail.items.map((row, i) => (
                  <div key={`${row.label}-${i}`} className="flex items-center gap-3 border-b border-gray-200 px-4 py-2.5 last:border-b-0">
                    <span className="min-w-0 flex-1 break-words">{row.label}</span>
                    {row.qty ? <span className="text-xs text-gray-500">× {nf(row.qty)}</span> : null}
                    <span className="whitespace-nowrap">{item.kind === "dept_report" ? nf(row.amount) : ghs(row.amount)}</span>
                  </div>
                ))}
                {item.kind !== "dept_report" && detail.items.length > 1 ? (
                  <div className="flex items-center gap-3 bg-inputBackground px-4 py-2.5 font-semibold">
                    <span className="flex-1">Total</span>
                    <span className="whitespace-nowrap">{ghs(itemsTotal)}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {detail?.steps?.length ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Approval steps</span>
              <div className="flex flex-col">
                {detail.steps.map((step, i) => {
                  const mark = STEP_MARK[step.state] ?? STEP_MARK.wait;
                  return (
                    <div key={`${step.label}-${i}`} className="flex items-center gap-3 py-2">
                      <span className={cn("flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold", mark.cls)}>
                        {mark.mark}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={step.state === "cur" ? "font-semibold" : undefined}>{step.label}</p>
                        <p className="text-xs text-gray-500">{step.who}</p>
                      </div>
                      {step.when ? <span className="whitespace-nowrap text-xs text-gray-500">{step.when}</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {needsPerson ? (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-primary">Responsible person</span>
              <MemberPicker
                options={memberOptions}
                value={values.assignee}
                onChange={(assignee) => setValues((prev) => ({ ...prev, assignee }))}
                hasError={!!problem && !values.assignee}
                placeholder="Search members"
              />
            </div>
          ) : null}

          {needsType ? (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-primary">How you followed up</span>
              <SelectInput
                value={values.followType}
                onChange={(event) => setValues((prev) => ({ ...prev, followType: event.target.value }))}
                options={[{ value: "", label: "Pick one" }, ...FOLLOW_UP_TYPES]}
              />
            </label>
          ) : null}

          {needsNote ? (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-primary">
                {needsType ? "Notes" : "Note"}{" "}
                <span className="text-gray-500">
                  {needsType ? "(what was said)" : `(required to ${negative?.label.toLowerCase() ?? "send back"})`}
                </span>
              </span>
              <TextArea
                id={NOTE_ID}
                rows={2}
                value={values.note}
                onChange={(event) => setValues((prev) => ({ ...prev, note: event.target.value }))}
                placeholder={needsType ? "What did you talk about?" : "Add a note for the requester"}
                hasError={!!problem && !values.note.trim()}
              />
            </label>
          ) : null}

          {problem ? (
            <p role="alert" className="text-sm text-red-700">
              {problem}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 px-5 py-4 sm:px-6">
          <div className="mr-auto flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                go(link.to);
              }}
              className="self-start bg-transparent p-0 text-sm font-medium text-primary underline underline-offset-[3px]"
            >
              {link.label} →
            </button>
            {actions.length > 0 && total > 1 ? (
              <span className="text-xs text-gray-500">Next item opens after you decide</span>
            ) : null}
          </div>
          {actions
            .slice()
            .reverse()
            .map((action) => (
              <UiButton
                key={action.key}
                tone={action.tone}
                disabled={busy}
                onClick={() => trigger(action)}
              >
                {busy && action.run ? "Working…" : action.label}
              </UiButton>
            ))}
        </div>
      </div>
    </Modal>
  );
};
