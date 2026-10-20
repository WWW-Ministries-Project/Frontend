import { ReactNode, Suspense, lazy, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { confirmAction, decodeQuery } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type { LifeCenterMemberType, LifeCenterSoul, MeetingType } from "@/utils/api/lifeCenter/interfaces";

import {
  buildSoulPrefillForm,
  memberManagePath,
  type SoulwonRecord,
} from "../MembershipManagement/components/manager/managerHelpers";
import {
  BandTabs,
  CellText,
  GridTable,
  Pill,
  SearchInput,
  SelectInput,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import { CalIcon, ClockIcon, PersonIcon, PinIcon } from "./components/lcIcons";
import { LifeCenterFormDialog, MeetingDialog, MemberDialog, SoulDialog } from "./components/LifeCenterDialogs";
import { MeetingDrawer } from "./components/MeetingDrawer";
import {
  DAYF,
  LC_BASE,
  OVERDUE_DAYS,
  dayKey,
  dayNames,
  downloadCsv,
  errorText,
  expectedMeetings,
  fmtD,
  fmtDL,
  fmtL,
  fmtS,
  gapOf,
  initials,
  joinAnd,
  lcDetailPath,
  n0,
  n1,
  nextMeetingDay,
  pctN,
  plural,
  rateColor,
  slug,
  toDays,
  useToday,
} from "./utils/lcModel";

const LifeCenterAnalyticsView = lazy(() =>
  import("./LifeCenterAnalytics").then((m) => ({ default: m.LifeCenterAnalyticsView }))
);

type Tab = "overview" | "meetings" | "souls" | "members" | "analytics";

const soulName = (s: Pick<LifeCenterSoul, "first_name" | "last_name">) => `${s.first_name} ${s.last_name}`.trim();
const isLeader = (m: LifeCenterMemberType) => m.role.name.trim().toLowerCase() === "leader";
const isPlainMember = (m: LifeCenterMemberType) => m.role.name.trim().toLowerCase() === "member";
const meetingDay = (g: MeetingType) => dayKey(g.day || g.date);
const membersAt = (g: MeetingType) => g.members?.length ?? 0;

const Panel = ({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) => (
  <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-lightGray p-5 tablet:p-6">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        {sub && <p className="text-sm text-[#4B5563]">{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const TabHeading = ({ title, sub, actions }: { title: string; sub: string; actions?: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-semibold leading-7 text-primary">{title}</h2>
      <p className="text-sm text-[#4B5563]">{sub}</p>
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

const Dashed = ({ children }: { children: ReactNode }) => (
  <p className="rounded-xl border border-dashed border-lightGray p-6 text-center text-sm text-[#4B5563]">{children}</p>
);

/**
 * One life center: header band with tabs, overview, meetings, souls won and
 * members. `leaderView` is the member-portal version for a center's own
 * leader: no back link, and an Analytics tab for their center.
 */
export const LifeCenterDetailView = ({ id, leaderView }: { id: string; leaderView?: boolean }) => {
  const navigate = useNavigate();
  const today = useToday();
  const year = today.slice(0, 4);
  const y0 = `${year}-01-01`;
  const { canManage, canAdmin } = useAccessControl();
  const manage = canManage("Life Center");
  const admin = canAdmin("Life Center");
  const canConvert = canManage("Members");
  // Leaders can record for their own center even without the Life Center permission.
  const canRecord = manage || !!leaderView;

  const detailQuery = useMemo(() => ({ id }), [id]);
  const meetingsQuery = useMemo(() => ({ lifeCenterId: id, page: "1", take: "500" }), [id]);
  const detailFetch = useFetch(api.fetch.fetchLifeCenterById, detailQuery);
  const meetingsFetch = useFetch(api.fetch.fetchMeetings, meetingsQuery);
  const rolesFetch = useFetch(api.fetch.fetchLifCenterRoles, undefined, !manage);

  const c = detailFetch.data?.data;
  const members = useMemo(() => c?.members ?? [], [c]);
  const souls = useMemo(
    () => [...(c?.soulsWon ?? [])].sort((a, b) => dayKey(b.date_won).localeCompare(dayKey(a.date_won))),
    [c]
  );
  const ms = useMemo(
    () => [...(meetingsFetch.data?.data ?? [])].sort((a, b) => meetingDay(b).localeCompare(meetingDay(a))),
    [meetingsFetch.data]
  );
  const roles = rolesFetch.data?.data ?? [];

  const [tab, setTab] = useState<Tab>("overview");
  const [mShow, setMShow] = useState(10);
  const [sq, setSq] = useState("");
  const [drawer, setDrawer] = useState<MeetingType | null>(null);
  const [meetDialog, setMeetDialog] = useState<{ open: boolean; meeting: MeetingType | null }>({ open: false, meeting: null });
  const [editOpen, setEditOpen] = useState(false);
  const [soulOpen, setSoulOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  const reload = () => {
    detailFetch.refetch();
    meetingsFetch.refetch();
  };

  if (!c) {
    return (
      <div className="flex min-h-full flex-col">
        <div className="flex flex-col gap-4 bg-primary px-[var(--app-page-padding-inline)] py-6">
          <div className="h-6 w-40 animate-pulse rounded bg-white/20" />
          <div className="h-8 w-72 max-w-full animate-pulse rounded bg-white/20" />
        </div>
        <div className="flex-1 bg-white p-6">
          {detailFetch.error ? (
            <Dashed>We couldn’t load this life center. Check your connection and try again.</Dashed>
          ) : (
            <div className="h-40 animate-pulse rounded-xl bg-[#F3F4F6]" />
          )}
        </div>
      </div>
    );
  }

  const days = toDays(c.meeting_dates);
  const created = dayKey(c.created_at) || "2000-01-01";
  const center = { days, created };
  const leader = c.leader?.name ?? members.find(isLeader)?.name ?? null;
  const leaderUserId = c.leader?.user_id ?? members.find(isLeader)?.userId ?? null;
  const msY = ms.filter((g) => meetingDay(g) >= y0);
  const exp = expectedMeetings(center, y0, today, today);
  const last = ms[0] ? meetingDay(ms[0]) : null;
  const gap = gapOf(last, today);
  const next = nextMeetingDay(days, today);
  const followUp = souls.filter((s) => !s.isMember).length;
  const takenDates = ms.map(meetingDay);

  const tabs: { key: Tab; label: ReactNode }[] = [
    { key: "overview", label: "Overview" },
    { key: "meetings", label: <TabLabel text="Meetings" n={ms.length} on={tab === "meetings"} /> },
    { key: "souls", label: <TabLabel text="Souls won" n={followUp} on={tab === "souls"} /> },
    { key: "members", label: <TabLabel text="Members" n={members.length} on={tab === "members"} /> },
    ...(leaderView ? [{ key: "analytics" as Tab, label: "Analytics" }] : []),
  ];

  const openMeeting = (g: MeetingType) => setDrawer(g);
  const record = () => setMeetDialog({ open: true, meeting: null });

  /* -------------------------------- overview ------------------------------- */

  const l8 = ms.slice(0, 8);
  const total = (g: MeetingType) => membersAt(g) + g.attendees.length;
  const avg8 = l8.length ? l8.reduce((a, g) => a + total(g), 0) / l8.length : 0;
  const mem8 = l8.length ? l8.reduce((a, g) => a + membersAt(g), 0) / l8.length : 0;
  const max = Math.max(1, ...l8.map(total));
  const soulsY = souls.filter((s) => dayKey(s.date_won) >= y0);
  const convY = soulsY.filter((s) => s.isMember).length;
  const heldRate = pctN(msY.length, exp);

  const overview = (
    <>
      {gap > OVERDUE_DAYS && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4">
          <div className="flex flex-[1_1_280px] flex-col gap-0.5">
            <p className="text-sm font-semibold text-[#B91C1C]">
              {last ? `No meeting recorded in ${gap} days` : "No meetings recorded yet"}
            </p>
            <p className="text-sm text-[#374151]">
              {last ? `Last meeting was ${fmtD(last)}. ` : ""}
              {days.length ? `It usually meets on ${joinAnd(dayNames(days))}. ` : ""}
              Record it if it held, or check in with {leader ?? "the leader"}.
            </p>
          </div>
          {canRecord && <UiButton onClick={record}>Record meeting</UiButton>}
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        {[
          { l: "Members", v: String(members.length), s: `${members.filter((m) => !isPlainMember(m)).length} with leadership roles` },
          { l: `Souls won in ${year}`, v: String(soulsY.length), s: `${convY} have become members` },
          { l: `Meetings held in ${year}`, v: `${msY.length} of ${exp}`, s: `${heldRate}% of scheduled meetings`, c: exp ? rateColor(heldRate) : undefined },
          {
            l: "Average attendance",
            v: n1(avg8),
            s: l8.length ? `${pctN(mem8, members.length)}% of members, last ${plural(l8.length, "meeting")}` : "No meetings yet",
          },
        ].map((k) => (
          <div key={k.l} className="flex flex-col gap-1 rounded-xl border border-lightGray bg-white px-5 py-4">
            <p className="text-sm text-[#4B5563]">{k.l}</p>
            <p className="text-2xl font-semibold leading-8 text-primary">{k.v}</p>
            <p className="text-xs" style={{ color: k.c ?? "#6B7280" }}>
              {k.s}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-4">
        <Panel
          title={l8.length ? `Last ${plural(l8.length, "meeting")}` : "Meetings"}
          sub="Who came each time"
          action={
            <div className="flex flex-wrap gap-3 text-xs text-[#4B5563]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                Members
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#9A5D1A]" />
                First-timers
              </span>
            </div>
          }
        >
          {l8.length ? (
            <>
              <div className="flex h-40 items-end gap-2 border-b border-[#E5E7EB]">
                {[...l8].reverse().map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => openMeeting(g)}
                    title={`${fmtD(meetingDay(g))}: ${plural(membersAt(g), "member")}, ${plural(g.attendees.length, "first-timer")}`}
                    aria-label={`${fmtD(meetingDay(g))}: ${total(g)} people`}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 text-primary"
                  >
                    <span className="text-xs font-semibold">{total(g)}</span>
                    <span
                      className="w-full max-w-10 rounded-t bg-[#9A5D1A]"
                      style={{ height: `${(g.attendees.length / max) * 100}%` }}
                    />
                    <span
                      className={`w-full max-w-10 bg-primary ${g.attendees.length ? "" : "rounded-t"}`}
                      style={{ height: `${(membersAt(g) / max) * 100}%` }}
                    />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {[...l8].reverse().map((g) => (
                  <span key={g.id} className="min-w-0 flex-1 truncate text-center text-xs text-[#6B7280]">
                    {fmtS(meetingDay(g))}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#6B7280]">No meetings recorded yet.</p>
          )}
        </Panel>
        <Panel
          title="Recent souls won"
          sub="Follow up with anyone not yet a member"
          action={
            <UiButton tone="ghost" size="sm" className="text-primary hover:bg-primary/5" onClick={() => setTab("souls")}>
              View all
            </UiButton>
          }
        >
          {souls.length ? (
            <div className="-mt-2 flex flex-col">
              {souls.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3 border-b border-[#E5E7EB] py-3 last:border-b-0">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-semibold text-primary">
                    {initials(soulName(s))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-primary">{soulName(s)}</p>
                    <p className="truncate text-xs text-[#6B7280]">
                      {fmtL(dayKey(s.date_won))} · won by {s.wonByName || "—"}
                    </p>
                  </div>
                  <Pill tone={s.isMember ? "success" : "warning"}>{s.isMember ? "Member" : "Follow up"}</Pill>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">No souls won recorded yet.</p>
          )}
        </Panel>
      </div>
    </>
  );

  /* -------------------------------- meetings ------------------------------- */

  const shown = ms.slice(0, mShow);
  const exportMeetings = () => {
    downloadCsv(`${slug(c.name)}-meetings.csv`, [
      ["Date", "Members present", "Members total", "First-timers", "Total attendance", "Offering", "Currency", "Recorded by", "Note"],
      ...ms.map((g) => [
        meetingDay(g),
        membersAt(g),
        members.length,
        g.attendees.length,
        total(g),
        Number(g.offeringAmount) || 0,
        g.currency,
        g.created_by?.name ?? "",
        g.note ?? "",
      ]),
    ]);
    notify.success({ title: "CSV downloaded", message: `${plural(ms.length, "meeting")} saved.` });
  };
  const meetingsTab = (
    <>
      <TabHeading
        title="Meetings"
        sub={`${ms.length} recorded · ${msY.length} of ${exp} scheduled meetings held this year`}
        actions={
          <>
            <UiButton onClick={exportMeetings} disabled={!ms.length}>
              Export CSV
            </UiButton>
            {canRecord && (
              <UiButton tone="primary" onClick={record}>
                Record meeting
              </UiButton>
            )}
          </>
        }
      />
      {ms.length ? (
        <>
          <div className="hidden md:block">
            <GridTable
              rows={shown}
              getRowId={(g) => String(g.id)}
              onRowClick={openMeeting}
              minWidth="860px"
              actionsWidth="80px"
              renderActions={(g) => (
                <UiButton size="sm" onClick={() => openMeeting(g)}>
                  View
                </UiButton>
              )}
              columns={[
                {
                  key: "date",
                  header: "Date",
                  width: "minmax(160px,1.3fr)",
                  render: (g) => (
                    <CellText strong main={fmtDL(meetingDay(g))} sub={g.note ? (g.note.length > 48 ? `${g.note.slice(0, 48)}…` : g.note) : undefined} />
                  ),
                },
                { key: "present", header: "Members present", width: "150px", render: (g) => `${membersAt(g)} / ${members.length}` },
                { key: "ft", header: "First-timers", width: "120px", render: (g) => g.attendees.length },
                { key: "total", header: "Total", width: "100px", render: (g) => <span className="font-semibold">{total(g)}</span> },
                { key: "off", header: "Offering", width: "140px", render: (g) => `${g.currency} ${n0(Number(g.offeringAmount) || 0)}` },
                { key: "by", header: "Recorded by", width: "minmax(140px,1fr)", render: (g) => <CellText main={g.created_by?.name} /> },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {shown.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => openMeeting(g)}
                className="flex flex-col gap-2 rounded-xl border border-lightGray bg-white p-4 text-left text-sm text-primary"
              >
                <div className="flex w-full items-baseline justify-between gap-3">
                  <p className="font-semibold">{fmtDL(meetingDay(g))}</p>
                  <span className="font-semibold">
                    {g.currency} {n0(Number(g.offeringAmount) || 0)}
                  </span>
                </div>
                <p className="text-[#4B5563]">
                  {plural(membersAt(g), "member")} · {plural(g.attendees.length, "first-timer")}
                </p>
                {g.created_by?.name && <p className="text-xs text-[#6B7280]">Recorded by {g.created_by.name}</p>}
              </button>
            ))}
          </div>
          {ms.length > mShow && (
            <UiButton className="self-center" onClick={() => setMShow(mShow + 10)}>
              Show {Math.min(10, ms.length - mShow)} more
            </UiButton>
          )}
        </>
      ) : (
        <Dashed>No meetings recorded yet. Record the next one straight after it ends.</Dashed>
      )}
    </>
  );

  /* -------------------------------- souls won ------------------------------ */

  const term = sq.trim().toLowerCase();
  const sl = souls.filter(
    (s) => !term || `${soulName(s)} ${s.contact_number} ${s.wonByName ?? ""}`.toLowerCase().includes(term)
  );
  const firstMeet = (s: LifeCenterSoul) =>
    s.first_meeting_date ? `First came to ${fmtS(dayKey(s.first_meeting_date))} meeting` : "Won outside a meeting";
  const convert = (s: LifeCenterSoul) =>
    navigate(memberManagePath, {
      state: {
        afterSubmitPath: leaderView ? undefined : lcDetailPath(c.id),
        prefillMemberForm: buildSoulPrefillForm({ ...s, lifeCenterName: c.name } as unknown as SoulwonRecord),
        prefillSourceLabel: `${s.first_name || "Soul won"} from ${c.name}`,
        sourceSoulWonId: s.id,
      },
    });
  const exportSouls = () => {
    downloadCsv(`${slug(c.name)}-souls-won.csv`, [
      ["Name", "Phone", "Email", "City", "Date won", "Won by", "Member"],
      ...sl.map((s) => [soulName(s), s.contact_number, s.contact_email ?? "", s.city, dayKey(s.date_won), s.wonByName ?? "", s.isMember ? "Yes" : "No"]),
    ]);
    notify.success({ title: "CSV downloaded", message: `${plural(sl.length, "record")} saved.` });
  };
  const soulPill = (s: LifeCenterSoul) => (
    <Pill tone={s.isMember ? "success" : "neutral"}>{s.isMember ? "Member" : "Not yet a member"}</Pill>
  );
  const soulsTab = (
    <>
      <TabHeading
        title="Souls won"
        sub={`${souls.length} recorded · ${followUp} still to follow up`}
        actions={
          <>
            <UiButton onClick={exportSouls} disabled={!sl.length}>
              Export CSV
            </UiButton>
            {canRecord && (
              <UiButton tone="primary" onClick={() => setSoulOpen(true)} disabled={!members.length}>
                Add soul won
              </UiButton>
            )}
          </>
        }
      />
      {souls.length > 0 && (
        <SearchInput
          value={sq}
          onChange={setSq}
          placeholder="Search name, phone or who won them"
          ariaLabel="Search souls won"
          className="max-w-[420px] flex-none"
        />
      )}
      {sl.length ? (
        <>
          <div className="hidden md:block">
            <GridTable
              rows={sl}
              getRowId={(s) => String(s.id)}
              minWidth="900px"
              actionsWidth="150px"
              renderActions={(s) =>
                !s.isMember && canConvert ? (
                  <UiButton size="sm" onClick={() => convert(s)}>
                    Mark as member
                  </UiButton>
                ) : null
              }
              columns={[
                { key: "name", header: "Name", width: "minmax(180px,1.5fr)", render: (s) => <CellText strong main={soulName(s)} sub={firstMeet(s)} /> },
                { key: "phone", header: "Phone", width: "140px", render: (s) => <CellText main={s.contact_number} /> },
                { key: "city", header: "City", width: "120px", render: (s) => <CellText main={s.city} /> },
                { key: "date", header: "Date won", width: "110px", render: (s) => fmtL(dayKey(s.date_won)) },
                { key: "by", header: "Won by", width: "minmax(140px,1fr)", render: (s) => <CellText main={s.wonByName} /> },
                { key: "status", header: "Status", width: "150px", render: soulPill },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {sl.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-lightGray bg-white p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-primary">{soulName(s)}</p>
                    <p className="text-xs text-[#6B7280]">
                      {fmtL(dayKey(s.date_won))} · won by {s.wonByName || "—"}
                    </p>
                  </div>
                  {soulPill(s)}
                </div>
                <p className="text-[#4B5563]">
                  {s.contact_number || "—"} · {s.city || "—"}
                </p>
                {!s.isMember && canConvert && <UiButton onClick={() => convert(s)}>Mark as member</UiButton>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <Dashed>{souls.length ? "No one matches your search." : "No souls won recorded yet."}</Dashed>
      )}
    </>
  );

  /* --------------------------------- members ------------------------------- */

  const changeRole = async (m: LifeCenterMemberType, roleId: string) => {
    const role = roles.find((r) => String(r.id) === roleId);
    if (!role) return;
    const old = role.name.trim().toLowerCase() === "leader" ? members.find((x) => isLeader(x) && x.userId !== m.userId) : undefined;
    try {
      await api.put.updateLifeCenterMember({ userId: m.userId, roleId, lifeCenterId: c.id }, { id: String(m.id) });
      notify.success({
        title: "Role updated",
        message: `${m.name} is now ${role.name}${old ? `. ${old.name} moved to Assistant leader.` : "."}`,
      });
      detailFetch.refetch();
    } catch (error) {
      notify.error({ title: "Couldn’t change the role", message: errorText(error, "Try again.") });
    }
  };
  const removeMember = (m: LifeCenterMemberType) =>
    confirmAction({
      title: `Remove ${m.name}?`,
      points: [
        "They’ll no longer appear on this center’s attendance list.",
        "Past meetings keep their record.",
      ],
      confirmLabel: "Remove member",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deleteLifeCenterMember({ userId: String(m.userId), lifeCenterId: String(c.id) });
        notify.success({ title: "Member removed", message: `${m.name} was removed from the center.` });
        detailFetch.refetch();
      },
    });
  const roleOptions = roles.map((r) => ({ value: String(r.id), label: r.name }));
  const roleControl = (m: LifeCenterMemberType, className?: string) =>
    manage && roleOptions.length ? (
      <SelectInput
        aria-label={`Role for ${m.name}`}
        value={String(m.role.id)}
        onChange={(e) => changeRole(m, e.target.value)}
        options={roleOptions.some((o) => o.value === String(m.role.id)) ? roleOptions : [{ value: String(m.role.id), label: m.role.name }, ...roleOptions]}
        className={className}
      />
    ) : (
      <span className="text-sm text-primary">{m.role.name}</span>
    );
  const rateOf = (m: LifeCenterMemberType) => {
    const of = m.of ?? 0;
    const r = pctN(m.attended ?? 0, of);
    return { of, r, text: of ? `${m.attended ?? 0} of last ${plural(of, "meeting")}` : "No meetings yet", color: r >= 70 ? "#080D2D" : r >= 40 ? "#B45309" : "#B91C1C" };
  };
  const canRemove = (m: LifeCenterMemberType) => admin && !isLeader(m);
  const membersTab = (
    <>
      <TabHeading
        title="Members"
        sub="Attendance is over this center’s last 10 meetings. Roles are set in Manage roles."
        actions={
          manage ? (
            <UiButton tone="primary" onClick={() => setMemberOpen(true)}>
              Add member
            </UiButton>
          ) : undefined
        }
      />
      {members.length ? (
        <>
          <div className="hidden md:block">
            <GridTable
              rows={members}
              getRowId={(m) => String(m.userId)}
              minWidth="760px"
              actionsWidth="100px"
              renderActions={(m) =>
                canRemove(m) ? (
                  <UiButton size="sm" tone="danger" onClick={() => removeMember(m)}>
                    Remove
                  </UiButton>
                ) : null
              }
              columns={[
                {
                  key: "name",
                  header: "Member",
                  width: "minmax(200px,1.6fr)",
                  render: (m) => (
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-semibold">
                        {initials(m.name)}
                      </span>
                      <p className="truncate font-semibold">{m.name}</p>
                    </div>
                  ),
                },
                { key: "phone", header: "Phone", width: "150px", render: (m) => <CellText main={m.phone} /> },
                { key: "role", header: "Role", width: "200px", render: (m) => roleControl(m) },
                {
                  key: "rate",
                  header: "Attendance",
                  width: "minmax(160px,1fr)",
                  render: (m) => {
                    const a = rateOf(m);
                    return (
                      <div className="flex flex-col gap-1">
                        <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                          <div className="h-full" style={{ width: `${a.r}%`, background: a.color }} />
                        </div>
                        <span className="text-xs text-[#6B7280]">{a.text}</span>
                      </div>
                    );
                  },
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {members.map((m) => (
              <div key={m.userId} className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-semibold text-primary">
                    {initials(m.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary">{m.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {m.phone || "—"} · {rateOf(m).text}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">{roleControl(m)}</div>
                  {canRemove(m) && (
                    <UiButton tone="danger" onClick={() => removeMember(m)}>
                      Remove
                    </UiButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Dashed>No members yet. Add the people who belong to this center so you can take attendance.</Dashed>
      )}
    </>
  );

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-4 bg-primary px-[var(--app-page-padding-inline)] pt-5 text-white">
        {!leaderView && (
          <button
            type="button"
            onClick={() => navigate(LC_BASE)}
            className="self-start bg-transparent p-0 text-sm text-white/80 transition-colors hover:text-white"
          >
            ← Life centers
          </button>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
            <h1 className="text-xl font-semibold leading-8 tablet:text-2xl">{c.name}</h1>
            {c.description && <p className="text-sm text-white/80">{c.description}</p>}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
              {c.location && (
                <span className="inline-flex items-center gap-1.5">
                  <PinIcon />
                  {c.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalIcon />
                {days.length ? days.map((d) => DAYF[d]).join(", ") : "No meeting days"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PersonIcon />
                {leader ? `Led by ${leader}` : "No leader yet"}
              </span>
              {next && (
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon />
                  Next meeting {next === today ? "today" : fmtD(next)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {manage && (
              <UiButton className="border-white/40 bg-transparent text-white hover:bg-white/10" onClick={() => setEditOpen(true)}>
                Edit details
              </UiButton>
            )}
            {canRecord && (
              <UiButton className="border-white bg-white px-5 text-primary hover:bg-white/90" onClick={record}>
                Record meeting
              </UiButton>
            )}
          </div>
        </div>
        <div className="-mb-px overflow-x-auto">
          <BandTabs tabs={tabs} value={tab} onChange={(k) => { setTab(k); setMShow(10); }} ariaLabel="Life center sections" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 bg-white px-[var(--app-page-padding-inline)] py-6">
        {tab === "overview" && overview}
        {tab === "meetings" && meetingsTab}
        {tab === "souls" && soulsTab}
        {tab === "members" && membersTab}
        {tab === "analytics" && (
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-[#F3F4F6]" />}>
            <LifeCenterAnalyticsView fixedCenterId={c.id} embedded />
          </Suspense>
        )}
      </div>

      <MeetingDrawer
        meeting={drawer}
        centerName={c.name}
        members={members}
        souls={souls}
        canEdit={canRecord}
        canDelete={admin}
        onClose={() => setDrawer(null)}
        onEdit={(g) => {
          setDrawer(null);
          setMeetDialog({ open: true, meeting: g });
        }}
        onDelete={(g) =>
          confirmAction({
            title: `Delete the meeting on ${fmtD(meetingDay(g))}?`,
            points: [
              "Attendance and offering for this date will be removed from analytics.",
              "First-timers stay in Souls won.",
            ],
            confirmLabel: "Delete meeting",
            tone: "danger",
            onConfirm: async () => {
              await api.delete.deleteMeeting({ id: String(g.id) });
              notify.success({ title: "Meeting deleted", message: `${fmtD(meetingDay(g))} was removed.` });
              setDrawer(null);
              reload();
            },
          })
        }
      />
      <MeetingDialog
        open={meetDialog.open}
        lifeCenterId={c.id}
        detail={c}
        meeting={meetDialog.meeting}
        takenDates={takenDates}
        onClose={() => setMeetDialog({ open: false, meeting: null })}
        onSaved={() => {
          setMeetDialog({ open: false, meeting: null });
          reload();
        }}
      />
      <LifeCenterFormDialog
        open={editOpen}
        existing={{
          id: c.id,
          name: c.name,
          description: c.description,
          location: c.location,
          days,
          leaderUserId: leaderUserId ? String(leaderUserId) : "",
          members,
        }}
        takenNames={[]}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          detailFetch.refetch();
        }}
      />
      <SoulDialog
        open={soulOpen}
        lifeCenterId={c.id}
        members={members}
        leaderUserId={leaderUserId}
        onClose={() => setSoulOpen(false)}
        onSaved={() => {
          setSoulOpen(false);
          detailFetch.refetch();
        }}
      />
      {manage && (
        <MemberDialog
          open={memberOpen}
          lifeCenterId={c.id}
          existingUserIds={members.map((m) => String(m.userId))}
          roles={roles}
          onClose={() => setMemberOpen(false)}
          onSaved={() => {
            setMemberOpen(false);
            detailFetch.refetch();
          }}
        />
      )}
    </div>
  );
};

const TabLabel = ({ text, n, on }: { text: string; n: number; on: boolean }) => (
  <span className="inline-flex items-center gap-2">
    {text}
    {n > 0 && (
      <span className={`rounded-full px-2 text-xs font-semibold text-white ${on ? "bg-primary" : "bg-white/15"}`}>{n}</span>
    )}
  </span>
);

/** Route page: /home/life-centers/life-center/:id (id is encoded). */
const LifeCenterDetail = () => {
  const { id: encoded } = useParams();
  const id = decodeQuery(String(encoded ?? ""));
  return <LifeCenterDetailView id={String(id)} />;
};

export default LifeCenterDetail;
