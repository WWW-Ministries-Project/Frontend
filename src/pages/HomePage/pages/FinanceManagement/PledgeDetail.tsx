import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import type { PledgePayment, PledgerRow } from "@/utils/api/pledges/interface";
import { cn } from "@/utils/cn";

import PageOutline from "../../Components/PageOutline";
import { confirmAction } from "../../utils/helperFunctions";
import { errorText } from "../ChurchCommunication/ui/commUtils";
import { ActionMenu, Pill, PillTabs, UiButton } from "../MembershipManagement/components/membershipUi";
import { AddPledgersDialog, PledgeFormDialog, RecordPaymentDialog } from "./Components/PledgeDialogs";
import { BackLink, Bar, EmptyNote, Kpi, KpiGrid, ToneNote } from "./Components/financeUi";
import {
  channelLabel,
  contribPill,
  downloadCsv,
  fmtD,
  fmtS,
  fromMinor,
  money,
  num,
  pct,
  plural,
} from "./utils/financeModel";
import { callersText, pledgeState, remindAll } from "./utils/pledgeModel";
import { useToday } from "./utils/useFinanceData";

type Tab = "pledgers" | "payments";

const pledgerName = (p: PledgerRow) => p.user?.name || p.guest_name || "Pledger";

const PledgeDetail = () => {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const today = useToday();
  const { canManageCurrentRoute: canManage } = useRouteAccess();

  const query = useMemo(() => ({ id: String(id) }), [id]);
  const payQuery = useMemo(() => ({ pledge_id: String(id), take: 200 }), [id]);
  const res = useFetch(api.fetch.fetchPledge, query);
  const payRes = useFetch(api.fetch.fetchPledgePayments, payQuery, false, { silent: true });
  const pledge = res.data?.data ?? null;
  const payments = useMemo<PledgePayment[]>(() => (Array.isArray(payRes.data?.data) ? payRes.data.data : []), [payRes.data]);

  const [tab, setTab] = useState<Tab>(params.get("tab") === "payments" ? "payments" : "pledgers");
  const [dialog, setDialog] = useState<
    { kind: "add" } | { kind: "edit" } | { kind: "pay"; pledger: PledgerRow } | null
  >(null);
  const [busyId, setBusyId] = useState<string | number | null>(null);

  // Arriving from "Create pledge" opens Add pledgers straight away.
  useEffect(() => {
    if (pledge && params.get("add") === "1" && canManage) {
      setDialog({ kind: "add" });
      params.delete("add");
      setParams(params, { replace: true });
    }
  }, [pledge, params, setParams, canManage]);

  const reload = async () => {
    await Promise.all([res.refetch(), payRes.refetch()]);
  };

  if (res.loading && !pledge) {
    return (
      <PageOutline>
        <div className="flex flex-col gap-4">
          <div className="h-8 w-72 animate-pulse rounded-lg bg-white" />
          <div className="h-48 animate-pulse rounded-xl bg-white" />
        </div>
      </PageOutline>
    );
  }
  if (!pledge) {
    return (
      <PageOutline>
        <div className="flex flex-col gap-5">
          <BackLink label="Pledges" onClick={() => navigate("/home/finance/pledges")} />
          <EmptyNote>{res.error ? "Couldn’t load this pledge. Refresh to try again." : "Pledge not found."}</EmptyNote>
        </div>
      </PageOutline>
    );
  }

  const pledgers = pledge.pledgers ?? [];
  const withBalance = pledgers.filter((p) => num(p.remaining) > 0.0001);
  const summary = { ...pledge, pledgers_with_balance: withBalance.length };
  const s = pledgeState(summary, today);
  const tot = num(pledge.totalPledged);
  const red = num(pledge.totalRedeemed);
  const rem = Math.max(0, num(pledge.remaining));
  const uncredited = payments.filter((p) => p.status === "success" && !p.redemption_id);
  const title = pledge.title || pledge.event?.event_name || "Pledge";

  const banner = !pledge.can_be_paid_online
    ? { tone: "warning" as const, text: "Online payment isn’t set up for this pledge, so pledgers can only pay in person." }
    : uncredited.length
      ? {
          tone: "danger" as const,
          text: `${plural(uncredited.length, "successful online payment")} ${uncredited.length > 1 ? "haven’t" : "hasn’t"} been credited to the pledger. Open Online payments to credit ${uncredited.length > 1 ? "them" : "it"}.`,
        }
      : null;

  const remindOne = async (p: PledgerRow) => {
    setBusyId(p.id);
    try {
      const r = await api.post.remindPledgers({ pledge_id: pledge.id, pledger_ids: [p.id] });
      if (r?.data?.reminded) {
        notify.success({ title: `Reminder sent to ${pledgerName(p)}`, message: `With their balance of ${money(num(p.remaining))} and a pay link.` });
        await res.refetch();
      } else notify.info({ title: `${pledgerName(p)} can’t be reached from here`, message: "Guests without a member account don’t get app reminders." });
    } catch (e) {
      notify.error({ title: "Couldn’t send the reminder", message: errorText(e, "Try again.") });
    } finally {
      setBusyId(null);
    }
  };

  const credit = async (p: PledgePayment) => {
    setBusyId(p.id);
    try {
      await api.post.creditPledgePayment(p.id);
      await reload();
      notify.success({ title: `${money(fromMinor(p.amount) ?? 0)} credited to ${p.payer_name}` });
    } catch (e) {
      notify.error({ title: "Couldn’t credit the payment", message: errorText(e, "Try again.") });
    } finally {
      setBusyId(null);
    }
  };

  const removePledger = (p: PledgerRow) =>
    confirmAction({
      title: `Remove ${pledgerName(p)}?`,
      points: [
        `Their pledge of ${money(num(p.pledged_amount))} comes off ${title}.`,
        num(p.redeemed) > 0 ? `${money(num(p.redeemed))} already recorded against them is removed too.` : "Nothing has been paid yet.",
      ],
      confirmLabel: "Remove pledger",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deletePledger({ id: p.id });
        await res.refetch();
        notify.success({ title: "Pledger removed", message: pledgerName(p) });
      },
    });

  const deletePledge = () =>
    confirmAction({
      title: `Delete ${title}?`,
      points: [
        `${plural(pledgers.length, "pledger")} and every payment recorded against them are removed.`,
        "A pledge that has taken online payments can’t be deleted.",
      ],
      confirmLabel: "Delete pledge",
      tone: "danger",
      typeToConfirm: pledgers.length > 10 ? title : undefined,
      onConfirm: async () => {
        await api.delete.deletePledge({ id: pledge.id });
        notify.success({ title: "Pledge deleted", message: title });
        navigate("/home/finance/pledges");
      },
    });

  const exportCsv = () => {
    downloadCsv(`${title.toLowerCase().replace(/\s+/g, "-")}.csv`, [
      ["Group", "Pledger", "Phone", "Pledged", "Redeemed", "Remaining"],
      ...pledgers.map((p) => [
        p.group_label ?? "",
        pledgerName(p),
        p.guest_phone ?? "",
        num(p.pledged_amount).toFixed(2),
        num(p.redeemed).toFixed(2),
        Math.max(0, num(p.remaining)).toFixed(2),
      ]),
    ]);
    notify.success({ title: "CSV downloaded" });
  };

  const groups = (pledge.groups ?? []).map((g) => {
    const rows = pledgers.filter((p) => p.group_id === g.id).sort((a, b) => num(b.remaining) - num(a.remaining));
    return {
      g,
      rows,
      paidFull: rows.filter((p) => num(p.remaining) <= 0.0001).length,
      red: rows.reduce((a, p) => a + num(p.redeemed), 0),
      tot: rows.reduce((a, p) => a + num(p.pledged_amount), 0),
    };
  });

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        <BackLink label="Pledges" onClick={() => navigate("/home/finance/pledges")} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-8 text-primary sm:text-2xl">{title}</h1>
              <Pill tone={s.pill.tone}>{s.pill.label}</Pill>
            </div>
            <p className="text-sm text-gray-600">
              {pledge.event?.event_name ?? "No event"}
              {callersText(pledge) ? ` · called by ${callersText(pledge)}` : ""} ·{" "}
              {s.deadline ? `deadline ${fmtD(s.deadline)}` : "no deadline"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <UiButton onClick={exportCsv}>Export CSV</UiButton>
            {canManage && !s.done && withBalance.length > 0 && (
              <UiButton onClick={() => remindAll(summary, () => void res.refetch())}>Remind all with a balance</UiButton>
            )}
            {canManage && (
              <UiButton tone="primary" onClick={() => setDialog({ kind: "add" })} disabled={!pledge.groups?.length}>
                Add pledgers
              </UiButton>
            )}
            {canManage && (
              <ActionMenu
                ariaLabel="More pledge actions"
                items={[
                  { label: "Edit details", onClick: () => setDialog({ kind: "edit" }) },
                  { label: "Delete pledge", onClick: deletePledge, danger: true },
                ]}
              />
            )}
          </div>
        </div>

        <KpiGrid min={180}>
          <Kpi label="Total pledged" value={money(tot)} sub={plural(pledgers.length, "pledger")} />
          <Kpi label="Redeemed" value={money(red)} sub={`${pct(red, tot)} covered`} tone="success" />
          <Kpi
            label="Remaining"
            value={money(rem)}
            sub={`${plural(withBalance.length, "pledger")} still paying`}
            tone={rem ? "warning" : "muted"}
          />
          <Kpi
            label="Target"
            value={pledge.target_amount ? money(num(pledge.target_amount)) : "None"}
            sub={pledge.target_amount ? `${pct(tot, num(pledge.target_amount))} pledged · ${pct(red, num(pledge.target_amount))} received` : undefined}
          />
        </KpiGrid>

        {banner && <ToneNote tone={banner.tone}>{banner.text}</ToneNote>}

        <PillTabs
          ariaLabel="Pledge detail"
          className="self-start"
          value={tab}
          onChange={(k) => setTab(k)}
          tabs={[
            { key: "pledgers", label: "Pledgers", count: pledgers.length },
            {
              key: "payments",
              label: uncredited.length ? (
                <span className="inline-flex items-center gap-2">
                  Online payments
                  <span className="rounded-full bg-error px-2 text-xs font-semibold text-white">{payments.length}</span>
                </span>
              ) : (
                "Online payments"
              ),
              count: uncredited.length ? undefined : payments.length,
            },
          ]}
        />

        {tab === "pledgers" ? (
          <div className="flex flex-col gap-4">
            {!groups.length && <EmptyNote>No groups on this pledge.</EmptyNote>}
            {groups.map(({ g, rows, paidFull, red: gRed, tot: gTot }) => (
              <section key={g.id ?? g.label} className="overflow-hidden rounded-xl border border-lightGray bg-white">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray-200 px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-primary">
                      {g.label ?? "Group"} · called at {money(num(g.called_amount))}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {plural(rows.length, "pledger")} · {paidFull} paid in full
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {money(gRed)} of {money(gTot)}
                  </span>
                </div>
                {!rows.length && <p className="px-5 py-4 text-sm text-gray-500">No pledgers in this group yet.</p>}
                {rows.map((p) => {
                  const r = Math.max(0, num(p.remaining));
                  const last = [...(p.redemptions ?? [])].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
                  const percent = num(p.pledged_amount) ? Math.min(100, Math.round((num(p.redeemed) / num(p.pledged_amount)) * 100)) : 0;
                  return (
                    <div key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 px-5 py-3 last:border-b-0">
                      <div className="min-w-0 flex-[1_1_200px]">
                        <p className="font-semibold text-primary">
                          {pledgerName(p)}
                          {!p.user && <span className="ml-2 text-xs font-normal text-gray-500">guest</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[
                            p.guest_phone,
                            last ? `last paid ${fmtS(last.date)} (${String(last.method).toLowerCase()})` : "nothing paid yet",
                            p.reminded_at ? `reminded ${fmtS(p.reminded_at)}` : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex flex-[1_1_220px] flex-col gap-1">
                        <div className="flex justify-between gap-2 text-sm tabular-nums">
                          <span>
                            {money(num(p.redeemed))} of {money(num(p.pledged_amount))}
                          </span>
                          <span className={cn("font-semibold", r > 0 ? "text-amber-700" : "text-green-700")}>
                            {r > 0 ? `${money(r)} left` : "Paid in full"}
                          </span>
                        </div>
                        <Bar thin percent={percent} tone={r > 0 ? "primary" : "success"} />
                      </div>
                      {canManage && (
                        <div className="flex flex-none items-center gap-2">
                          {r > 0 && (
                            <>
                              <UiButton size="sm" tone="primary" onClick={() => setDialog({ kind: "pay", pledger: p })}>
                                Record payment
                              </UiButton>
                              {p.user && (
                                <UiButton size="sm" disabled={busyId === p.id} onClick={() => void remindOne(p)}>
                                  {busyId === p.id ? "Sending…" : "Remind"}
                                </UiButton>
                              )}
                            </>
                          )}
                          <ActionMenu
                            ariaLabel={`More for ${pledgerName(p)}`}
                            width={200}
                            items={[{ label: "Remove pledger", onClick: () => removePledger(p), danger: true }]}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-600">
              Paystack attempts against this pledge. Successful ones are credited to the pledger automatically.
            </p>
            {payRes.loading && !payments.length && <div className="h-16 animate-pulse rounded-lg bg-white" />}
            {payments.map((p) => {
              const unc = p.status === "success" && !p.redemption_id;
              const pill = contribPill(p.status);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-white px-4 py-3 text-sm",
                    unc ? "border-red-200" : "border-lightGray"
                  )}
                >
                  <div className="min-w-0 flex-[1_1_200px]">
                    <p className="font-semibold">{p.payer_name}</p>
                    <p className="text-xs text-gray-500">
                      {fmtD(p.paid_at || p.createdAt)} · {channelLabel(p.channel)} · {p.reference}
                    </p>
                  </div>
                  <div className="flex-[0_1_220px] tabular-nums">
                    <p className="font-semibold">{money(fromMinor(p.amount) ?? 0)}</p>
                    <p className="text-xs text-gray-500">
                      Charged {money(fromMinor(p.amount_charged ?? p.amount + p.fee) ?? 0)} incl. fee
                    </p>
                  </div>
                  <Pill tone={pill.tone}>{pill.label}</Pill>
                  <span className={cn("flex-[1_1_160px] text-xs", unc ? "text-red-700" : "text-gray-500")}>
                    {p.status !== "success"
                      ? "Nothing collected"
                      : p.redemption_id
                        ? "Credited to the pledger"
                        : "Settled but not credited to the pledger"}
                  </span>
                  {unc && canManage && (
                    <UiButton size="sm" tone="primary" disabled={busyId === p.id} onClick={() => void credit(p)}>
                      {busyId === p.id ? "Crediting…" : "Credit now"}
                    </UiButton>
                  )}
                </div>
              );
            })}
            {!payRes.loading && !payments.length && <EmptyNote>No online payments yet.</EmptyNote>}
          </div>
        )}
      </div>

      {dialog?.kind === "add" && (
        <AddPledgersDialog
          pledge={pledge}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            void res.refetch();
          }}
        />
      )}
      {dialog?.kind === "edit" && (
        <PledgeFormDialog
          pledge={pledge}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            void res.refetch();
          }}
        />
      )}
      {dialog?.kind === "pay" && (
        <RecordPaymentDialog
          pledge={pledge}
          pledger={dialog.pledger}
          name={pledgerName(dialog.pledger)}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            void res.refetch();
          }}
        />
      )}
    </PageOutline>
  );
};

export default PledgeDetail;
