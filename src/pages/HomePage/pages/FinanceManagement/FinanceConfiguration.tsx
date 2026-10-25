import { useEffect, useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { normalizePermissionPayload, type PermissionMap } from "@/utils/accessControl";
import { cn } from "@/utils/cn";

import PageOutline from "../../Components/PageOutline";
import { MemberPicker } from "../AppointmentsManagement/Components/appointmentUi";
import { errorText } from "../ChurchCommunication/ui/commUtils";
import { Field, PageHeading, PillTabs, TextInput, UiButton } from "../MembershipManagement/components/membershipUi";
import { EmptyNote, Hint, ToneNote } from "./Components/financeUi";
import { AUTO_TAG, asPercent, autoKind, num } from "./utils/financeModel";
import { type ConfigKind, type DraftLine, useApprover, useFinanceConfig, useMemberNames } from "./utils/useFinanceData";

type Tab = ConfigKind | "approval";

const META: Record<Tab, { title: string; sub: string; add: string; label: string }> = {
  receipts: {
    label: "Receipt lines",
    title: "Receipt lines",
    sub: "Each weekly record starts with these receipt lines, in this order.",
    add: "Add receipt line",
  },
  payments: {
    label: "Payment lines",
    title: "Payment lines",
    sub: "Each weekly record starts with these payment lines.",
    add: "Add payment line",
  },
  tithe: {
    label: "Tithe breakdown",
    title: "Tithe breakdown",
    sub: "How the tithe is split between tithe accounts. Must add up to 100%.",
    add: "Add tithe account",
  },
  alloc: {
    label: "Fund allocation",
    title: "Fund allocation (bank accounts)",
    sub: "How each week’s total balance is shared across accounts. Must add up to 100%.",
    add: "Add account",
  },
  approval: { label: "Approval", title: "Approval", sub: "Who approves weekly records, and who hears about it.", add: "" },
};

const HAS_PCT: Record<ConfigKind, boolean> = { receipts: false, payments: false, tithe: true, alloc: true };

type Drafts = Record<ConfigKind, DraftLine[]>;

const FinanceConfiguration = () => {
  const { hasAction, canManage: canManageDomain, accessPermissions } = useAccessControl();
  const { config, approval, loaded, failed, saveLines, saveApproval } = useFinanceConfig();
  const { options: memberOptions, nameOf } = useMemberNames();
  const { myId } = useApprover(approval);

  // Finance configuration moved from Settings to Financials.configure; roles
  // saved before actions existed keep the old rules (Settings for the lines,
  // Financials manage for the tithe rate). Who approves is on-purpose only.
  const legacyRole = normalizePermissionPayload(accessPermissions as PermissionMap).Actions === undefined;
  const canConfigure = hasAction("Financials.configure");
  const canEditLines = canConfigure || (legacyRole && canManageDomain("Settings"));
  const canEditRate = canConfigure || (legacyRole && canManageDomain("Financials"));
  const canEditApproval = hasAction("Financials.configure_approvals");
  const canSaveAny = canEditLines || canEditRate || canEditApproval;

  const [tab, setTab] = useState<Tab>("receipts");
  const canManage = tab === "approval" ? canEditApproval : canEditLines;
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [rate, setRate] = useState<string | null>(null);
  const [approver, setApprover] = useState<string | null>(null);
  const [notifyIds, setNotifyIds] = useState<string[] | null>(null);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  const base = useMemo<Drafts>(
    () => ({
      receipts: config.receipts.map((c) => ({ id: c.id, name: c.name })),
      payments: config.payments.map((c) => ({ id: c.id, name: c.name })),
      tithe: config.tithe.map((c) => ({ id: c.id, name: c.name, percentage: asPercent(c.percentage) })),
      alloc: config.alloc.map((c) => ({ id: c.id, name: c.name, percentage: asPercent(c.percentage) })),
    }),
    [config]
  );

  const d = drafts ?? base;
  const baseApprover = approval?.finance_approver_user_id ? String(approval.finance_approver_user_id) : "";
  const baseNotify = (approval?.notification_user_ids ?? []).map(String);
  const curRate = rate ?? String(config.rate);
  const curApprover = approver ?? baseApprover;
  const curNotify = notifyIds ?? baseNotify;

  const dirtyKinds = (Object.keys(base) as ConfigKind[]).filter((k) => JSON.stringify(d[k]) !== JSON.stringify(base[k]));
  const rateDirty = num(curRate) !== config.rate;
  const approvalDirty = curApprover !== baseApprover || JSON.stringify([...curNotify].sort()) !== JSON.stringify([...baseNotify].sort());
  const dirty = dirtyKinds.length > 0 || rateDirty || approvalDirty;

  // Leaving with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const sumOf = (k: ConfigKind) => Math.round(d[k].reduce((a, x) => a + num(x.percentage), 0) * 100) / 100;

  const setList = (k: ConfigKind, list: DraftLine[]) => setDrafts({ ...d, [k]: list });

  const discard = () => {
    setDrafts(null);
    setRate(null);
    setApprover(null);
    setNotifyIds(null);
    setTried(false);
  };

  const save = async () => {
    if (!dirty) return;
    const unnamed = dirtyKinds.some((k) => d[k].some((x) => !x.name.trim()));
    const off = (["tithe", "alloc"] as ConfigKind[]).filter((k) => dirtyKinds.includes(k) && sumOf(k) !== 100);
    const badRate = rateDirty && (num(curRate) < 0 || num(curRate) > 100 || curRate.trim() === "");
    if (unnamed || off.length || badRate) {
      setTried(true);
      notify.error({
        title: "Can’t save yet",
        message: unnamed
          ? "Some lines have no name."
          : badRate
            ? "The tithe rate must be between 0 and 100%."
            : `${off.includes("tithe") ? "Tithe breakdown" : "Fund allocation"} must add up to 100%.`,
      });
      return;
    }
    setBusy(true);
    try {
      for (const k of dirtyKinds) await saveLines(k, d[k]);
      if (rateDirty || approvalDirty) {
        if (!curApprover) throw new Error("Choose the finance approver in the Approval tab first.");
        await saveApproval({
          finance_approver_user_id: Number(curApprover),
          notification_user_ids: curNotify.map(Number),
          tithe_percentage: num(curRate),
        });
      }
      discard();
      notify.success({ title: "Configuration saved", message: "New weekly records will use these settings." });
    } catch (error) {
      notify.error({ title: "Couldn’t save configuration", message: errorText(error, "Try again.") });
    } finally {
      setBusy(false);
    }
  };

  const tabs = (Object.keys(META) as Tab[]).map((k) => {
    if (k === "approval") return { key: k, label: META[k].label };
    const bad = HAS_PCT[k] && d[k].length > 0 && sumOf(k) !== 100;
    return {
      key: k,
      label: (
        <span className="inline-flex items-center gap-2">
          {META[k].label}
          <span
            className={cn(
              "rounded-full px-2 text-xs font-semibold",
              bad ? "bg-error text-white" : tab === k ? "bg-primary text-white" : "bg-gray-200 text-gray-700"
            )}
          >
            {bad ? "!" : d[k].length}
          </span>
        </span>
      ),
    };
  });

  const m = META[tab];

  const listEditor = (k: ConfigKind) => {
    const hasPct = HAS_PCT[k];
    const list = d[k];
    const total = sumOf(k);
    return (
      <div className="flex flex-col gap-2">
        {list.length === 0 && <EmptyNote>No lines yet.</EmptyNote>}
        {list.map((x, i) => {
          const tag = k === "receipts" ? autoKind(x.name) : null;
          return (
            <div key={x.id ?? `new-${i}`} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-6 flex-shrink-0 text-right text-xs text-gray-500">{i + 1}</span>
                <TextInput
                  value={x.name}
                  disabled={!canManage}
                  aria-label={`${m.title} ${i + 1}`}
                  placeholder="Name"
                  hasError={tried && !x.name.trim()}
                  onChange={(e) => setList(k, list.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))}
                  className="min-w-0 flex-1"
                />
                {hasPct && (
                  <div className="flex items-center gap-1">
                    <TextInput
                      type="number"
                      min={0}
                      max={100}
                      value={x.percentage ?? ""}
                      disabled={!canManage}
                      aria-label={`Percentage for ${x.name || `line ${i + 1}`}`}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => setList(k, list.map((y, j) => (j === i ? { ...y, percentage: e.target.value } : y)))}
                      className="w-20 px-2 text-right"
                    />
                    <span className="text-sm">%</span>
                  </div>
                )}
                {canManage && (
                  <button
                    type="button"
                    aria-label={`Remove ${x.name || `line ${i + 1}`}`}
                    onClick={() => setList(k, list.filter((_, j) => j !== i))}
                    className="h-9 w-9 flex-shrink-0 rounded-lg border border-lightGray bg-white text-lg text-red-700 hover:bg-red-50"
                  >
                    ×
                  </button>
                )}
              </div>
              {tag && (
                <span className="pl-8">
                  <Hint>{AUTO_TAG[tag]}: filled in automatically on each weekly record.</Hint>
                </span>
              )}
            </div>
          );
        })}
        {canManage && (
          <UiButton
            className="self-start border-dashed"
            onClick={() => setList(k, [...list, hasPct ? { name: "", percentage: 0 } : { name: "" }])}
          >
            + {m.add}
          </UiButton>
        )}
        {hasPct && list.length > 0 && (
          <ToneNote tone={total === 100 ? "success" : "danger"} className="font-semibold">
            {total === 100
              ? "Total 100%. Ready to save."
              : `Total ${total}%. ${total < 100 ? `Add ${Math.round((100 - total) * 100) / 100}% more` : `Remove ${Math.round((total - 100) * 100) / 100}%`} to reach 100%.`}
          </ToneNote>
        )}
      </div>
    );
  };

  return (
    <PageOutline>
      <div className="flex flex-col gap-6">
        <PageHeading title="Finance configuration" subtitle="The lines, percentages and approver every weekly record starts from." />
        <PillTabs tabs={tabs} value={tab} onChange={setTab} ariaLabel="Configuration" className="self-start" />

        <section className="flex max-w-[760px] flex-col gap-4 rounded-xl border border-lightGray bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-primary">{m.title}</h2>
            <p className="text-sm text-gray-600">{m.sub}</p>
          </div>

          {!loaded ? (
            failed ? (
              <EmptyNote>Couldn’t load configuration. Refresh to try again.</EmptyNote>
            ) : (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            )
          ) : tab === "approval" ? (
            <div className="flex flex-col gap-4">
              <Field label="Finance approver">
                <MemberPicker
                  options={memberOptions}
                  value={curApprover ? { id: curApprover, name: nameOf(curApprover) } : null}
                  onChange={(v) => {
                    if (!canManage) return;
                    setApprover(v ? v.id : "");
                    if (v) setNotifyIds(curNotify.filter((x) => x !== v.id));
                  }}
                  exclude={curApprover === String(myId) ? [] : [String(myId)]}
                  placeholder="Search for the finance approver"
                />
              </Field>
              <Hint>
                Every submitted record goes to them, except ones they prepared or submitted, which they can’t approve. They need access to
                Financials. You can’t choose yourself.
              </Hint>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-primary">Also notify when a record is approved</span>
                <div className="flex flex-wrap gap-2">
                  {curNotify.map((uid) => (
                    <span
                      key={uid}
                      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary bg-primary px-3 text-sm text-white"
                    >
                      {nameOf(uid)}
                      {canManage && (
                        <button
                          type="button"
                          aria-label={`Stop notifying ${nameOf(uid)}`}
                          onClick={() => setNotifyIds(curNotify.filter((x) => x !== uid))}
                          className="text-base leading-none text-white/80 hover:text-white"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {!curNotify.length && <Hint>No one else is notified.</Hint>}
                </div>
                {canManage && (
                  <MemberPicker
                    options={memberOptions}
                    value={null}
                    exclude={[curApprover, ...curNotify]}
                    onChange={(v) => v && setNotifyIds([...curNotify, v.id])}
                    placeholder="Add someone to notify"
                  />
                )}
              </div>
            </div>
          ) : (
            <>
              {tab === "tithe" && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-inputBackground px-4 py-3">
                  <label htmlFor="fn-rate" className="flex-[1_1_200px] text-sm font-medium">
                    Tithe taken from total receipts
                  </label>
                  <div className="flex items-center gap-2">
                    <TextInput
                      id="fn-rate"
                      type="number"
                      min={0}
                      max={100}
                      value={curRate}
                      disabled={!canEditRate}
                      hasError={tried && rateDirty && (num(curRate) < 0 || num(curRate) > 100)}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => setRate(e.target.value)}
                      className="w-[90px] text-right"
                    />
                    <span className="text-sm">%</span>
                  </div>
                </div>
              )}
              {listEditor(tab)}
            </>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gray-200 pt-4">
            <p className="flex-[1_1_220px] text-xs text-gray-500">
              Changes apply to new weekly records. Existing records keep the lines and percentages they were created with.
            </p>
            {canSaveAny && dirty && (
              <UiButton onClick={discard} disabled={busy}>
                Discard
              </UiButton>
            )}
            {canSaveAny && (
              <UiButton tone="primary" onClick={() => void save()} disabled={!dirty || busy}>
                {busy ? "Saving…" : "Save changes"}
              </UiButton>
            )}
          </div>
        </section>
      </div>
    </PageOutline>
  );
};

export default FinanceConfiguration;
