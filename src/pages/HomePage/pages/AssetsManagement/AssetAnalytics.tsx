import { ReactNode, useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import type { AssetRow } from "@/utils/api/assets/interfaces";

import PageOutline from "../../Components/PageOutline";
import { PageHeading, Pill, type PillTone, SelectInput, TextInput, UiButton } from "../MembershipManagement/components/membershipUi";
import {
  CATEGORIES,
  OUT_OF_USE,
  STATUS,
  STATUS_ORDER,
  addDaysKey,
  categoryLabel,
  dayOf,
  daysSince,
  downloadCsv,
  fmtD,
  fmtS,
  money,
  moneyS,
  pct,
  plural,
  valueOf,
} from "./utils/assetModel";
import { useAssetsData, useToday } from "./utils/useAssetsData";

type By = "all" | "year" | "month" | "week" | "range";
type Bucket = { l: string; a: string; b: string };

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONF = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");
const asDate = (day: string) => new Date(`${day}T00:00:00`);
const spanDays = (a: string, b: string) => (asDate(b).getTime() - asDate(a).getTime()) / 864e5;

const daysB = (a: string, b: string): Bucket[] => {
  const out: Bucket[] = [];
  for (let d = a; d < b; d = addDaysKey(d, 1)) out.push({ l: `${DOW[asDate(d).getDay()]} ${asDate(d).getDate()}`, a: d, b: addDaysKey(d, 1) });
  return out;
};
const weeksB = (a: string, b: string): Bucket[] => {
  const out: Bucket[] = [];
  for (let d = a; d < b; d = addDaysKey(d, 7)) {
    const e = addDaysKey(d, 7) < b ? addDaysKey(d, 7) : b;
    out.push({ l: fmtS(d), a: d, b: e });
  }
  return out;
};
const monthsB = (y: number, a: string, b: string, today: string): Bucket[] => {
  const out: Bucket[] = [];
  for (let m = 0; m < 12; m++) {
    const x = `${y}-${pad(m + 1)}-01`;
    if (x >= b || x > today) break;
    if (x >= `${a.slice(0, 8)}01`) out.push({ l: MON[m], a: x, b: m === 11 ? `${y + 1}-01-01` : `${y}-${pad(m + 2)}-01` });
  }
  return out;
};
const yearsB = (years: number[]): Bucket[] => years.map((y) => ({ l: String(y), a: `${y}-01-01`, b: `${y + 1}-01-01` }));

const Card = ({ title, sub, children, full }: { title: string; sub?: string; children: ReactNode; full?: boolean }) => (
  <section className={`flex min-w-0 flex-col gap-4 rounded-xl border border-lightGray bg-white p-6 ${full ? "col-span-full" : ""}`}>
    <div>
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {sub && <p className="text-sm text-gray-600">{sub}</p>}
    </div>
    {children}
  </section>
);

const HBar = ({ label, value, width, color, sub }: { label: string; value: ReactNode; width: string; color: string; sub: string }) => (
  <div className="flex flex-col gap-1" title={`${label}: ${value} · ${sub}`}>
    <div className="flex justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
      <div className="h-full rounded-r-[4px]" style={{ width, background: color }} />
    </div>
    <span className="text-xs text-gray-500">{sub}</span>
  </div>
);

const AssetAnalytics = () => {
  const today = useToday();
  const { assets, departments, loaded } = useAssetsData();
  const canExport = useAccessControl().hasAction("Asset.export");
  const thisYear = Number(today.slice(0, 4));

  const [by, setBy] = useState<By>("all");
  const [year, setYear] = useState(String(thisYear));
  const [month, setMonth] = useState(today.slice(0, 7));
  const [week, setWeek] = useState("0");
  const [from, setFrom] = useState(`${thisYear}-01-01`);
  const [to, setTo] = useState(today);
  const [cat, setCat] = useState("");
  const [dept, setDept] = useState("");

  const years = useMemo(() => {
    const first = assets.reduce((min, a) => {
      const y = Number(dayOf(a.date_purchased).slice(0, 4));
      return y && y < min ? y : min;
    }, thisYear);
    return Array.from({ length: thisYear - first + 1 }, (_, i) => first + i);
  }, [assets, thisYear]);
  const monthOpts = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    const d = asDate(`${today.slice(0, 7)}-01`);
    for (let i = 0; i < 12; i++) {
      out.push({ value: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: `${MONF[d.getMonth()]} ${d.getFullYear()}` });
      d.setMonth(d.getMonth() - 1);
    }
    return out;
  }, [today]);
  const weekStarts = useMemo(() => {
    const monday = asDate(today);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const start = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
    return Array.from({ length: 8 }, (_, i) => addDaysKey(start, -7 * i));
  }, [today]);

  /* ---------------------------------- period -------------------------------- */

  let start: string;
  let end: string;
  let buckets: Bucket[];
  if (by === "all") {
    start = "1900-01-01";
    end = addDaysKey(today, 1);
    buckets = yearsB(years);
  } else if (by === "year") {
    const y = Number(year);
    start = `${y}-01-01`;
    end = `${y + 1}-01-01`;
    buckets = monthsB(y, start, end, today);
  } else if (by === "month") {
    const [y, m] = month.split("-").map(Number);
    start = `${y}-${pad(m)}-01`;
    end = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
    buckets = weeksB(start, end);
  } else if (by === "week") {
    start = weekStarts[Number(week)] || today;
    end = addDaysKey(start, 7);
    buckets = daysB(start, end);
  } else {
    start = from || `${years[0]}-01-01`;
    end = addDaysKey(to || today, 1);
    const span = spanDays(start, end);
    buckets =
      span <= 14
        ? daysB(start, end)
        : span <= 120
          ? weeksB(start, end)
          : span <= 730
            ? Array.from(new Set([start.slice(0, 4), addDaysKey(end, -1).slice(0, 4)])).flatMap((y) => monthsB(Number(y), start, end, today))
            : yearsB(years.filter((y) => `${y}-12-31` >= start && `${y}-01-01` < end));
  }
  const asAt = end > today ? today : addDaysKey(end, -1);

  const scope = assets.filter((a) => (!cat || a.category === cat) && (!dept || (dept === "_store" ? !a.department : String(a.department?.id) === dept)));
  const bought = (a: AssetRow) => dayOf(a.date_purchased) || dayOf(a.created_at);
  const reg = scope.filter((a) => bought(a) <= asAt);
  const inPeriod = scope.filter((a) => bought(a) >= start && bought(a) < end);
  const outL = reg.filter((a) => OUT_OF_USE.includes(a.status));
  const asg = reg.filter((a) => a.status === "ASSIGNED");
  const ageY = (a: AssetRow) => daysSince(bought(a), asAt) / 365;
  const avgAge = reg.length ? reg.reduce((t, a) => t + ageY(a), 0) / reg.length : 0;

  const bv = buckets.map((b) => {
    const x = scope.filter((a) => bought(a) >= b.a && bought(a) < b.b);
    return { ...b, v: valueOf(x), n: x.length };
  });
  const mx = Math.max(1, ...bv.map((b) => b.v));

  const statusRows = STATUS_ORDER.map((k) => {
    const x = reg.filter((a) => a.status === k);
    return { k, n: x.length, v: valueOf(x), w: reg.length ? (x.length / reg.length) * 100 : 0 };
  });

  const deptRows = [...departments.map((d) => ({ id: String(d.id), l: d.name })), { id: "", l: "In store / not assigned" }]
    .map((d) => {
      const x = reg.filter((a) => (a.department ? String(a.department.id) : "") === d.id);
      return { l: d.l, store: !d.id, v: valueOf(x), n: x.length, o: x.filter((a) => OUT_OF_USE.includes(a.status)).length };
    })
    .filter((d) => d.n)
    .sort((a, b) => b.v - a.v);
  const mxD = Math.max(1, ...deptRows.map((d) => d.v));

  const ages = (
    [
      ["Under 1 year", 0, 1, "rgb(var(--color-green-700))"],
      ["1 to 3 years", 1, 3, "rgb(var(--color-primary))"],
      ["3 to 5 years", 3, 5, "rgb(var(--color-primary))"],
      ["Over 5 years", 5, 999, "rgb(var(--color-amber-700))"],
    ] as [string, number, number, string][]
  ).map(([l, a, b, c]) => {
    const x = reg.filter((z) => ageY(z) >= a && ageY(z) < b);
    return { l, c, n: x.length, v: valueOf(x), o: x.filter((z) => OUT_OF_USE.includes(z.status)).length };
  });
  const mxA = Math.max(1, ...ages.map((g) => g.n));

  const catRows = CATEGORIES.map((c) => {
    const x = reg.filter((a) => a.category === c.key);
    const o = x.filter((a) => OUT_OF_USE.includes(a.status)).length;
    return { l: c.label, n: x.length, v: valueOf(x), r: x.length ? o / x.length : 0, o };
  })
    .filter((c) => c.n)
    .sort((a, b) => b.r - a.r);

  const supMap = new Map<string, { l: string; v: number; n: number; o: number }>();
  reg.forEach((a) => {
    if (!a.supplier) return;
    const x = supMap.get(a.supplier) ?? { l: a.supplier, v: 0, n: 0, o: 0 };
    x.v += a.price;
    x.n += 1;
    if (a.status === "NOT_FIXABLE" || a.status === "OUT_OF_REPAIRS") x.o += 1;
    supMap.set(a.supplier, x);
  });
  const sups = Array.from(supMap.values()).sort((a, b) => b.v - a.v);

  const insights: { p: [string, PillTone]; t: string; s: string }[] = [];
  const old = ages[3];
  if (old.n)
    insights.push({
      p: ["Plan ahead", "warning"],
      t: `${plural(old.n, "asset")} ${old.n === 1 ? "is" : "are"} over 5 years old`,
      s: `Worth ${moneyS(old.v)} when bought. ${old.o} of them ${old.o === 1 ? "is" : "are"} already out of use. Budget for replacing these over the next year or two.`,
    });
  if (catRows[0] && catRows[0].r > 0.1)
    insights.push({
      p: ["Breakdowns", "danger"],
      t: `${catRows[0].l} breaks down the most`,
      s: `${catRows[0].o} of ${catRows[0].n} items (${pct(catRows[0].o, catRows[0].n)}) are needing repair, under repair, beyond repair or lost.`,
    });
  const lost = reg.filter((a) => a.status === "LOST_OR_STOLEN");
  if (lost.length)
    insights.push({
      p: ["Losses", "danger"],
      t: `${moneyS(valueOf(lost))} of assets lost or stolen`,
      s: `${plural(lost.length, "item")}. ${lost.filter((a) => a.category === "media" || a.category === "sound").length} are portable sound or media equipment. A sign-out sheet for events could help.`,
    });
  const idle = reg.filter((a) => a.status === "UNASSIGNED" && daysSince(a.status_since, today) > 90);
  if (idle.length)
    insights.push({
      p: ["Idle", "neutral"],
      t: `${plural(idle.length, "item")} ${idle.length === 1 ? "has" : "have"} sat in the store over 3 months`,
      s: `${moneyS(valueOf(idle))} of equipment no department is using.`,
    });
  const badSup = sups.filter((x) => x.n >= 4).sort((a, b) => b.o / b.n - a.o / a.n)[0];
  if (badSup && badSup.o / badSup.n > 0.2)
    insights.push({
      p: ["Supplier", "info"],
      t: `${badSup.l} items fail more often`,
      s: `${badSup.o} of ${badSup.n} items bought from them are broken or in repair. Compare before the next order.`,
    });
  if (!insights.length) insights.push({ p: ["All good", "success"], t: "Nothing unusual in this selection", s: "Try a wider period or clear the filters." });

  const exportCsv = () => {
    const rows = inPeriod.length ? inPeriod : reg;
    downloadCsv(`asset-analytics-${by === "all" ? "all-time" : `${start}-to-${addDaysKey(end, -1)}`}.csv`, [
      ["Asset ID", "Name", "Category", "Status", "Department", "Date purchased", "Supplier", "Amount (GHS)", "Status since"],
      ...rows.map((a) => [a.code, a.name, categoryLabel(a.category), STATUS[a.status].label, a.department?.name ?? "", dayOf(a.date_purchased), a.supplier ?? "", a.price.toFixed(2), dayOf(a.status_since)]),
    ]);
    notify.success({ title: "CSV downloaded", message: `${plural(rows.length, "asset")}.` });
  };

  const sel = "w-auto";

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Asset analytics"
        subtitle="What the church owns, what it’s worth, and what is ageing or out of use."
        actions={
          <>
            <SelectInput
              aria-label="Period"
              className={sel}
              value={by}
              onChange={(e) => setBy(e.target.value as By)}
              options={[
                { value: "all", label: "All time" },
                { value: "year", label: "Year" },
                { value: "month", label: "Month" },
                { value: "week", label: "Week" },
                { value: "range", label: "Specific dates" },
              ]}
            />
            {by === "year" && (
              <SelectInput aria-label="Year" className={sel} value={year} onChange={(e) => setYear(e.target.value)} options={years.slice().reverse().map((y) => ({ value: String(y), label: String(y) }))} />
            )}
            {by === "month" && <SelectInput aria-label="Month" className={sel} value={month} onChange={(e) => setMonth(e.target.value)} options={monthOpts} />}
            {by === "week" && (
              <SelectInput
                aria-label="Week"
                className={sel}
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                options={weekStarts.map((w, i) => ({ value: String(i), label: i === 0 ? `This week (from ${fmtS(w)})` : `Week of ${fmtS(w)}` }))}
              />
            )}
            {by === "range" && (
              <div className="flex items-center gap-2">
                <TextInput type="date" aria-label="From" className={sel} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
                <span className="text-sm text-gray-500">to</span>
                <TextInput type="date" aria-label="To" className={sel} value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
              </div>
            )}
            <SelectInput
              aria-label="Category"
              className={sel}
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              options={[{ value: "", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]}
            />
            <SelectInput
              aria-label="Department"
              className={sel}
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              options={[{ value: "", label: "All departments" }, { value: "_store", label: "Not assigned" }, ...departments.map((d) => ({ value: String(d.id), label: d.name }))]}
            />
            {canExport && <UiButton onClick={exportCsv}>Export CSV</UiButton>}
          </>
        }
      />
      <p className="text-xs text-gray-500">
        Cumulative: the register counts everything bought up to {fmtD(asAt)}. “Bought” counts purchases inside the period. Status and department are as they stand today.
      </p>

      {!loaded ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
          {[0, 1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
            {[
              { l: "On the register", v: reg.length, s: `${moneyS(valueOf(reg))} purchase value`, c: "rgb(var(--color-gray-500))" },
              { l: "Bought in period", v: inPeriod.length, s: moneyS(valueOf(inPeriod)), c: "rgb(var(--color-gray-500))" },
              { l: "Assigned", v: pct(asg.length, reg.length), s: `${asg.length} in use by departments`, c: "rgb(var(--color-gray-500))" },
              { l: "Out of use", v: outL.length, s: `${moneyS(valueOf(outL))} · ${pct(valueOf(outL), valueOf(reg))} of value`, c: outL.length ? "rgb(var(--color-red-700))" : "rgb(var(--color-gray-500))" },
              { l: "Average age", v: `${avgAge.toFixed(1)} yrs`, s: `${reg.filter((a) => ageY(a) > 5).length} older than 5 years`, c: "rgb(var(--color-gray-500))" },
            ].map((k) => (
              <div key={k.l} className="flex flex-col gap-1 rounded-xl border border-lightGray bg-white px-5 py-4">
                <p className="text-sm text-gray-600">{k.l}</p>
                <p className="text-2xl font-semibold leading-8 text-primary">{k.v}</p>
                <p className="text-xs" style={{ color: k.c }}>
                  {k.s}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
            <Card
              full
              title="Purchases over time"
              sub={`Purchase value by ${by === "all" ? "year" : by === "year" ? "month" : by === "month" ? "week" : by === "week" ? "day" : "period"} (GHS), with number of items.`}
            >
              {bv.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing bought in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex min-w-[480px] flex-col gap-2" role="img" aria-label="Purchase value by period">
                    <div className="flex h-[200px] items-end gap-2 border-b border-gray-200">
                      {bv.map((b) => (
                        <div key={b.a} title={`${b.l}: ${plural(b.n, "item")} bought, ${money(b.v)}`} className="flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end gap-1">
                          <span className="whitespace-nowrap text-xs font-semibold">{b.v ? moneyS(b.v, "") : ""}</span>
                          <div className="w-full max-w-[48px] rounded-t bg-primary transition-opacity hover:opacity-80" style={{ height: `${Math.max(b.v ? 2 : 0, Math.round((b.v / mx) * 170))}px` }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {bv.map((b) => (
                        <div key={b.a} className="flex min-w-0 flex-1 flex-col text-center">
                          <span className="truncate text-xs text-gray-600">{b.l}</span>
                          <span className="text-xs text-gray-500">{b.n ? plural(b.n, "item") : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Status today" sub="Share of assets on the register, by count">
              <div className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-gray-200">
                {statusRows
                  .filter((s) => s.n)
                  .map((s) => (
                    <div key={s.k} title={`${STATUS[s.k].label}: ${s.n}`} style={{ width: `${s.w}%`, background: STATUS[s.k].color }} />
                  ))}
              </div>
              <div className="flex flex-col">
                {statusRows.map((s) => (
                  <div key={s.k} className="flex items-center gap-3 border-b border-gray-200 py-2 text-sm last:border-b-0">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS[s.k].color }} />
                    <span className="flex-1">{STATUS[s.k].label}</span>
                    <span className="text-gray-600">{moneyS(s.v)}</span>
                    <span className="min-w-[40px] text-right font-semibold">{s.n}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Value by department" sub="Purchase value of what each department holds">
              {deptRows.length ? (
                deptRows.map((d) => (
                  <HBar
                    key={d.l}
                    label={d.l}
                    value={moneyS(d.v)}
                    width={`${Math.round((d.v / mxD) * 100)}%`}
                    color={d.store ? "rgb(var(--color-gray-400))" : "rgb(var(--color-primary))"}
                    sub={`${plural(d.n, "item")}${d.o ? ` · ${d.o} out of use` : ""}`}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-500">No assets in this selection.</p>
              )}
            </Card>

            <Card title="How old our assets are" sub="Years since purchase. Older items are worth planning to replace.">
              {ages.map((g) => (
                <HBar key={g.l} label={g.l} value={g.n} width={`${Math.round((g.n / mxA) * 100)}%`} color={g.c} sub={`${moneyS(g.v)}${g.o ? ` · ${g.o} out of use` : ""}`} />
              ))}
            </Card>

            <Card title="By category" sub="How much is out of use in each category">
              <div className="overflow-x-auto rounded-lg border border-lightGray">
                <div className="min-w-[420px] text-sm">
                  <div className="grid grid-cols-[minmax(140px,1.5fr)_60px_minmax(90px,1fr)_100px] gap-3 bg-lightGray px-4 py-3 font-semibold">
                    <span>Category</span>
                    <span>Items</span>
                    <span>Value</span>
                    <span>Out of use</span>
                  </div>
                  {catRows.map((c) => (
                    <div key={c.l} className="grid min-h-[48px] grid-cols-[minmax(140px,1.5fr)_60px_minmax(90px,1fr)_100px] items-center gap-3 border-b border-gray-200 px-4 py-2 last:border-b-0">
                      <span className="font-medium">{c.l}</span>
                      <span>{c.n}</span>
                      <span>{moneyS(c.v)}</span>
                      <div>
                        <Pill tone={c.r > 0.2 ? "danger" : c.r > 0.1 ? "warning" : "success"}>
                          {c.o} · {pct(c.o, c.n)}
                        </Pill>
                      </div>
                    </div>
                  ))}
                  {!catRows.length && <p className="px-4 py-3 text-gray-500">No assets in this selection.</p>}
                </div>
              </div>
            </Card>

            <Card title="Suppliers" sub="Who we buy from, and how their items hold up">
              <div className="flex flex-col">
                {sups.slice(0, 6).map((x) => (
                  <div key={x.l} className="flex items-center gap-3 border-b border-gray-200 py-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{x.l}</p>
                      <p className="text-xs" style={{ color: x.o / x.n > 0.2 ? "rgb(var(--color-amber-700))" : "rgb(var(--color-gray-500))" }}>
                        {plural(x.n, "item")}
                        {x.o ? ` · ${x.o} broken or in repair (${pct(x.o, x.n)})` : " · none broken"}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold">{moneyS(x.v)}</span>
                  </div>
                ))}
                {!sups.length && <p className="text-sm text-gray-500">No suppliers recorded in this selection.</p>}
              </div>
            </Card>

            <Card full title="What stands out">
              <div className="flex flex-col">
                {insights.map((i) => (
                  <div key={i.t} className="flex gap-3 border-b border-gray-200 py-3 last:border-b-0">
                    <Pill tone={i.p[1]} className="self-start">
                      {i.p[0]}
                    </Pill>
                    <div>
                      <p className="text-sm font-semibold">{i.t}</p>
                      <p className="text-sm text-gray-600">{i.s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </PageOutline>
  );
};

export default AssetAnalytics;
