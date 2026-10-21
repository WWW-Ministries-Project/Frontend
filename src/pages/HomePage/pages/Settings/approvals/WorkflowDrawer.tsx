import type { ApproverType } from "@/pages/HomePage/pages/Requisitions/types/approvalWorkflow";
import { FieldHint } from "@/pages/HomePage/pages/ChurchCommunication/ui/commUi";
import { UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { PeopleChips, Segmented, SettingsDrawer, SubHeading } from "@/pages/HomePage/pages/Settings/Components/settingsUi";
import { cn } from "@/utils/cn";
import { useState } from "react";

import {
  APPROVER_TYPES,
  cloneDraft,
  emptyStep,
  hodNote,
  lookbackOk,
  replyOk,
  StepDraft,
  stepIsOpen,
  WF,
  WorkflowDraft,
  workflowErrors,
  WorkflowKey,
} from "./approvalsModel";
import type { Person } from "./useApprovals";

const selectClass = (bad?: boolean) =>
  cn(
    "h-10 w-full rounded-lg border bg-white px-3 text-sm font-normal text-primary outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,13,45,0.08)]",
    bad ? "border-[#B91C1C]" : "border-[rgba(107,114,128,0.35)]"
  );

const IconButton = ({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={cn(
      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border bg-white disabled:cursor-not-allowed disabled:opacity-40",
      danger
        ? "border-[#FECACA] text-lg text-[#B91C1C] enabled:hover:bg-[#FEF2F2]"
        : "border-lightGray text-base text-primary enabled:hover:bg-[#F3F4F6]"
    )}
  >
    {children}
  </button>
);

/** Keeps a chosen person or position visible even when it is no longer in the option list. */
const withCurrent = (options: Person[], value: number | null, name: (id: number) => string) =>
  value && !options.some((o) => o.id === value) ? [{ id: value, name: name(value) }, ...options] : options;

const ApproverPicker = ({
  step,
  wfKey,
  bad,
  onChange,
  positionOptions,
  personOptions,
  positionName,
  personName,
}: {
  step: StepDraft;
  wfKey: WorkflowKey;
  bad: boolean;
  onChange: (step: StepDraft) => void;
  positionOptions: Person[];
  personOptions: Person[];
  positionName: (id: number) => string;
  personName: (id: number) => string;
}) => {
  const isPos = step.type === "POSITION";
  const options = isPos
    ? withCurrent(positionOptions, step.value, positionName)
    : withCurrent(personOptions, step.value, personName);
  return (
    <>
      <Segmented<ApproverType>
        ariaLabel="Approver type"
        stretch
        options={APPROVER_TYPES}
        value={step.type}
        onChange={(type) => type !== step.type && onChange({ type, value: null })}
      />
      {step.type === "HEAD_OF_DEPARTMENT" ? (
        <p className="text-xs text-[#4B5563]">{hodNote(wfKey)}</p>
      ) : (
        <select
          aria-label={isPos ? "Position" : "Person"}
          aria-invalid={bad || undefined}
          value={step.value ?? ""}
          onChange={(e) => onChange({ ...step, value: Number(e.target.value) || null })}
          className={selectClass(bad)}
        >
          <option value="">{isPos ? "Choose a position…" : "Choose a person…"}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      )}
    </>
  );
};

export interface WorkflowDrawerProps {
  wfKey: WorkflowKey;
  initial: WorkflowDraft;
  onClose: () => void;
  /** Resolves true when saved. */
  onSave: (draft: WorkflowDraft) => Promise<boolean>;
  activeMembers: Person[];
  financeOptions: Person[];
  positionOptions: Person[];
  personName: (id: number) => string;
  positionName: (id: number) => string;
}

const WorkflowDrawer = ({
  wfKey,
  initial,
  onClose,
  onSave,
  activeMembers,
  financeOptions,
  positionOptions,
  personName,
  positionName,
}: WorkflowDrawerProps) => {
  const [draft, setDraft] = useState<WorkflowDraft>(() => cloneDraft(initial));
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = workflowErrors(wfKey, draft);
  const update = (fn: (d: WorkflowDraft) => void) =>
    setDraft((prev) => {
      const next = cloneDraft(prev);
      fn(next);
      return next;
    });

  const isReq = wfKey === "REQ";
  const isRep = wfKey === "REP";
  const isFin = wfKey === "FIN";
  // Finance notifications must also be able to view Financials (the backend checks).
  const notifyPool = isFin ? financeOptions : activeMembers;

  const chips = (ids: number[], pool: Person[]) => ({
    people: ids.map((id) => ({ id, name: personName(id) })),
    options: pool.filter((p) => !ids.includes(p.id)),
  });

  const handleSave = async () => {
    if (errors.length) {
      setTried(true);
      return;
    }
    setSaving(true);
    // On failure the API layer has already raised a toast; the drawer stays open.
    await onSave(draft);
    setSaving(false);
  };

  const pickerProps = {
    wfKey,
    positionOptions,
    personOptions: activeMembers,
    positionName,
    personName,
  };

  const requesters = chips(draft.requesters, activeMembers);
  const notify = chips(draft.notify, notifyPool);

  return (
    <SettingsDrawer
      open
      onClose={onClose}
      width={600}
      busy={saving}
      title={WF[wfKey].title}
      description={WF[wfKey].description}
      header={
        <>
          <span className="text-xs text-[#6B7280]">Edit workflow</span>
          <p className="text-xl font-semibold leading-7 text-primary">{WF[wfKey].title}</p>
          <p className="text-sm text-[#4B5563]">{WF[wfKey].description}</p>
        </>
      }
      footer={
        <>
          <UiButton tone="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </UiButton>
          <UiButton tone="primary" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save workflow"}
          </UiButton>
        </>
      }
    >
      {tried && errors.length > 0 && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
        >
          <p className="font-semibold">Fix these before saving</p>
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      {isReq && (
        <div className="flex flex-col gap-2">
          <SubHeading title="Who can raise requisitions" text="Only these people see the New requisition button." />
          <PeopleChips
            people={requesters.people}
            options={requesters.options}
            addLabel="Add a requester"
            hasError={tried && !draft.requesters.length}
            onAdd={(id) => update((d) => void d.requesters.push(id))}
            onRemove={(id) => update((d) => void (d.requesters = d.requesters.filter((x) => x !== id)))}
          />
        </div>
      )}

      {isFin && (
        <label className="flex flex-col gap-1 text-sm font-medium text-primary">
          Finance approver
          <select
            value={draft.approver ?? ""}
            aria-invalid={(tried && !draft.approver) || undefined}
            onChange={(e) => {
              const id = Number(e.target.value) || null;
              update((d) => void (d.approver = id));
            }}
            className={selectClass(tried && !draft.approver)}
          >
            <option value="">Choose a person…</option>
            {withCurrent(financeOptions, draft.approver, personName).map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <FieldHint>Only people whose role can at least view Financials are listed.</FieldHint>
        </label>
      )}

      {isRep && (
        <div className="flex flex-col gap-2">
          <SubHeading
            title="Financial report approver"
            text="One person signs off the finance section of every event report."
          />
          <div
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-4",
              tried && stepIsOpen(draft.finance) ? "border-[#B91C1C]" : "border-lightGray"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                ₵
              </span>
              <p className="flex-1 text-sm font-medium text-primary">Approves the financial section</p>
            </div>
            <ApproverPicker
              {...pickerProps}
              step={draft.finance}
              bad={tried && stepIsOpen(draft.finance)}
              onChange={(step) => update((d) => void (d.finance = step))}
            />
          </div>
        </div>
      )}

      {!isFin && (
        <div className="flex flex-col gap-2">
          <SubHeading
            title="Approval steps"
            text="Approvers sign off in this order. Each step waits for the one before it."
          />
          {draft.steps.map((step, i) => {
            const n = draft.steps.length;
            const bad = tried && stepIsOpen(step);
            return (
              <div
                key={i}
                className={cn("flex flex-col gap-3 rounded-xl border p-4", bad ? "border-[#B91C1C]" : "border-lightGray")}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm font-medium text-primary">Step {i + 1}</p>
                  {n > 1 && (
                    <>
                      <IconButton
                        label="Move step up"
                        disabled={i === 0}
                        onClick={() => update((d) => void ([d.steps[i - 1], d.steps[i]] = [d.steps[i], d.steps[i - 1]]))}
                      >
                        ↑
                      </IconButton>
                      <IconButton
                        label="Move step down"
                        disabled={i === n - 1}
                        onClick={() => update((d) => void ([d.steps[i + 1], d.steps[i]] = [d.steps[i], d.steps[i + 1]]))}
                      >
                        ↓
                      </IconButton>
                      <IconButton label="Remove step" danger onClick={() => update((d) => void d.steps.splice(i, 1))}>
                        ×
                      </IconButton>
                    </>
                  )}
                </div>
                <ApproverPicker
                  {...pickerProps}
                  step={step}
                  bad={bad}
                  onChange={(next) => update((d) => void (d.steps[i] = next))}
                />
              </div>
            );
          })}
          <UiButton tone="secondary" className="self-start" onClick={() => update((d) => void d.steps.push(emptyStep()))}>
            + Add step
          </UiButton>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <SubHeading title="Notify after the final decision" text="These people hear when it’s approved or declined." />
        <PeopleChips
          people={notify.people}
          options={notify.options}
          addLabel="Add someone to notify"
          onAdd={(id) => update((d) => void d.notify.push(id))}
          onRemove={(id) => update((d) => void (d.notify = d.notify.filter((x) => x !== id)))}
        />
      </div>

      {isReq && (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-primary">Timing</h3>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
            <label className="flex flex-col gap-1 text-sm font-medium text-primary">
              Similar-item lookback (days)
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={draft.lookback}
                aria-invalid={(tried && !lookbackOk(draft)) || undefined}
                onChange={(e) => {
                  const v = e.target.value;
                  update((d) => void (d.lookback = v));
                }}
                className={selectClass(tried && !lookbackOk(draft))}
              />
              <FieldHint>Approvers see matching items requested in this period.</FieldHint>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-primary">
              Reply time (days)
              <input
                type="number"
                min={1}
                max={30}
                step={1}
                inputMode="numeric"
                value={draft.reply}
                aria-invalid={(tried && !replyOk(draft)) || undefined}
                onChange={(e) => {
                  const v = e.target.value;
                  update((d) => void (d.reply = v));
                }}
                className={selectClass(tried && !replyOk(draft))}
              />
              <FieldHint>After this, it’s overdue and the approver gets a daily reminder.</FieldHint>
            </label>
          </div>
        </div>
      )}
    </SettingsDrawer>
  );
};

export default WorkflowDrawer;
