import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { describeError, notify } from "@/components/feedback";

import PageOutline from "../../Components/PageOutline";
import { ListEmpty } from "../ChurchCommunication/ui/commUi";
import { WIDE_TABLE_MIN, useViewportWidth } from "../ChurchCommunication/ui/commUtils";
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
import { BookDialog, CancelDialog, DeclineDialog, SuggestTimeDialog } from "./Components/AppointmentDialogs";
import { AppointmentDrawer, type DrawerDialog } from "./Components/AppointmentDrawer";
import { KpiButton } from "./Components/appointmentUi";
import {
  type ApptBooking,
  CLOSED_STATUSES,
  STATUS_META,
  SUB_TONE_CLASS,
  addDays,
  ago,
  awayOn,
  dayLabel,
  downloadCsv,
  dur,
  firstName,
  fmtD,
  groupByDay,
  hrs,
  iso,
  isOverdue,
  median,
  needsOutcome,
  pc,
  pillOf,
  plural,
  slotOf,
  statusSub,
  t12,
} from "./utils/appointmentModel";
import { useAppointmentsData } from "./utils/useAppointmentsData";

type Tab = "pending" | "requester" | "upcoming" | "outcome" | "past" | "all";

const TABS: { key: Tab; label: string; counted: boolean }[] = [
  { key: "pending", label: "Awaiting reply", counted: true },
  { key: "requester", label: "Waiting on requester", counted: true },
  { key: "upcoming", label: "Upcoming", counted: true },
  { key: "outcome", label: "Needs outcome", counted: true },
  { key: "past", label: "Past", counted: false },
  { key: "all", label: "All", counted: false },
];

const EMPTY: Record<Tab, string> = {
  pending: "Every request has been answered.",
  requester: "No suggested times are waiting on requesters.",
  upcoming: "No confirmed appointments coming up.",
  outcome: "Every past appointment has an outcome.",
  past: "No past appointments match.",
  all: "No appointments match.",
};

const PAGE_LIMIT = 60;
const NO_FILTERS = { att: "", reason: "", from: "", to: "" };

