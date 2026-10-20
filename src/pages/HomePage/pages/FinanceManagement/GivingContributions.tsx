import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { api } from "@/utils/api/apiCalls";
import type { GivingContribution } from "@/utils/api/finance/interface";
import { cn } from "@/utils/cn";

import PageOutline from "../../Components/PageOutline";
import { SideDrawer } from "../AppointmentsManagement/Components/appointmentUi";
import { WIDE_TABLE_MIN, errorText, useViewportWidth } from "../ChurchCommunication/ui/commUtils";
import {
  CellText,
  Field,
  FilterPanel,
  FilterToggleButton,
  GridTable,
  PageHeading,
  Pill,
  PillTabs,
  SearchInput,
  SelectInput,
  TextInput,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import { AttentionList, type AttentionItem, EmptyNote, Kpi, KpiGrid, ToneNote } from "./Components/financeUi";
import {
  amt,
  channelLabel,
  contribPill,
  dayOf,
  daysBetween,
  downloadCsv,
  fmtD,
  fmtTime,
  fromMinor,
  money,
  moneyS,
  plural,
} from "./utils/financeModel";
import { useContributions, useGivingOptions, useToday } from "./utils/useFinanceData";

type Tab = "all" | "success" | "pending" | "failed" | "abandoned";
const PAGE = 30;

const m = (n: number | null | undefined) => fromMinor(n) ?? 0;
const charged = (c: GivingContribution) => c.amount_charged ?? c.amount + c.fee;
const mismatch = (c: GivingContribution) =>
  c.status === "success" && c.amount_paid !== null && Math.abs(c.amount_paid - charged(c)) > 0;
const drift = (c: GivingContribution) => c.fee_actual !== null && Math.abs(c.fee_actual - c.fee) > 0;
const atOf = (c: GivingContribution) => c.paid_at || c.createdAt;

const GivingContributions = () => {
  const [params] = useSearchParams();
  const today = useToday();
  const width = useViewportWidth();
  const wide = width >= WIDE_TABLE_MIN;
  const { canManageCurrentRoute: canManage } = useRouteAccess();
  const { options } = useGivingOptions();

  const initialOpt = params.get("option") ?? "";
  const [opt, setOpt] = useState(initialOpt);
  const [channel, setChannel] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showF, setShowF] = useState(Boolean(initialOpt));
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [limit, setLimit] = useState(PAGE);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const serverFilters = useMemo(() => ({ giving_option_id: opt || undefined, from: from || undefined, to: to || undefined }), [opt, from, to]);
  const { rows, total, loading, error, patch, reload } = useContributions(serverFilters);

  const optName = (id: string, snap?: string) => options.find((o) => o.id === id)?.name ?? snap ?? "—";
  const term = q.trim().toLowerCase();
  const base = useMemo(
    () =>
      rows.filter(
        (c) =>
          (!channel || c.channel === channel) &&
          (!term || `${c.donor_name} ${c.reference} ${c.donor_email}`.toLowerCase().includes(term))
      ),
    [rows, channel, term]
  );
  const list = tab === "all" ? base : base.filter((c) => c.status === tab);
  const ok = base.filter((c) => c.status === "success");
  const lost = base.filter((c) => c.status === "failed" || c.status === "abandoned");
  const stuck = rows.filter((c) => c.status === "pending" && daysBetween(dayOf(c.createdAt), today) > 1);
  const filterCount = [opt, channel, from, to].filter(Boolean).length;

  const resetFilters = () => {
    setOpt("");
    setChannel("");
    setFrom("");
    setTo("");
    setQ("");
    setLimit(PAGE);
  };

  const recheck = async (refs: string[]) => {
    setBusy(true);
    try {
      let changed: GivingContribution[] = [];
      let failed = 0;
      // The server checks up to 50 references per call.
      for (let i = 0; i < refs.length; i += 50) {
        const res = await api.post.recheckContributions(refs.slice(i, i + 50));
        changed = changed.concat(Array.isArray(res?.data) ? res.data : []);
        failed += Number(res?.failed ?? 0);
      }
      patch(changed);
      const settled = changed.filter((c) => c.status === "success").length;
      const message = `${plural(refs.length, "payment")} checked${settled ? `, ${settled} now successful` : ""}.`;
      if (failed)
        notify.warning({ title: "Some payments couldn’t be checked", message: `${message} Paystack didn’t answer for ${failed}. Try those again later.` });
      else notify.success({ title: "Status updated from Paystack", message });
    } catch (e) {
      notify.error({ title: "Couldn’t check with Paystack", message: errorText(e, "Try again in a minute.") });
    } finally {
      setBusy(false);
    }
  };

  const nudge = async (c: GivingContribution) => {
    setBusy(true);
    try {
      await api.post.nudgeContribution(c.reference);
      setDrawer(null);
      notify.success({ title: `Message sent to ${c.donor_name}`, message: "In-app and email, with a link to give again." });
    } catch (e) {
      notify.error({ title: "Couldn’t send the message", message: errorText(e, "Try again.") });
    } finally {
      setBusy(false);
    }
  };

  const attention: AttentionItem[] = [];
  rows.filter(mismatch).forEach((c) =>
    attention.push({
      key: `mm-${c.id}`,
      pill: { label: "Amount differs", tone: "danger" },
      title: `${c.donor_name} · ${c.reference}`,
      text: `Expected ${money(m(charged(c)))} but Paystack collected ${money(m(c.amount_paid))}. Check the transaction before it goes into the weekly record.`,
      actions: [{ label: "View", onClick: () => setDrawer(c.id), primary: true }],
    })
  );
  if (stuck.length)
    attention.push({
      key: "stuck",
      pill: { label: "Stuck", tone: "warning" },
      title: `${plural(stuck.length, "payment has", "payments have")} been pending over a day`,
      text: "Ask Paystack for the latest status so they’re marked successful or failed.",
      actions: canManage
        ? [{ label: busy ? "Checking…" : "Check status now", onClick: () => void recheck(stuck.map((c) => c.reference)), primary: true }]
        : [],
    });
  const drifted = rows.filter(drift);
  if (drifted.length)
    attention.push({
      key: "drift",
      pill: { label: "Fee rate", tone: "info" },
      title: `Paystack charged a different fee on ${plural(drifted.length, "payment")}`,
      text: "The fee added for givers no longer matches Paystack’s actual fee. Update the fee rate so the church isn’t short.",
      actions: [{ label: "View", onClick: () => setDrawer(drifted[0].id) }],
    });

  const exportCsv = () => {
    downloadCsv(`giving-contributions-${today}.csv`, [
      ["Date", "Reference", "Donor", "Email", "Giving option", "Gift (GHS)", "Fee", "Charged", "Paid", "Paystack fee", "Channel", "Status"],
      ...list.map((c) => [
        `${dayOf(atOf(c))} ${fmtTime(atOf(c))}`,
        c.reference,
        c.donor_name,
        c.donor_email,
        optName(c.giving_option_id, c.giving_option_name),
        m(c.amount).toFixed(2),
        m(c.fee).toFixed(2),
        m(charged(c)).toFixed(2),
        c.amount_paid !== null ? m(c.amount_paid).toFixed(2) : "",
        c.fee_actual !== null ? m(c.fee_actual).toFixed(2) : "",
        channelLabel(c.channel),
        contribPill(c.status).label,
      ]),
    ]);
    notify.success({ title: "CSV downloaded", message: `${plural(list.length, "contribution")}.` });
  };

  const statusCell = (c: GivingContribution) => {
    const mm = mismatch(c);
    const pill = mm ? { label: "Check amount", tone: "danger" as const } : contribPill(c.status);
    const sub = mm
      ? `Paystack collected ${money(m(c.amount_paid))}`
      : c.status === "pending"
        ? `Started ${plural(Math.max(0, daysBetween(dayOf(c.createdAt), today)), "day")} ago`
        : c.status === "success"
          ? ""
          : "Nothing collected";
    return { pill, sub, subDanger: mm };
  };

  const drawerRow = drawer ? rows.find((c) => c.id === drawer) ?? null : null;
  const drawerAlert = (() => {
    const c = drawerRow;
    if (!c) return null;
    if (mismatch(c))
      return { tone: "danger" as const, text: `Paystack collected ${money(m(c.amount_paid))} instead of ${money(m(charged(c)))}. Confirm with Paystack before counting this gift.` };
    if (c.status === "pending") return { tone: "warning" as const, text: "Still pending. The giver may not have finished paying." };
    if (c.status === "failed") return { tone: "danger" as const, text: "The payment failed. Nothing was collected." };
    if (c.status === "abandoned") return { tone: "neutral" as const, text: "The giver left before paying. Nothing was collected." };
    if (drift(c))
      return {
        tone: "info" as const,
        text: `Paystack’s actual fee (${money(m(c.fee_actual))}) differs from the fee added for the giver (${money(m(c.fee))}).`,
      };
    return null;
  })();

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "success", label: "Successful" },
    { key: "pending", label: "Pending" },
    { key: "failed", label: "Failed" },
    { key: "abandoned", label: "Abandoned" },
  ];

  return (
    <PageOutline>
      <div className="flex flex-col gap-6">
        <PageHeading
          title="Giving contributions"
          subtitle="Every online gift, whether it went through or not."
          actions={
            <>
              <FilterToggleButton open={showF} count={filterCount} onClick={() => setShowF((v) => !v)} />
              <UiButton onClick={exportCsv} disabled={!list.length}>
                Export CSV
              </UiButton>
            </>
          }
        />

        {showF && (
          <FilterPanel
            title="Refine contributions"
            helper="Filters combine with the search and status tabs."
            onReset={resetFilters}
            resetDisabled={!filterCount && !q}
          >
            <Field label="Giving option">
              <SelectInput
                value={opt}
                onChange={(e) => {
                  setOpt(e.target.value);
                  setLimit(PAGE);
                }}
                options={[{ value: "", label: "All options" }, ...options.map((o) => ({ value: o.id, label: o.name }))]}
              />
            </Field>
            <Field label="Channel">
              <SelectInput
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                options={[
                  { value: "", label: "All channels" },
                  { value: "mobile_money", label: "Mobile money" },
                  { value: "card", label: "Card" },
                  { value: "bank", label: "Bank" },
                ]}
              />
            </Field>
            <Field label="From">
              <TextInput type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <TextInput type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </FilterPanel>
        )}

        <KpiGrid>
          <Kpi
            label="Received"
            value={moneyS(ok.reduce((a, c) => a + m(c.amount), 0))}
            sub={`${plural(ok.length, "successful gift")}${opt ? ` to ${optName(opt)}` : ""}`}
          />
          <Kpi label="Givers" value={new Set(ok.map((c) => c.donor_email || c.donor_name)).size} sub="People who gave successfully" />
          <Kpi
            label="Fees covered by givers"
            value={money(ok.reduce((a, c) => a + m(c.fee), 0))}
            sub="Added on top, so the church gets the full gift"
          />
          <Kpi
            label="Didn’t go through"
            value={lost.length}
            sub={`${moneyS(lost.reduce((a, c) => a + m(c.amount), 0))} failed or abandoned`}
            tone={lost.length ? "warning" : "muted"}
          />
        </KpiGrid>

        <AttentionList items={attention} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PillTabs
              ariaLabel="Payment status"
              value={tab}
              onChange={(k) => {
                setTab(k);
                setLimit(PAGE);
              }}
              tabs={tabs.map((t) => ({
                key: t.key,
                label:
                  t.key === "pending" && stuck.length ? (
                    <span className="inline-flex items-center gap-2">
                      {t.label}
                      <span className="rounded-full bg-[#B91C1C] px-2 text-xs font-semibold text-white">
                        {base.filter((c) => c.status === "pending").length}
                      </span>
                    </span>
                  ) : (
                    t.label
                  ),
                count: t.key === "all" || (t.key === "pending" && stuck.length) ? undefined : base.filter((c) => c.status === t.key).length || undefined,
              }))}
            />
            <SearchInput
              value={q}
              onChange={(v) => {
                setQ(v);
                setLimit(PAGE);
              }}
              placeholder="Search donor or reference"
              ariaLabel="Search contributions"
              className="max-w-[360px]"
            />
          </div>
          <p className="text-sm text-[#4B5563]">
            {plural(list.length, "contribution")} · {money(list.filter((c) => c.status === "success").reduce((a, c) => a + m(c.amount), 0))} received
            {q || filterCount ? " · filtered" : ""}
            {total > rows.length ? ` · latest ${rows.length.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}; narrow the dates to see older gifts` : ""}
          </p>

          {error && !rows.length ? (
            <EmptyNote>
              Couldn’t load contributions.{" "}
              <button type="button" className="underline" onClick={() => void reload()}>
                Try again
              </button>
            </EmptyNote>
          ) : wide ? (
            <GridTable
              rows={list.slice(0, limit)}
              getRowId={(c) => c.id}
              loading={loading}
              minWidth="1000px"
              onRowClick={(c) => setDrawer(c.id)}
              columns={[
                { key: "date", header: "Date", width: "130px", render: (c) => <CellText main={fmtD(atOf(c))} sub={fmtTime(atOf(c))} /> },
                {
                  key: "donor",
                  header: "Donor",
                  width: "minmax(180px,1.4fr)",
                  render: (c) => <CellText strong main={c.donor_name} sub={c.reference} />,
                },
                { key: "opt", header: "Giving option", width: "minmax(130px,1fr)", render: (c) => optName(c.giving_option_id, c.giving_option_name) },
                { key: "gift", header: <span className="block text-right">Gift</span>, width: "110px", render: (c) => <span className="block text-right font-semibold tabular-nums">{money(m(c.amount))}</span> },
                { key: "fee", header: <span className="block text-right">Fee</span>, width: "90px", render: (c) => <span className="block text-right tabular-nums text-[#4B5563]">{amt(m(c.fee))}</span> },
                { key: "charged", header: <span className="block text-right">Charged</span>, width: "110px", render: (c) => <span className="block text-right tabular-nums">{amt(m(charged(c)))}</span> },
                { key: "channel", header: "Channel", width: "110px", render: (c) => <span className="text-[#4B5563]">{channelLabel(c.channel)}</span> },
                {
                  key: "status",
                  header: "Status",
                  width: "minmax(150px,1fr)",
                  render: (c) => {
                    const s = statusCell(c);
                    return (
                      <div className="flex flex-col items-start gap-0.5">
                        <Pill tone={s.pill.tone}>{s.pill.label}</Pill>
                        {s.sub && <span className={cn("text-xs", s.subDanger ? "text-[#B91C1C]" : "text-[#6B7280]")}>{s.sub}</span>}
                      </div>
                    );
                  },
                },
              ]}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {loading && !rows.length &&
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-white" />)}
              {list.slice(0, limit).map((c) => {
                const s = statusCell(c);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setDrawer(c.id)}
                    className="flex flex-col gap-2 rounded-xl border border-lightGray bg-white p-4 text-left text-sm text-primary"
                  >
                    <div className="flex w-full items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{c.donor_name}</p>
                        <p className="text-xs text-[#6B7280]">
                          {fmtD(atOf(c))} · {optName(c.giving_option_id, c.giving_option_name)}
                        </p>
                      </div>
                      <Pill tone={s.pill.tone}>{s.pill.label}</Pill>
                    </div>
                    <div className="flex w-full justify-between gap-2">
                      <span className={cn("text-xs", s.subDanger ? "text-[#B91C1C]" : "text-[#6B7280]")}>{s.sub}</span>
                      <span className="font-semibold">{money(m(c.amount))}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {list.length > limit && (
            <UiButton className="self-center" onClick={() => setLimit(limit + PAGE)}>
              Show {Math.min(PAGE, list.length - limit)} more
            </UiButton>
          )}
          {!loading && !error && !list.length && <EmptyNote>No contributions match.</EmptyNote>}
        </div>
      </div>

      {drawerRow && (
        <SideDrawer
          open
          onClose={() => setDrawer(null)}
          busy={busy}
          pill={mismatch(drawerRow) ? { label: "Check amount", tone: "danger" } : contribPill(drawerRow.status)}
          title={drawerRow.donor_name}
          subtitle={`${optName(drawerRow.giving_option_id, drawerRow.giving_option_name)} · ${fmtD(atOf(drawerRow))} at ${fmtTime(atOf(drawerRow))}`}
          buttons={
            canManage && drawerRow.status === "pending"
              ? [{ label: busy ? "Checking…" : "Check status with Paystack", onClick: () => void recheck([drawerRow.reference]), tone: "primary" }]
              : canManage && (drawerRow.status === "failed" || drawerRow.status === "abandoned") && drawerRow.user_id
                ? [{ label: "Send a “try again” message", onClick: () => void nudge(drawerRow), tone: "primary" }]
                : [{ label: "Close", onClick: () => setDrawer(null) }]
          }
        >
          {drawerAlert && <ToneNote tone={drawerAlert.tone}>{drawerAlert.text}</ToneNote>}
          <div className="overflow-hidden rounded-lg border border-lightGray text-sm">
            {(
              [
                ["Gift (what the church receives)", drawerRow.amount, false],
                ["Fee added for the giver", drawerRow.fee, false],
                ["Charged to the giver", charged(drawerRow), true],
                ["Collected by Paystack", drawerRow.amount_paid, false],
                ["Paystack’s actual fee", drawerRow.fee_actual, false],
              ] as [string, number | null, boolean][]
            ).map(([l, v, strong]) => (
              <div
                key={l}
                className={cn(
                  "flex justify-between gap-3 border-b border-[#E5E7EB] px-4 py-2.5 tabular-nums last:border-b-0",
                  strong ? "bg-[#F8F9FC] font-semibold" : "bg-white"
                )}
              >
                <span>{l}</span>
                <span className={cn(l.startsWith("Collected") && mismatch(drawerRow) && "text-[#B91C1C]")}>
                  {v === null ? "—" : money(m(v))}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-4 text-sm">
            {(
              [
                ["Reference", drawerRow.reference],
                ["Email", drawerRow.donor_email || "—"],
                ["Channel", channelLabel(drawerRow.channel)],
                ["Giving option", optName(drawerRow.giving_option_id, drawerRow.giving_option_name)],
                ["Receipt sent", drawerRow.receipt_sent_at ? fmtD(drawerRow.receipt_sent_at) : "—"],
              ] as [string, string][]
            ).map(([l, v]) => (
              <div key={l} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-[#6B7280]">{l}</span>
                <span className="font-medium [overflow-wrap:anywhere]">{v}</span>
              </div>
            ))}
          </div>
          {(drawerRow.status === "failed" || drawerRow.status === "abandoned") && !drawerRow.user_id && (
            <p className="text-xs text-[#6B7280]">This giver has no member account, so they can’t be messaged from here.</p>
          )}
        </SideDrawer>
      )}
    </PageOutline>
  );
};

export default GivingContributions;
