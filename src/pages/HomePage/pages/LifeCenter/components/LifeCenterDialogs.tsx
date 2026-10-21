import { useEffect, useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import type {
  LifeCenterDetailsType,
  LifeCenterMemberType,
  LifeCenterRole,
  LifeCenterSoul,
  MeetingType,
} from "@/utils/api/lifeCenter/interfaces";
import { cn } from "@/utils/cn";

import { CommDialog } from "../../ChurchCommunication/ui/commUi";
import { Field, SelectInput, TextArea, TextInput, UiButton } from "../../MembershipManagement/components/membershipUi";
import {
  CURRENCIES,
  DAYF,
  DAYS,
  DEFAULT_COUNTRY_CODE,
  Day,
  addDaysKey,
  dayKey,
  dayNames,
  dow,
  errorText,
  fmtD,
  fmtS,
  isLeaderRole,
  isLockedRole,
  isMemberRole,
  joinAnd,
  plural,
  toDays,
  useToday,
  useWriteBranchId,
} from "../utils/lcModel";

const soulName = (s: Pick<LifeCenterSoul, "first_name" | "last_name">) => `${s.first_name} ${s.last_name}`.trim();

/* -------------------------------------------------------------------------- */
/*                               Life center form                              */
/* -------------------------------------------------------------------------- */

export interface LifeCenterFormValue {
  id: string | number;
  name: string;
  description: string;
  location: string;
  days: Day[];
  leaderUserId: string;
  members: LifeCenterMemberType[];
}

export const LifeCenterFormDialog = ({
  open,
  existing,
  takenNames,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Edit when set, create otherwise. */
  existing?: LifeCenterFormValue | null;
  takenNames: string[];
  onClose: () => void;
  onSaved: (id: string | number | null) => void;
}) => {
  const membersOptions = useStore((state) => state.membersOptions);
  const branchId = useWriteBranchId();
  const [v, setV] = useState({ name: "", description: "", location: "", days: [] as Day[], leader: "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setV({
      name: existing?.name ?? "",
      description: existing?.description ?? "",
      location: existing?.location ?? "",
      days: existing?.days ?? [],
      leader: existing?.leaderUserId ?? "",
    });
    setTried(false);
    setServerError("");
  }, [open, existing]);

  const errors: Record<string, string> = {};
  const name = v.name.trim();
  if (!name) errors.name = "Give the life center a name.";
  else if (takenNames.some((n) => n.trim().toLowerCase() === name.toLowerCase() && n !== existing?.name))
    errors.name = "Another life center already uses this name.";
  if (!v.location.trim()) errors.location = "Add where it meets.";
  if (!v.days.length) errors.days = "Pick at least one meeting day.";
  if (!existing && !v.leader) errors.leader = "Choose who leads it.";
  const shown = tried ? errors : {};

  const leaderOptions = existing
    ? existing.members.map((m) => ({
        value: String(m.userId),
        label: m.name + (isLeaderRole(m.role.name) || isMemberRole(m.role.name) ? "" : ` · ${m.role.name}`),
      }))
    : membersOptions;

  const save = async () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    setBusy(true);
    setServerError("");
    const payload = {
      name,
      description: v.description.trim(),
      location: v.location.trim(),
      meeting_dates: dayNames(v.days),
      ...(v.leader ? { leaderUserId: Number(v.leader) } : {}),
    };
    try {
      if (existing) {
        await api.put.updateLifeCenter(payload, { id: String(existing.id) });
        notify.success({ title: "Life center updated", message: `${name} has been saved.` });
        onSaved(existing.id);
      } else {
        const response = await api.post.createLifeCenter({ ...payload, ...(branchId ? { branch_id: branchId } : {}) });
        notify.success({ title: "Life center created", message: `${name} is ready. Add members and record its first meeting.` });
        onSaved(response?.data?.id ?? null);
      }
    } catch (error) {
      setServerError(errorText(error, "The life center wasn’t saved."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      busy={busy}
      title={existing ? "Edit life center" : "New life center"}
      subtitle={existing ? "Changes show for the leader straight away." : "Where it meets, which days, and who leads it."}
      errors={serverError ? [serverError] : undefined}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: busy ? "Saving…" : existing ? "Save changes" : "Create life center", onClick: save, tone: "primary", disabled: busy },
      ]}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4">
        <Field label="Name" error={shown.name}>
          <TextInput
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
            placeholder="e.g. Dansoman Life Center"
            hasError={!!shown.name}
          />
        </Field>
        <Field label="Where it meets" error={shown.location}>
          <TextInput
            value={v.location}
            onChange={(e) => setV({ ...v, location: e.target.value })}
            placeholder="Area, town or online link"
            hasError={!!shown.location}
          />
        </Field>
        <Field label="Description" className="col-span-full">
          <TextArea
            value={v.description}
            onChange={(e) => setV({ ...v, description: e.target.value })}
            placeholder="Who it’s for"
          />
        </Field>
        <Field label={existing ? "Leader" : "Leader"} error={shown.leader}>
          <SelectInput
            value={v.leader}
            onChange={(e) => setV({ ...v, leader: e.target.value })}
            hasError={!!shown.leader}
            options={[
              { value: "", label: existing ? (leaderOptions.length ? "No leader yet" : "Add members first") : "Choose a member" },
              ...leaderOptions,
            ]}
          />
        </Field>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-primary">Meeting days</span>
        <div role="group" aria-label="Meeting days" className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const on = v.days.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                aria-label={DAYF[d]}
                onClick={() => setV({ ...v, days: on ? v.days.filter((x) => x !== d) : DAYS.filter((x) => x === d || v.days.includes(x)) })}
                className={cn(
                  "min-h-10 min-w-14 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  on ? "border-primary bg-primary text-white" : "bg-white text-primary hover:bg-primary/5",
                  !on && (shown.days ? "border-[#B91C1C]" : "border-lightGray")
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
        {shown.days && (
          <span role="alert" className="text-xs text-[#B91C1C]">
            {shown.days}
          </span>
        )}
      </div>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Record meeting                               */
/* -------------------------------------------------------------------------- */

type NewPerson = { first: string; last: string; phone: string };

const CheckTile = ({
  on,
  onToggle,
  name,
  sub,
}: {
  on: boolean;
  onToggle: () => void;
  name: string;
  sub: string;
}) => (
  <label
    className={cn(
      "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2",
      on ? "border-primary bg-[#F8F9FC]" : "border-lightGray bg-white"
    )}
  >
    <input type="checkbox" checked={on} onChange={onToggle} className="m-0 h-[18px] w-[18px] flex-shrink-0 accent-primary" />
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-sm font-medium text-primary">{name}</span>
      <span className="truncate text-xs text-[#6B7280]">{sub}</span>
    </span>
  </label>
);

/** Filter box shown above a tick list once it gets long. */
const ListFilter = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
  <TextInput type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Find by name" aria-label={label} />
);

/**
 * Record or edit one meeting. Attendees are the center's souls won; first-timers
 * are souls won who have never attended, or new people added here (saved to
 * Souls won). Pass `detail` when the page already has the center loaded;
 * otherwise it is fetched when the dialog opens.
 */
export const MeetingDialog = ({
  open,
  lifeCenterId,
  detail: given,
  meeting,
  takenDates,
  onClose,
  onSaved,
}: {
  open: boolean;
  lifeCenterId: string | number | null;
  detail?: LifeCenterDetailsType | null;
  /** Edit when set. */
  meeting?: MeetingType | null;
  /** Days that already have a meeting (for picking a free default and catching duplicates). */
  takenDates?: string[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const today = useToday();
  const [fetched, setFetched] = useState<LifeCenterDetailsType | null>(null);
  const [eligible, setEligible] = useState<{ id: string; name: string }[]>([]);
  const detail = given ?? fetched;
  const [date, setDate] = useState("");
  const [att, setAtt] = useState<string[]>([]);
  const [ft, setFt] = useState<string[]>([]);
  const [news, setNews] = useState<NewPerson[]>([]);
  const [off, setOff] = useState("");
  const [cur, setCur] = useState("GHS");
  const [note, setNote] = useState("");
  const [qa, setQa] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open || !lifeCenterId) return;
    let live = true;
    if (!given) {
      setFetched(null);
      api.fetch
        .fetchLifeCenterById({ id: String(lifeCenterId) })
        .then((response) => live && setFetched(response.data))
        .catch(() => undefined);
    }
    api.fetch
      .fetchEligibleFirstTimers({ lifeCenterId: String(lifeCenterId) })
      .then(
        (response) =>
          live &&
          setEligible((response.data ?? []).map((s) => ({ id: String(s.id), name: `${s.first_name} ${s.last_name}`.trim() })))
      )
      .catch(() => live && setEligible([]));
    return () => {
      live = false;
    };
  }, [open, given, lifeCenterId]);

  const days = useMemo(() => toDays(detail?.meeting_dates), [detail]);
  const taken = useMemo(
    () => new Set((takenDates ?? []).filter((d) => !meeting || d !== dayKey(meeting.day || meeting.date))),
    [takenDates, meeting]
  );

  useEffect(() => {
    if (!open) return;
    setTried(false);
    setServerError("");
    setNews([]);
    setQa("");
    if (meeting) {
      setDate(dayKey(meeting.day || meeting.date));
      setAtt(meeting.attendees.filter((a) => !a.isFirstTimer).map((a) => String(a.soulWonId)));
      setFt(meeting.attendees.filter((a) => a.isFirstTimer).map((a) => String(a.soulWonId)));
      setOff(String(Number(meeting.offeringAmount) || 0));
      setCur(meeting.currency || "GHS");
      setNote(meeting.note ?? "");
    } else {
      setAtt([]);
      setFt([]);
      setOff("");
      setCur("GHS");
      setNote("");
    }
  }, [open, meeting]);

  // Default to the most recent scheduled day that has no meeting yet.
  useEffect(() => {
    if (!open || meeting || !detail) return;
    let pick = "";
    for (let i = 0; i < 14 && !pick; i++) {
      const d = addDaysKey(today, -i);
      if (days.includes(dow(d)) && !taken.has(d)) pick = d;
    }
    setDate(pick || (taken.has(today) ? "" : today));
  }, [open, meeting, detail, days, taken, today]);

  const souls = useMemo(
    () => [...(detail?.soulsWon ?? [])].sort((a, b) => soulName(a).localeCompare(soulName(b))),
    [detail]
  );
  const nameById = new Map(souls.map((s) => [String(s.id), soulName(s)]));
  // As before: anyone can be ticked as an attendee unless they're down as a first-timer…
  const term = qa.trim().toLowerCase();
  const attendeeList = souls.filter((s) => !ft.includes(String(s.id)));
  const attendeeShown = attendeeList.filter((s) => !term || soulName(s).toLowerCase().includes(term) || att.includes(String(s.id)));
  // …and first-timers come from souls won who have never attended (plus whoever is already ticked).
  const ftIds = Array.from(new Set([...eligible.map((e) => e.id), ...ft])).filter((id) => !att.includes(id));
  const ftList = ftIds.map((id) => ({ id, name: nameById.get(id) ?? eligible.find((e) => e.id === id)?.name ?? "Soul won" }));

  const named = news.filter((n) => n.first.trim());
  const errors: Record<string, string> = {};
  if (!date) errors.date = "Pick the meeting date.";
  else if (date > today) errors.date = "You can’t record a meeting in the future.";
  else if (taken.has(date)) errors.date = "A meeting is already recorded for this date.";
  if (off === "" || Number.isNaN(Number(off)) || Number(off) < 0) errors.off = "Enter the offering, or 0 if none was taken.";
  if (!att.length && !ft.length && !named.length) errors.att = "Add at least one attendee or first-timer.";
  if (news.some((n) => (n.first.trim() || n.last.trim() || n.phone.trim()) && (!n.first.trim() || !n.last.trim() || !n.phone.trim())))
    errors.news = "Each new first-timer needs a first name, last name and phone number.";
  const shown = tried ? errors : {};
  const dateHint =
    !shown.date && date && date <= today && days.length && !days.includes(dow(date))
      ? `${DAYF[dow(date)]} isn’t a usual meeting day. That’s fine if it was a special meeting.`
      : undefined;

  const allTicked = attendeeList.length > 0 && attendeeList.every((s) => att.includes(String(s.id)));
  const toggle = (list: string[], set: (l: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const save = async () => {
    setTried(true);
    if (Object.keys(errors).length || !lifeCenterId) return;
    setBusy(true);
    setServerError("");
    const payload = {
      lifeCenterId,
      date,
      offeringAmount: String(Number(off)),
      currency: cur,
      note: note.trim() || null,
      attendeeSoulWonIds: att.map(Number),
      firstTimerSoulWonIds: ft.map(Number),
      newFirstTimers: named.map((n) => ({
        first_name: n.first.trim(),
        last_name: n.last.trim(),
        contact_number: n.phone.trim(),
        country_code: DEFAULT_COUNTRY_CODE,
      })),
    };
    try {
      if (meeting) await api.put.updateMeeting({ ...payload, id: meeting.id }, { id: String(meeting.id) });
      else await api.post.createMeeting(payload);
      notify.success({
        title: meeting ? "Meeting updated" : "Meeting recorded",
        message: `${fmtD(date)} · ${plural(att.length, "attendee")}, ${plural(ft.length + named.length, "first-timer")}${
          named.length ? `. ${named.length} added to Souls won.` : "."
        }`,
      });
      onSaved();
    } catch (error) {
      setServerError(errorText(error, "The meeting wasn’t saved."));
    } finally {
      setBusy(false);
    }
  };

  const centerName = detail?.name ?? "Life center";
  return (
    <CommDialog
      open={open}
      onClose={onClose}
      busy={busy}
      title={`${meeting ? "Edit meeting" : "Record meeting"} · ${centerName}`}
      subtitle={
        days.length
          ? `Meets ${joinAnd(dayNames(days))}. Log who attended, the offering gathered, and any notes.`
          : "Log who attended, the offering gathered, and any notes."
      }
      errors={serverError ? [serverError] : undefined}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: busy ? "Saving…" : meeting ? "Save changes" : "Save meeting", onClick: save, tone: "primary", disabled: busy || !detail },
      ]}
    >
      {!detail ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-[#F3F4F6]" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4">
            <Field label="Meeting date" error={shown.date || dateHint}>
              <TextInput type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} hasError={!!shown.date} />
            </Field>
            <Field label="Offering" error={shown.off}>
              <TextInput
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="0"
                value={off}
                onChange={(e) => setOff(e.target.value)}
                hasError={!!shown.off}
              />
            </Field>
            <Field label="Currency">
              <SelectInput value={cur} onChange={(e) => setCur(e.target.value)} options={CURRENCIES} />
            </Field>
            <Field label="Notes" className="col-span-full">
              <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was studied, prayer points, follow-ups" />
            </Field>
          </div>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-primary">Attendees</h3>
                <p className="text-sm text-[#4B5563]">
                  Souls won who came · {att.length} of {attendeeList.length} ticked
                </p>
              </div>
              {attendeeList.length > 0 && (
                <UiButton
                  tone="ghost"
                  size="sm"
                  className="text-primary hover:bg-primary/5"
                  onClick={() => setAtt(allTicked ? [] : attendeeList.map((s) => String(s.id)))}
                >
                  {allTicked ? "Clear all" : "Tick everyone"}
                </UiButton>
              )}
            </div>
            {attendeeList.length > 12 && <ListFilter value={qa} onChange={setQa} label="Find an attendee" />}
            {attendeeList.length ? (
              <div className="grid max-h-[320px] grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-2 overflow-y-auto">
                {attendeeShown.map((s) => (
                  <CheckTile
                    key={s.id}
                    on={att.includes(String(s.id))}
                    onToggle={() => toggle(att, setAtt, String(s.id))}
                    name={soulName(s)}
                    sub={`Won ${fmtS(dayKey(s.date_won))}${s.meetings_attended ? ` · ${plural(s.meetings_attended, "meeting")}` : ""}`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6B7280]">No souls won recorded for this center yet. Add first-timers below.</p>
            )}
            {shown.att && (
              <span role="alert" className="text-xs text-[#B91C1C]">
                {shown.att}
              </span>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div>
              <h3 className="text-base font-semibold text-primary">First-timers</h3>
              <p className="text-sm text-[#4B5563]">
                Souls won attending for the first time, or someone new. New people are saved to Souls won.
              </p>
            </div>
            {ftList.length > 0 && (
              <div className="grid max-h-[240px] grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-2 overflow-y-auto">
                {ftList.map((s) => (
                  <CheckTile
                    key={s.id}
                    on={ft.includes(s.id)}
                    onToggle={() => toggle(ft, setFt, s.id)}
                    name={s.name}
                    sub="Hasn’t attended a meeting yet"
                  />
                ))}
              </div>
            )}
            {news.map((n, i) => {
              const set = (patch: Partial<NewPerson>) => setNews(news.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <div key={i} className="flex flex-wrap gap-2 rounded-lg border border-lightGray bg-[#F8F9FC] p-3">
                  <TextInput
                    className="min-w-0 flex-[1_1_140px]"
                    placeholder="First name"
                    aria-label="First name"
                    value={n.first}
                    onChange={(e) => set({ first: e.target.value })}
                  />
                  <TextInput
                    className="min-w-0 flex-[1_1_140px]"
                    placeholder="Last name"
                    aria-label="Last name"
                    value={n.last}
                    onChange={(e) => set({ last: e.target.value })}
                  />
                  <TextInput
                    className="min-w-0 flex-[1_1_140px]"
                    type="tel"
                    placeholder="Phone number"
                    aria-label="Phone number"
                    value={n.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label="Remove first-timer"
                    onClick={() => setNews(news.filter((_, j) => j !== i))}
                    className="h-10 w-10 rounded-lg border border-lightGray bg-white text-lg text-[#6B7280] hover:bg-[#F3F4F6]"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {shown.news && (
              <span role="alert" className="text-xs text-[#B91C1C]">
                {shown.news}
              </span>
            )}
            <UiButton className="self-start" onClick={() => setNews([...news, { first: "", last: "", phone: "" }])}>
              + Add a first-timer
            </UiButton>
          </section>
        </div>
      )}
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Soul won                                   */
/* -------------------------------------------------------------------------- */

export const SoulDialog = ({
  open,
  lifeCenterId,
  members,
  leaderUserId,
  onClose,
  onSaved,
}: {
  open: boolean;
  lifeCenterId: string | number;
  members: LifeCenterMemberType[];
  leaderUserId?: string | number | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const today = useToday();
  const blank = { first: "", last: "", gender: "", phone: "", email: "", city: "", date: today, wonBy: "" };
  const [v, setV] = useState(blank);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setV({ ...blank, date: today, wonBy: leaderUserId ? String(leaderUserId) : members[0] ? String(members[0].userId) : "" });
    setTried(false);
    setServerError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const errors: Record<string, string> = {};
  if (!v.first.trim()) errors.first = "Add a first name.";
  if (!v.last.trim()) errors.last = "Add a last name.";
  if (!v.phone.trim()) errors.phone = "Add a phone number so they can be followed up.";
  if (!v.date) errors.date = "Pick the date.";
  else if (v.date > today) errors.date = "The date can’t be in the future.";
  if (!v.wonBy) errors.wonBy = "Choose who won them.";
  const shown = tried ? errors : {};
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  const save = async () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    setBusy(true);
    setServerError("");
    try {
      await api.post.createSoul({
        first_name: v.first.trim(),
        last_name: v.last.trim(),
        gender: v.gender,
        phone: { number: v.phone.trim(), country_code: DEFAULT_COUNTRY_CODE },
        contact_email: v.email.trim(),
        country: "",
        city: v.city.trim(),
        date_won: v.date,
        wonById: v.wonBy,
        lifeCenterId,
      });
      notify.success({ title: "Soul won added", message: `${v.first.trim()} ${v.last.trim()} is on the follow-up list.` });
      onSaved();
    } catch (error) {
      setServerError(errorText(error, "The record wasn’t saved."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      busy={busy}
      title="Add soul won"
      subtitle="They’ll show on the follow-up list until they become a member."
      errors={serverError ? [serverError] : undefined}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: busy ? "Saving…" : "Add soul won", onClick: save, tone: "primary", disabled: busy },
      ]}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4">
        <Field label="First name" error={shown.first}>
          <TextInput value={v.first} onChange={set("first")} hasError={!!shown.first} />
        </Field>
        <Field label="Last name" error={shown.last}>
          <TextInput value={v.last} onChange={set("last")} hasError={!!shown.last} />
        </Field>
        <Field label="Gender">
          <SelectInput
            value={v.gender}
            onChange={set("gender")}
            options={[
              { value: "", label: "Prefer not to say" },
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
            ]}
          />
        </Field>
        <Field label="Phone number" error={shown.phone}>
          <TextInput type="tel" value={v.phone} onChange={set("phone")} hasError={!!shown.phone} />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={v.email} onChange={set("email")} placeholder="Optional" />
        </Field>
        <Field label="City or area">
          <TextInput value={v.city} onChange={set("city")} placeholder="Optional" />
        </Field>
        <Field label="Date won" error={shown.date}>
          <TextInput type="date" max={today} value={v.date} onChange={set("date")} hasError={!!shown.date} />
        </Field>
        <Field label="Won by" error={shown.wonBy}>
          <SelectInput
            value={v.wonBy}
            onChange={set("wonBy")}
            hasError={!!shown.wonBy}
            options={[{ value: "", label: "Choose a member" }, ...members.map((m) => ({ value: String(m.userId), label: m.name }))]}
          />
        </Field>
      </div>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Add member                                 */
/* -------------------------------------------------------------------------- */

export const MemberDialog = ({
  open,
  lifeCenterId,
  existingUserIds,
  roles,
  onClose,
  onSaved,
}: {
  open: boolean;
  lifeCenterId: string | number;
  existingUserIds: string[];
  roles: LifeCenterRole[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const membersOptions = useStore((state) => state.membersOptions);
  const branchId = useWriteBranchId();
  const memberRole = roles.find((r) => isMemberRole(r.name));
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setUserId("");
    setRoleId(memberRole ? String(memberRole.id) : roles[0] ? String(roles[0].id) : "");
    setTried(false);
    setServerError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const options = membersOptions.filter((o) => !existingUserIds.includes(String(o.value)));
  const errors: Record<string, string> = {};
  if (!userId) errors.userId = "Choose the member to add.";
  if (!roleId) errors.roleId = "Choose a role.";
  const shown = tried ? errors : {};
  const person = options.find((o) => String(o.value) === userId)?.label ?? "Member";
  const roleName = roles.find((r) => String(r.id) === roleId)?.name ?? "Member";

  const save = async () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    setBusy(true);
    setServerError("");
    try {
      await api.post.createLifeCenterMember({ userId, roleId, lifeCenterId, ...(branchId ? { branch_id: branchId } : {}) });
      notify.success({ title: "Member added", message: `${person} joined as ${roleName}.` });
      onSaved();
    } catch (error) {
      setServerError(errorText(error, "The member wasn’t added."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      busy={busy}
      width={520}
      title="Add member"
      subtitle="They’ll appear on the attendance list for the next meeting."
      errors={serverError ? [serverError] : undefined}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: busy ? "Adding…" : "Add member", onClick: save, tone: "primary", disabled: busy },
      ]}
    >
      <Field label="Member" error={shown.userId}>
        <SelectInput
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          hasError={!!shown.userId}
          options={[{ value: "", label: options.length ? "Choose a church member" : "No members to add" }, ...options]}
        />
      </Field>
      <Field label="Role" error={shown.roleId}>
        <SelectInput
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          hasError={!!shown.roleId}
          options={roles.map((r) => ({ value: String(r.id), label: r.name }))}
        />
      </Field>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Manage roles                                */
/* -------------------------------------------------------------------------- */

export const RolesDialog = ({
  open,
  roles,
  onClose,
  onChanged,
}: {
  open: boolean;
  roles: LifeCenterRole[];
  onClose: () => void;
  onChanged: () => void;
}) => {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  const add = async () => {
    const value = name.trim();
    if (!value) return setError("Type the role’s name.");
    if (roles.some((r) => r.name.trim().toLowerCase() === value.toLowerCase())) return setError("That role already exists.");
    setBusy(true);
    setError("");
    try {
      await api.post.createLifeCenterRole({ name: value });
      notify.success({ title: "Role added", message: `${value} can now be given to members.` });
      setName("");
      onChanged();
    } catch (e) {
      setError(errorText(e, "The role wasn’t added."));
    } finally {
      setBusy(false);
    }
  };

  const remove = (role: LifeCenterRole) => {
    const n = role.member_count ?? 0;
    confirmAction({
      title: `Delete the ${role.name} role?`,
      points: [n ? `${plural(n, "person", "people")} with this role will become Members.` : "Nobody holds this role yet."],
      confirmLabel: "Delete role",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deleteLifeCenterRole({ id: String(role.id) });
        notify.success({ title: "Role deleted", message: `${role.name} was removed.` });
        onChanged();
      },
    });
  };

  return (
    <CommDialog
      open={open}
      onClose={onClose}
      busy={busy}
      width={560}
      title="Manage roles"
      subtitle="Roles members can hold in any life center."
      buttons={[{ label: "Done", onClick: onClose, tone: "primary" }]}
    >
      <div className="flex flex-col">
        {roles.map((role) => (
          <div key={role.id} className="flex items-center gap-3 border-b border-[#E5E7EB] py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary">{role.name}</p>
              <p className="text-xs text-[#6B7280]">
                {plural(role.member_count ?? 0, "person", "people")} across all centers
              </p>
            </div>
            {isLockedRole(role.name) ? (
              <span className="text-xs text-[#6B7280]">Built in</span>
            ) : (
              <UiButton tone="danger" size="sm" onClick={() => remove(role)}>
                Delete
              </UiButton>
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-4">
          <TextInput
            className="min-w-0 flex-[1_1_220px]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New role, e.g. Prayer coordinator"
            aria-label="New role name"
            hasError={!!error}
          />
          <UiButton onClick={add} disabled={busy}>
            Add role
          </UiButton>
        </div>
        {error && (
          <span role="alert" className="pt-1 text-xs text-[#B91C1C]">
            {error}
          </span>
        )}
      </div>
    </CommDialog>
  );
};
