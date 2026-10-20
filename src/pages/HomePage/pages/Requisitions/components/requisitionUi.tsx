import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";

import { cn } from "@/utils/cn";

import type { CommDialogButton } from "../../ChurchCommunication/ui/commUi";
import { Pill, type PillTone, TextInput, UiButton } from "../../MembershipManagement/components/membershipUi";
import { type Row, type SimilarGroup, dur, fmtDT, stepDays, waitDays } from "../utils/requisitionModel";

/**
 * Pieces only the Requisition pages need. Generic parts (pills, tabs, inputs,
 * buttons, dialogs, KPI tiles) come from the membership, communication and
 * appointments kits.
 */

type DotState = "done" | "rej" | "cur" | "wait";

const DOT: Record<DotState, string> = {
  done: "border-[#15803D] bg-[#15803D]",
  rej: "border-[#B91C1C] bg-[#B91C1C]",
  cur: "border-[#B45309] bg-white",
  wait: "border-lightGray bg-white",
};

const stateOf = (status: string): DotState =>
  status === "APPROVED" ? "done" : status === "REJECTED" ? "rej" : status === "PENDING" ? "cur" : "wait";

/** Compact left-to-right progress: Submitted → each approval step. */
export const StepperH = ({ row }: { row: Row }) => {
  const items: { label: string; state: DotState }[] = [
    { label: "Submitted", state: row.submitted_at ? "done" : "wait" },
    ...row.steps.map((step) => ({ label: step.label, state: stateOf(step.status) })),
  ];
  return (
    <ol className="flex w-full" aria-label="Approval progress">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center">
            <span className={cn("h-3.5 w-3.5 flex-shrink-0 rounded-full border-2", DOT[item.state])} />
            <span
              className={cn(
                "h-0.5 flex-1",
                index === items.length - 1 ? "bg-transparent" : item.state === "done" ? "bg-[#15803D]" : "bg-lightGray"
              )}
            />
          </div>
          <span
            className={cn(
              "truncate pr-1 text-xs leading-4",
              item.state === "cur" ? "font-semibold" : "font-normal",
              item.state === "wait" ? "text-[#6B7280]" : "text-primary"
            )}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ol>
  );
};

const ICON: Record<DotState, string> = {
  done: "M5 12.5l4.5 4.5L19 7.5",
  rej: "M7 7l10 10M17 7L7 17",
  cur: "M12 7v5l3 2",
  wait: "",
};

const TIMELINE_DOT: Record<DotState, string> = {
  done: "border-[#15803D] bg-[#15803D]",
  rej: "border-[#B91C1C] bg-[#B91C1C]",
  cur: "border-[#B45309] bg-[#B45309]",
  wait: "border-lightGray bg-white",
};

