import { InlineAlert, notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { ToggleSwitch } from "@/pages/HomePage/pages/ChurchCommunication/ui/commUi";
import { PageHeading, Pill, UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { plural, summarizeNames } from "@/pages/HomePage/pages/Settings/utils/settingsModel";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { reqNote, stepIsOpen, stepLabel, WF, WorkflowDraft, workflowErrors, WorkflowKey, WORKFLOW_KEYS } from "./approvalsModel";
import { CardState, useApprovals } from "./useApprovals";
import WorkflowDrawer from "./WorkflowDrawer";

const EDIT_DOMAIN: Record<WorkflowKey, string> = { REQ: "Requisition", REP: "Events", FIN: "Financials" };

interface FlowNode {
  label: string;
  value: string;
  bad: boolean;
}

const Arrow = () => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6B7280"
    strokeWidth="2"
    className="flex-shrink-0 rotate-90 tablet:rotate-0"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const Flow = ({ title, nodes }: { title: string; nodes: FlowNode[] }) => (
  <ol
    aria-label={`${title} approval flow`}
    className="m-0 flex list-none flex-col flex-wrap items-stretch gap-2 p-0 tablet:flex-row tablet:items-center"
  >
    {nodes.map((node, i) => (
      <li key={`${node.label}-${i}`} className="flex flex-col items-center gap-2 tablet:flex-row">
        {i > 0 && <Arrow />}
        <div
          className={cn(
            "flex min-w-0 flex-col gap-0.5 self-stretch rounded-lg border px-3 py-2",
            node.bad ? "border-[#FECACA] bg-[#FEF2F2]" : "border-lightGray bg-[#F8F9FC]"
          )}
        >
          <span className="text-xs text-[#6B7280]">{node.label}</span>
          <span className="text-sm font-medium text-primary">{node.value}</span>
        </div>
      </li>
    ))}
  </ol>
);

const CardShell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-4 shadow-[0_8px_24px_rgba(8,13,45,0.08)] tablet:p-6">
    {children}
  </div>
);

const CardTitle = ({ wfKey, pill }: { wfKey: WorkflowKey; pill?: React.ReactNode }) => (
  <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-xl font-semibold leading-7 text-primary">{WF[wfKey].title}</h2>
      {pill}
    </div>
    <p className="text-sm text-[#4B5563]">{WF[wfKey].description}</p>
  </div>
);

const SkeletonCard = () => (
  <CardShell>
    <div className="flex animate-pulse flex-col gap-4" aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-6 w-40 rounded bg-lightGray/60" />
          <div className="h-4 w-3/4 max-w-md rounded bg-lightGray/50" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-lightGray/50" />
      </div>
      <div className="flex flex-col gap-2 tablet:flex-row">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-lightGray/40 tablet:w-40" />
        ))}
      </div>
    </div>
  </CardShell>
);

interface Editor {
  key: WorkflowKey;
  draft: WorkflowDraft;
  /** Opened by switching a workflow on that wasn't ready; saving turns it on. */
  turnOn: boolean;
  /** Opened from switching off a workflow whose stored setup is incomplete. */
  turnOff?: boolean;
}