const AppointmentManager = () => {
  const navigate = useNavigate();
  const data = useAppointmentsData();
  const { bookings, now, settings, isAdmin, personOf } = data;
  const sla = settings.replyDeadlineHours;
  const wide = useViewportWidth() >= WIDE_TABLE_MIN;

  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [drawer, setDrawer] = useState<{ id: string; reassign: boolean } | null>(null);
  const [dialog, setDialog] = useState<{ kind: DrawerDialog | "book"; id?: string } | null>(null);

  const byId = (id?: string) => bookings.find((b) => b.id === id);
  const openDrawer = (booking: ApptBooking, reassign = false) => setDrawer({ id: booking.id, reassign });

  /* ------------------------------ filtering ------------------------------ */

  const reasonOptions = useMemo(
    () => Array.from(new Set(bookings.map((b) => b.reason))).sort((a, b) => a.localeCompare(b)),
    [bookings]
  );

  const base = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter(
      (b) =>
        (!filters.att || b.attendeeId === filters.att) &&
        (!filters.reason || b.reason === filters.reason) &&
        (!filters.from || b.date >= filters.from) &&
        (!filters.to || b.date <= filters.to) &&
        (!q || b.requester.toLowerCase().includes(q) || b.reason.toLowerCase().includes(q))
    );
  }, [bookings, filters, query]);

  const byTab = useMemo<Record<Tab, ApptBooking[]>>(
    () => ({
      pending: base.filter((b) => b.status === "PENDING"),
      requester: base.filter((b) => b.status === "RESCHEDULED"),
      upcoming: base.filter((b) => b.status === "CONFIRMED" && !needsOutcome(b, now)),
      outcome: base.filter((b) => needsOutcome(b, now)),
      past: base.filter((b) => CLOSED_STATUSES.includes(b.status)),
      all: base,
    }),
    [base, now]
  );

  const list = byTab[tab];
  const desc = tab === "past" || tab === "all" || tab === "outcome";
  const shown = desc
    ? list
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, PAGE_LIMIT)
    : list;
  const groups = groupByDay(shown, desc);

  /* --------------------------------- KPIs -------------------------------- */

  const today = iso(now);
  const overdue = bookings.filter((b) => isOverdue(b, sla, now) && !awayOn(personOf(b), b.date));
  const onLeave = bookings.filter((b) => b.status === "PENDING" && awayOn(personOf(b), b.date));
  const outcomeDue = bookings.filter((b) => needsOutcome(b, now));
  const stale = bookings.filter((b) => b.status === "RESCHEDULED" && b.respondedAt && hrs(b.respondedAt, now) > 48);
  const pending = bookings.filter((b) => b.status === "PENDING");
  const todays = bookings.filter((b) => b.status === "CONFIRMED" && b.date === today);
  const next = todays
    .filter((b) => !needsOutcome(b, now))
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const week = bookings.filter((b) => b.status === "CONFIRMED" && b.date >= today && b.date <= addDays(today, 6));
  const monthAgo = new Date(now.getTime() - 30 * 864e5).toISOString();
  const replies = bookings
    .filter((b) => b.respondedAt && b.createdAt && b.createdAt >= monthAgo)
    .map((b) => hrs(b.createdAt, b.respondedAt as string));
  const within = pc(replies.filter((h) => h <= sla).length, replies.length);

  /* ------------------------------- actions ------------------------------- */

  const remind = async (booking: ApptBooking) => {
    try {
      await data.act(booking, { action: "remind" });
      notify.success({
        title: `Reminder sent to ${personOf(booking).name}`,
        message: "By push and SMS. You’ll see it here when they reply.",
      });
    } catch (error) {
      notify.error({ title: "Couldn’t send the reminder", message: describeError(error, { preferServerMessage: true }).message });
    }
  };

  const attention = [
    ...overdue
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((b) => {
        const person = personOf(b);
        return {
          key: b.id,
          title: `${b.requester} has waited ${dur(hrs(b.createdAt, now))} for ${person.name}`,
          text: `${b.reason} · ${fmtD(b.date)}, ${t12(b.start)}${b.remindedAt ? ` · reminded ${ago(b.remindedAt, now)}` : ""}`,
          actions: isAdmin
            ? [
                { label: b.remindedAt ? "Remind again" : `Remind ${firstName(person.name)}`, onClick: () => remind(b) },
                { label: "Reassign", onClick: () => openDrawer(b, true) },
                { label: "Reply for them", onClick: () => openDrawer(b), primary: true },
              ]
            : [{ label: "View", onClick: () => openDrawer(b) }],
        };
      }),
    ...onLeave.map((b) => {
      const person = personOf(b);
      const away = awayOn(person, b.date);
      return {
        key: b.id,
        title: `${person.name} is on leave, but ${b.requester} booked them`,
        text: `${b.reason} · ${fmtD(b.date)}.${away ? ` ${away.note} until ${fmtD(away.to)}.` : ""}`,
        actions: [isAdmin ? { label: "Reassign", onClick: () => openDrawer(b, true), primary: true } : { label: "View", onClick: () => openDrawer(b) }],
      };
    }),
    ...(outcomeDue.length
      ? [
          {
            key: "outcome",
            title: `${plural(outcomeDue.length, "past appointment")} ${outcomeDue.length === 1 ? "has" : "have"} no outcome`,
            text: "Mark them completed or no-show so attendance and analytics stay accurate.",
            actions: [{ label: "Review", onClick: () => setTab("outcome") }],
          },
        ]
      : []),
    ...stale.map((b) => ({
      key: b.id,
      title: `${b.requester} hasn’t answered the new time`,
      text: `${personOf(b).name} suggested ${b.proposal ? `${fmtD(b.proposal.date)}, ${t12(b.proposal.start)} ` : ""}${b.respondedAt ? ago(b.respondedAt, now) : ""}.${b.phone ? ` Call ${b.phone} or confirm for them.` : ""}`,
      actions: [{ label: "View", onClick: () => openDrawer(b) }],
    })),
  ];

  const exportCsv = () => {
    downloadCsv("appointments.csv", [
      ["Requester", "Phone", "With", "Reason", "Date", "Time", "Status", "Requested", "Replied"],
      ...list.map((b) => [
        b.requester,
        b.phone,
        personOf(b).name,
        b.reason,
        b.date,
        b.start,
        STATUS_META[b.status].label,
        b.createdAt,
        b.respondedAt ?? "",
      ]),
    ]);
    notify.success({ title: `Exported ${plural(list.length, "appointment")}` });
  };

  const filterCount = Object.values(filters).filter(Boolean).length;
  const drawerBooking = byId(drawer?.id);
  const dialogBooking = byId(dialog?.id);
  const closeDialog = () => setDialog(null);

  const subLine = (booking: ApptBooking) => {
    const sub = statusSub(booking, personOf(booking), sla, now);
    return <span className={`text-xs ${SUB_TONE_CLASS[sub.tone]}`}>{sub.text}</span>;
  };

  const statusCell = (booking: ApptBooking) => {
    const pill = pillOf(booking, sla, now);
    return (
      <div className="flex flex-col items-start gap-1">
        <Pill tone={pill.tone}>{pill.label}</Pill>
        {subLine(booking)}
      </div>
    );
  };

  /* -------------------------------- render ------------------------------- */

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Appointments"
        subtitle="Every request across pastors and counsellors, and whether it’s been answered."
        actions={
          <>
            <FilterToggleButton open={showFilters} count={filterCount} onClick={() => setShowFilters((v) => !v)} />
            <UiButton onClick={exportCsv} disabled={!list.length}>
              Export CSV
            </UiButton>
            {isAdmin && (
              <UiButton tone="primary" onClick={() => setDialog({ kind: "book" })}>
                Book appointment
              </UiButton>
            )}
          </>
        }
      />

      {showFilters && (
        <FilterPanel
          title="Refine appointments"
          helper="Filters combine with the search and tabs."
          onReset={() => {
            setFilters(NO_FILTERS);
            setQuery("");
          }}
          resetDisabled={!filterCount && !query}
        >
          <Field label="With">
            <SelectInput
              value={filters.att}
              onChange={(e) => setFilters({ ...filters, att: e.target.value })}
              options={[{ value: "", label: "Everyone" }, ...data.staff.map((s) => ({ value: s.id, label: s.name }))]}
            />
          </Field>
          <Field label="Reason">
            <SelectInput
              value={filters.reason}
              onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
              options={[{ value: "", label: "All reasons" }, ...reasonOptions.map((r) => ({ value: r, label: r }))]}
            />
          </Field>
          <Field label="From">
            <TextInput type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </Field>
          <Field label="To">
            <TextInput type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </Field>
        </FilterPanel>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        <KpiButton
          label="Awaiting reply"
          value={pending.length}
          sub={overdue.length ? `${overdue.length} overdue (over ${sla} h)` : "None overdue"}
          subTone={overdue.length ? "danger" : "success"}
          alert={overdue.length > 0}
          onClick={() => setTab("pending")}
        />
        <KpiButton
          label="Today"
          value={todays.length}
          sub={next ? `Next: ${t12(next.start)} with ${personOf(next).name}` : "Nothing else today"}
          onClick={() => setTab("upcoming")}
        />
        <KpiButton label="Next 7 days" value={week.length} sub="Confirmed appointments" onClick={() => setTab("upcoming")} />
        <KpiButton
          label="Typical reply time"
          value={replies.length ? dur(median(replies)) : "—"}
          sub={replies.length ? `${within}% within ${sla} h · last 30 days` : "No replies in the last 30 days"}
          subTone={replies.length && within < 80 ? "warning" : "muted"}
          onClick={() => navigate("/home/appointments/analytics")}
        />
      </div>

      {attention.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-[#FDE68A] bg-white">
          <div className="flex flex-col gap-1 border-b border-[#FDE68A] bg-[#FFFBEB] px-5 py-4">
            <h2 className="text-base font-semibold text-primary">Needs your attention</h2>
            <p className="text-sm text-[#374151]">
              Requests nobody has answered within {sla} hours come here, and you’re alerted by push and email.
            </p>
          </div>
          {attention.map((item) => (
            <div
              key={item.key}
              className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] px-5 py-4 last:border-b-0"
            >
              <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                <p className="text-sm font-semibold text-primary">{item.title}</p>
                <p className="text-sm text-[#4B5563]">{item.text}</p>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                {item.actions.map((action) => (
                  <UiButton
                    key={action.label}
                    size="sm"
                    tone={"primary" in action && action.primary ? "primary" : "secondary"}
                    onClick={action.onClick}
                    className="flex-auto sm:flex-none"
                  >
                    {action.label}
                  </UiButton>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          ariaLabel="Appointment status"
          value={tab}
          onChange={setTab}
          tabs={TABS.map((t) => ({ key: t.key, label: t.label, count: t.counted && byTab[t.key].length ? byTab[t.key].length : null }))}
        />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search requester or reason"
          ariaLabel="Search appointments"
          className="max-w-full sm:max-w-[360px]"
        />
      </div>

      <p className="text-sm text-[#4B5563]">
        {plural(list.length, "appointment")}
        {desc && list.length > PAGE_LIMIT ? `, showing the latest ${PAGE_LIMIT}` : ""}. Select one to see its history and act on it.
      </p>

      {groups.map((group) => (
        <div key={group.day} className="flex flex-col gap-3">
          <h2 className="flex items-baseline gap-2 text-base font-semibold text-primary">
            {dayLabel(group.day, now)}
            <span className="text-sm font-normal text-[#6B7280]">{plural(group.items.length, "appointment")}</span>
          </h2>
          {wide ? (
            <GridTable
              rows={group.items}
              getRowId={(b) => b.id}
              onRowClick={(b) => openDrawer(b)}
              minWidth="940px"
              actionsWidth="96px"
              renderActions={(b) => (
                <UiButton size="sm" onClick={() => openDrawer(b)}>
                  View
                </UiButton>
              )}
              columns={[
                {
                  key: "time",
                  header: "Time",
                  width: "110px",
                  render: (b) => <CellText strong main={t12(slotOf(b).start)} sub={`${personOf(b).duration} min`} />,
                },
                {
                  key: "req",
                  header: "Requester",
                  width: "minmax(200px,1.5fr)",
                  render: (b) => <CellText strong main={b.requester} sub={b.phone} />,
                },
                {
                  key: "with",
                  header: "With",
                  width: "minmax(180px,1.3fr)",
                  render: (b) => <CellText main={personOf(b).name} sub={personOf(b).role} />,
                },
                {
                  key: "reason",
                  header: "Reason",
                  width: "minmax(160px,1.1fr)",
                  render: (b) => <p className="text-[#4B5563]">{b.reason}</p>,
                },
                {
                  key: "status",
                  header: "Status",
                  width: "minmax(200px,1.4fr)",
                  render: (b) => statusCell(b),
                },
              ]}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {group.items.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => openDrawer(b)}
                  className="flex flex-col gap-2 rounded-xl border border-lightGray bg-white p-4 text-left text-primary"
                >
                  <div className="flex w-full items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{b.requester}</p>
                      <p className="text-xs text-[#6B7280]">
                        {t12(slotOf(b).start)} · {b.reason}
                      </p>
                    </div>
                    <Pill tone={pillOf(b, sla, now).tone}>{pillOf(b, sla, now).label}</Pill>
                  </div>
                  <p className="text-sm text-[#4B5563]">With {personOf(b).name}</p>
                  {subLine(b)}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {!list.length && <ListEmpty>{data.bookingsLoaded ? EMPTY[tab] : "Loading appointments…"}</ListEmpty>}

      {drawerBooking && (
        <AppointmentDrawer
          key={drawerBooking.id + String(drawer?.reassign)}
          booking={drawerBooking}
          data={data}
          startReassigning={drawer?.reassign}
          onClose={() => setDrawer(null)}
          onDialog={(kind) => {
            setDrawer(null);
            setDialog({ kind, id: drawerBooking.id });
          }}
        />
      )}
      {dialog?.kind === "suggest" && dialogBooking && <SuggestTimeDialog booking={dialogBooking} data={data} onClose={closeDialog} />}
      {dialog?.kind === "decline" && dialogBooking && <DeclineDialog booking={dialogBooking} data={data} onClose={closeDialog} />}
      {dialog?.kind === "cancel" && dialogBooking && <CancelDialog booking={dialogBooking} data={data} onClose={closeDialog} />}
      {dialog?.kind === "book" && (
        <BookDialog
          data={data}
          onClose={closeDialog}
          onBooked={() => {
            closeDialog();
            setTab("upcoming");
          }}
        />
      )}
    </PageOutline>
  );
};

export default AppointmentManager;
