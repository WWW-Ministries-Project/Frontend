import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import type { PledgeListRow } from "@/utils/api/pledges/interface";

import PageOutline from "../../Components/PageOutline";
import { PageHeading, Pill, PillTabs, UiButton } from "../MembershipManagement/components/membershipUi";
import { PledgeFormDialog } from "./Components/PledgeDialogs";
import { AttentionList, type AttentionItem, Bar, EmptyNote, Fact, Kpi, KpiGrid } from "./Components/financeUi";
import { fmtD, fmtS, money, moneyS, num, pct, plural } from "./utils/financeModel";
import { callersText, pledgeState, remindAll } from "./utils/pledgeModel";
import { usePledgeList, useToday } from "./utils/useFinanceData";

type Tab = "active" | "done" | "all";

const Pledges = () => {
  const navigate = useNavigate();
  const today = useToday();
  const { hasAction } = useAccessControl();
  const canCreate = hasAction("Pledges.create");
  const canRemind = hasAction("Pledges.send_reminders");
  const { pledges, loading, error, reload } = usePledgeList();
  const [tab, setTab] = useState<Tab>("active");
  const [creating, setCreating] = useState(false);

  const open = (p: PledgeListRow, sub?: "payments") =>
    navigate(`/home/finance/pledges/${p.id}${sub ? `?tab=${sub}` : ""}`);

  const all = pledges.map((p) => ({ p, s: pledgeState(p, today) }));
  const act = all.filter((x) => !x.s.done);
  const list = tab === "active" ? act : tab === "done" ? all.filter((x) => x.s.done) : all;

  const pledged = act.reduce((a, x) => a + num(x.p.totalPledged), 0);
  const redeemed = act.reduce((a, x) => a + num(x.p.totalRedeemed), 0);
  const withBal = act.reduce((a, x) => a + num(x.p.pledgers_with_balance), 0);

  const attention: AttentionItem[] = [];
  all.forEach(({ p, s }) => {
    if (s.over)
      attention.push({
        key: `o-${p.id}`,
        pill: { label: "Past deadline", tone: "danger" },
        title: `${p.title ?? "Pledge"} ended ${fmtD(s.deadline)}`,
        text: `${money(num(p.remaining))} outstanding${p.pledgers_with_balance ? ` from ${plural(p.pledgers_with_balance, "pledger")}` : ""}.`,
        actions: [
          ...(canRemind ? [{ label: "Remind pledgers", onClick: () => remindAll(p, reload), primary: true }] : []),
          { label: "Open", onClick: () => open(p) },
        ],
      });
    if (p.uncredited_payments)
      attention.push({
        key: `u-${p.id}`,
        pill: { label: "Not credited", tone: "warning" },
        title: `${plural(p.uncredited_payments, "online payment")} to ${p.title ?? "a pledge"} not credited`,
        text: "Paystack settled the money, but it wasn’t recorded against the pledger.",
        actions: [{ label: "Review", onClick: () => open(p, "payments"), primary: true }],
      });
  });

  return (
    <PageOutline>
      <div className="flex flex-col gap-6">
        <PageHeading
          title="Pledges"
          subtitle="Pledge campaigns, who has paid, and what is still outstanding."
          actions={
            canCreate && (
              <UiButton tone="primary" onClick={() => setCreating(true)}>
                Create pledge
              </UiButton>
            )
          }
        />

        <KpiGrid>
          <Kpi label="Pledged (in progress)" value={moneyS(pledged)} sub={plural(act.length, "campaign")} />
          <Kpi label="Redeemed" value={moneyS(redeemed)} sub={`${pct(redeemed, pledged)} of what was pledged`} />
          <Kpi
            label="Outstanding"
            value={moneyS(Math.max(0, pledged - redeemed))}
            sub="Still to be paid"
            tone={pledged - redeemed > 0 ? "warning" : "muted"}
          />
          <Kpi label="Pledgers with a balance" value={withBal} sub="Across campaigns in progress" />
        </KpiGrid>

        <AttentionList items={attention} />

        <PillTabs
          ariaLabel="Pledge status"
          className="self-start"
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "active", label: "In progress", count: act.length || undefined },
            { key: "done", label: "Completed", count: all.length - act.length || undefined },
            { key: "all", label: "All" },
          ]}
        />

        {error && !pledges.length && <EmptyNote>Couldn’t load pledges. Refresh to try again.</EmptyNote>}
        {loading && !pledges.length && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-60 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        )}
        {!loading && !error && !list.length && (
          <EmptyNote>{tab === "done" ? "No completed pledges yet." : "No pledges in progress."}</EmptyNote>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-4">
          {list.map(({ p, s }) => {
            const percent = Math.min(100, num(p.percent));
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => open(p)}
                className="flex flex-col gap-3 rounded-2xl border border-lightGray bg-white p-5 text-left text-sm text-primary transition-shadow hover:shadow-[0_10px_28px_rgb(var(--color-shadow)_/_0.2)]"
              >
                <div className="flex w-full items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-semibold leading-7">{p.title || p.event?.event_name || "Pledge"}</p>
                    <p className="text-gray-600">
                      {p.event?.event_name ?? "No event"}
                      {callersText(p) ? ` · called by ${callersText(p)}` : ""}
                    </p>
                  </div>
                  <Pill tone={s.pill.tone}>{s.pill.label}</Pill>
                </div>
                <div className="flex w-full flex-col gap-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{money(num(p.totalRedeemed))} redeemed</span>
                    <span className="text-gray-600">{percent}%</span>
                  </div>
                  <Bar percent={percent} tone={s.done ? "success" : s.over ? "danger" : "primary"} />
                  <span className="text-xs text-gray-500">
                    of {money(num(p.totalPledged))} pledged
                    {p.target_amount ? ` · target ${moneyS(num(p.target_amount))}` : ""}
                  </span>
                </div>
                <div className="grid w-full grid-cols-3 gap-2 border-t border-gray-200 pt-3">
                  <Fact label="Outstanding" value={moneyS(Math.max(0, num(p.remaining)))} />
                  <Fact label="Pledgers" value={p.pledger_count ?? "—"} />
                  <Fact
                    label="Deadline"
                    value={s.deadline ? `${fmtS(s.deadline)}, ${s.deadline.slice(0, 4)}` : "None"}
                    valueClass={s.over ? "text-red-700" : undefined}
                  />
                </div>
                <span className={p.can_be_paid_online ? "text-xs text-green-700" : "text-xs text-amber-700"}>
                  {p.can_be_paid_online
                    ? `Members can pay online · ${p.bank_name ?? ""} ${p.masked_account_number ?? ""}`.trim()
                    : "Online payment not set up"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {creating && (
        <PledgeFormDialog
          onClose={() => setCreating(false)}
          onSaved={(id) => {
            setCreating(false);
            void reload();
            if (id) navigate(`/home/finance/pledges/${id}?add=1`);
          }}
        />
      )}
    </PageOutline>
  );
};

export default Pledges;