const ApprovalsPage = () => {
  const { canManage } = useAccessControl();
  const approvals = useApprovals();
  const { cards, retry, save, personName, positionName } = approvals;
  const [editor, setEditor] = useState<Editor | null>(null);
  const [toggling, setToggling] = useState<WorkflowKey | null>(null);
  const [params, setParams] = useSearchParams();

  // `?edit=REQ` (e.g. from General configuration) opens that workflow's editor once it has loaded.
  const editKey = params.get("edit");
  useEffect(() => {
    if (!editKey || !(WORKFLOW_KEYS as string[]).includes(editKey)) return;
    const key = editKey as WorkflowKey;
    const state = cards[key];
    if (state.status === "loading") return;
    if (state.status === "ready" && canManage(EDIT_DOMAIN[key])) {
      setEditor({ key, draft: state.stored.draft, turnOn: !state.stored.exists });
    }
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        copy.delete("edit");
        return copy;
      },
      { replace: true }
    );
  }, [editKey, cards, canManage, setParams]);

  const flowFor = (key: WorkflowKey, d: WorkflowDraft): FlowNode[] => {
    const nodes: FlowNode[] = [];
    if (key === "REQ")
      nodes.push({
        label: "Who can request",
        value: summarizeNames(d.requesters.map(personName)),
        bad: !d.requesters.length,
      });
    if (key === "REP")
      nodes.push({
        label: "Financial report",
        value: stepLabel(d.finance, key, positionName, personName),
        bad: stepIsOpen(d.finance),
      });
    if (key === "FIN")
      nodes.push({
        label: "Finance approver",
        value: d.approver ? personName(d.approver) : "Not chosen",
        bad: !d.approver,
      });
    if (key !== "FIN")
      d.steps.forEach((step, i) =>
        nodes.push({
          label: `Step ${i + 1}`,
          value: stepLabel(step, key, positionName, personName),
          bad: stepIsOpen(step),
        })
      );
    nodes.push({ label: "Then notify", value: summarizeNames(d.notify.map(personName)), bad: false });
    return nodes;
  };

  const toggle = async (key: WorkflowKey, state: Extract<CardState, { status: "ready" }>) => {
    const { exists, draft } = state.stored;
    const next = !draft.active;
    // The API re-checks the whole setup on every save, so an incomplete one
    // has to be finished in the editor before it can be switched either way.
    if ((next && !exists) || workflowErrors(key, draft).length > 0) {
      setEditor({ key, draft, turnOn: next, turnOff: !next });
      return;
    }
    setToggling(key);
    const ok = await save(key, draft, next);
    setToggling(null);
    if (!ok) return;
    notify.success({
      title: `${WF[key].title} approvals ${next ? "turned on" : "turned off"}`,
      message: next ? "New submissions follow these steps." : "Your steps are kept. Turn it back on any time.",
    });
  };

  const saveEditor = async (draft: WorkflowDraft) => {
    if (!editor) return false;
    const { key, turnOn, turnOff } = editor;
    const state = cards[key];
    const stored = state.status === "ready" ? state.stored : null;
    const active = turnOff ? false : turnOn || !stored?.exists ? true : stored.draft.active;
    const clean: WorkflowDraft =
      key === "REQ" ? { ...draft, lookback: String(Number(draft.lookback)), reply: String(Number(draft.reply)) } : draft;
    const ok = await save(key, clean, active);
    if (!ok) return false;
    setEditor(null);
    notify.success({
      title: "Workflow saved",
      message:
        key === "FIN"
          ? `Finance records go to ${clean.approver ? personName(clean.approver) : "no one"}.`
          : `${WF[key].title} approvals now have ${plural(clean.steps.length, "step")}.`,
    });
    return true;
  };

  const renderCard = (key: WorkflowKey) => {
    const state = cards[key];
    if (state.status === "loading") return <SkeletonCard key={key} />;

    if (state.status === "denied" || state.status === "error") {
      return (
        <CardShell key={key}>
          <CardTitle wfKey={key} />
          {state.status === "denied" ? (
            <InlineAlert tone="neutral">You don&apos;t have access to these settings.</InlineAlert>
          ) : (
            <InlineAlert tone="error" title="Couldn't load this workflow" action={{ label: "Try again", onClick: () => retry(key) }}>
              Check your connection and try again.
            </InlineAlert>
          )}
        </CardShell>
      );
    }

    const canEdit = canManage(EDIT_DOMAIN[key]);
    const { draft } = state.stored;
    const on = draft.active;

    return (
      <CardShell key={key}>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <CardTitle wfKey={key} pill={<Pill tone={on ? "success" : "neutral"}>{on ? "On" : "Off"}</Pill>} />
          <div className="flex items-center gap-3">
            <ToggleSwitch
              on={on}
              label={`${WF[key].title} approvals on`}
              disabled={!canEdit || toggling === key}
              onChange={() => void toggle(key, state)}
            />
            {canEdit && (
              <UiButton tone="secondary" onClick={() => setEditor({ key, draft, turnOn: false })}>
                Edit workflow
              </UiButton>
            )}
          </div>
        </div>
        <Flow title={WF[key].title} nodes={flowFor(key, draft)} />
        {key === "REQ" && (
          <p className="border-t border-[#E5E7EB] pt-3 text-xs text-[#4B5563]">{reqNote(draft)}</p>
        )}
      </CardShell>
    );
  };

  return (
    <PageOutline className="flex flex-col gap-4">
      <div className="mb-2">
        <PageHeading
          title="Approvals"
          subtitle="Who signs off before requisitions, event reports and finance records go through."
        />
      </div>
      {WORKFLOW_KEYS.map(renderCard)}
      {editor && (
        <WorkflowDrawer
          key={editor.key}
          wfKey={editor.key}
          initial={editor.draft}
          onClose={() => setEditor(null)}
          onSave={saveEditor}
          activeMembers={approvals.activeMembers}
          financeOptions={approvals.financeOptions}
          positionOptions={approvals.positionOptions}
          personName={personName}
          positionName={positionName}
        />
      )}
    </PageOutline>
  );
};

export default ApprovalsPage;