/** Vertical approval progress with who, when, comments and signatures. */
export const ApprovalTimeline = ({ row, me, now, reply }: { row: Row; me: number; now: Date; reply: number }) => {
  const entries = [
    {
      key: "requester",
      label: "Requester",
      who: `${row.requester.name}${row.requester.position ? ` · ${row.requester.position}` : ""}`,
      text: row.submitted_at ? `Signed and submitted ${fmtDT(row.submitted_at)}` : "Not submitted yet",
      textClass: "text-[#4B5563]",
      comment: "",
      sign: "",
      state: (row.submitted_at ? "done" : "wait") as DotState,
    },
    ...row.steps.map((step) => {
      const state = stateOf(step.status);
      const pendingFor = step.status === "PENDING" ? waitDays(row, now) : 0;
      const text =
        step.status === "APPROVED"
          ? `Approved ${fmtDT(step.acted_at)}${step.started_at ? ` · after ${dur(stepDays(step, now) ?? 0)}` : ""}`
          : step.status === "REJECTED"
            ? `Rejected ${fmtDT(step.acted_at)}`
            : step.status === "PENDING"
              ? `Waiting ${dur(pendingFor)} · since ${fmtDT(step.started_at)}`
              : row.status === "REJECTED"
                ? "Not reached"
                : row.status === "DRAFT"
                  ? "After submission"
                  : "Up next";
      return {
        key: `step-${step.order}`,
        label: `Step ${step.order} · ${step.label}`,
        who: `${step.approver.name}${step.approver.id === me ? " (you)" : ""}`,
        text,
        textClass:
          (step.status === "PENDING" && pendingFor > reply) || step.status === "REJECTED"
            ? "text-[#B91C1C]"
            : "text-[#4B5563]",
        comment: step.comment || "",
        sign: step.signature || "",
        state,
      };
    }),
  ];

  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {entries.map((entry, index) => (
        <li key={entry.key} className="flex gap-3">
          <div className="flex flex-shrink-0 flex-col items-center">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 text-white",
                TIMELINE_DOT[entry.state]
              )}
            >
              {ICON[entry.state] && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={ICON[entry.state]} />
                </svg>
              )}
            </span>
            <span
              className={cn(
                "min-h-4 w-0.5 flex-1",
                index === entries.length - 1 ? "bg-transparent" : entry.state === "done" ? "bg-[#15803D]" : "bg-lightGray"
              )}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-4">
            <p className="text-xs text-[#6B7280]">{entry.label}</p>
            <p className="font-semibold text-primary">{entry.who}</p>
            <p className={cn("text-xs", entry.textClass)}>{entry.text}</p>
            {entry.comment && (
              <p className="mt-1 rounded-lg bg-[#F8F9FC] px-3 py-2 text-sm text-[#374151]">“{entry.comment}”</p>
            )}
            {entry.sign && (
              <p className="text-xs text-[#6B7280]">
                Signed: <span className="text-base italic text-primary">{entry.sign}</span>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

/** Blue box listing other recent requests for the same items. */
export const SimilarBox = ({
  groups,
  lookbackDays,
  helper,
  compact,
}: {
  groups: SimilarGroup[];
  lookbackDays: number;
  helper?: string;
  compact?: boolean;
}) => (
  <div className="flex flex-col gap-3 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-4">
    <div className="flex flex-col gap-1">
      <h3 className={cn("font-semibold text-primary", compact ? "text-sm" : "text-base")}>
        Requested in the last {lookbackDays} days
      </h3>
      {helper && <p className="text-sm text-[#374151]">{helper}</p>}
    </div>
    {groups.map((group) => (
      <div key={group.item} className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-primary">{group.item}</p>
        {group.matches.map((match) => (
          <p key={`${group.item}-${match.gid}`} className={cn("text-[#374151]", compact ? "text-xs" : "text-sm")}>
            {match.gid} · {match.who} · {match.date} · qty {match.quantity} · {match.status}
          </p>
        ))}
      </div>
    ))}
  </div>
);

/** Typed-name signature with a live preview. */
export const SignatureField = ({
  value,
  onChange,
  placeholder,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hasError?: boolean;
}) => (
  <div className="flex flex-col gap-2">
    <label htmlFor="rq-sign" className="text-sm text-primary">
      Type your full name to sign
    </label>
    <TextInput
      id="rq-sign"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete="name"
      maxLength={191}
      hasError={hasError}
    />
    <div className="flex min-h-16 items-center rounded-lg border border-lightGray bg-[#F8F9FC] px-4 py-3">
      {value.trim() ? (
        <span className="text-2xl italic leading-8 text-primary">{value}</span>
      ) : (
        <span className="text-sm text-[#6B7280]">Your signature appears here</span>
      )}
    </div>
  </div>
);

/** Bulleted consequences shown at the top of a dialog. */
export const Points = ({ points }: { points: string[] }) => (
  <ul className="m-0 flex flex-col gap-1 pl-[18px] text-sm text-[#374151]">
    {points.map((point) => (
      <li key={point}>{point}</li>
    ))}
  </ul>
);

/** Small 16px section heading inside the drawer. */
export const DrawerSection = ({ title, children, className }: { title: string; children: ReactNode; className?: string }) => (
  <section className={cn("flex flex-col gap-2", className)}>
    <h3 className="text-base font-semibold text-primary">{title}</h3>
    {children}
  </section>
);

/**
 * Right-hand drawer for one requisition (640px; full width on phones). The
 * header carries the status pill, ID and total.
 */
export const RequisitionDrawerShell = ({
  open,
  onClose,
  pill,
  gid,
  title,
  meta,
  amount,
  buttons,
  busy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  pill?: { label: string; tone: PillTone };
  gid?: string;
  title: string;
  meta?: string;
  amount?: string;
  buttons: CommDialogButton[];
  busy?: boolean;
  children: ReactNode;
}) => (
  <Dialog.Root
    open={open}
    onOpenChange={(next) => {
      if (!next && !busy) onClose();
    }}
  >
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[120] bg-primary/45" />
      <Dialog.Content className="fixed inset-y-0 right-0 z-[120] flex h-full w-full flex-col border-l border-lightGray bg-white focus:outline-none sm:w-[min(640px,100%)]">
        <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-5 py-5 sm:px-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {pill && <Pill tone={pill.tone}>{pill.label}</Pill>}
              {gid && <span className="text-xs text-[#6B7280]">{gid}</span>}
            </div>
            <Dialog.Title className="text-xl font-semibold leading-7 text-primary">{title}</Dialog.Title>
            <Dialog.Description className={cn("text-sm text-[#4B5563]", !meta && "sr-only")}>
              {meta || title}
            </Dialog.Description>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="h-9 w-9 flex-shrink-0 rounded-lg text-xl text-[#6B7280] hover:bg-[#F3F4F6]"
            >
              ×
            </button>
            {amount && <span className="whitespace-nowrap text-xl font-semibold leading-7 text-primary">{amount}</span>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-6">{children}</div>
        </div>
        {buttons.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#E5E7EB] px-5 py-4 sm:px-6">
            {buttons.map((button) => (
              <UiButton
                key={button.label}
                tone={button.tone ?? "secondary"}
                onClick={button.onClick}
                disabled={busy || button.disabled}
                className="min-h-11 flex-auto sm:flex-none"
              >
                {button.label}
              </UiButton>
            ))}
          </div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

/**
 * Form/approval dialog. Like CommDialog, plus an optional lead slot in the
 * footer (the running total). Full screen on phones.
 */
export const RequisitionDialog = ({
  open,
  onClose,
  title,
  subtitle,
  busy,
  width = 560,
  errorTitle,
  errors,
  footerLead,
  buttons,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  busy?: boolean;
  width?: number;
  errorTitle?: string;
  errors?: string[];
  footerLead?: ReactNode;
  buttons: (CommDialogButton & { solid?: boolean })[];
  children: ReactNode;
}) => (
  <Dialog.Root
    open={open}
    onOpenChange={(next) => {
      if (!next && !busy) onClose();
    }}
  >
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[130] bg-primary/45" />
      <div className="fixed inset-0 z-[130] flex items-stretch justify-center sm:items-center sm:p-6">
        <Dialog.Content
          style={{ maxWidth: width }}
          className="flex h-full w-full flex-col overflow-hidden bg-white focus:outline-none sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-lightGray"
        >
          <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-6 py-5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Dialog.Title className="text-xl font-semibold leading-7 text-primary">{title}</Dialog.Title>
              <Dialog.Description className={cn("text-sm text-[#4B5563]", !subtitle && "sr-only")}>
                {subtitle || title}
              </Dialog.Description>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="h-9 w-9 flex-shrink-0 rounded-lg text-xl text-[#6B7280] hover:bg-[#F3F4F6]"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-5">
              {errors && errors.length > 0 && (
                <div role="alert" className="flex flex-col gap-1 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm">
                  <p className="font-semibold text-primary">
                    {errorTitle || (errors.length > 1 ? "Fix these before continuing" : "Fix this before continuing")}
                  </p>
                  {errors.map((error) => (
                    <p key={error} className="text-[#B91C1C]">
                      · {error}
                    </p>
                  ))}
                </div>
              )}
              {children}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-[#E5E7EB] px-6 py-4">
            {footerLead && <div className="flex-[1_1_160px] text-base font-semibold text-primary">{footerLead}</div>}
            <div className="flex flex-auto flex-wrap justify-end gap-3">
              {buttons.map((button, index) => (
                <UiButton
                  key={button.label}
                  tone={button.tone ?? "secondary"}
                  onClick={button.onClick}
                  disabled={busy || button.disabled}
                  className={cn(
                    "flex-auto sm:flex-none",
                    index === buttons.length - 1 && buttons.length > 2 && "basis-full sm:basis-auto",
                    button.solid && "border-[#B91C1C] bg-[#B91C1C] text-white hover:bg-[#B91C1C]/90"
                  )}
                >
                  {busy && button.tone === "primary" ? "Working…" : button.label}
                </UiButton>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </div>
    </Dialog.Portal>
  </Dialog.Root>
);
