import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type {
  AttendanceStatus,
  LmsSession,
  SessionAttendance,
  SessionMode,
  SessionPayload,
  SomClass,
} from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { runAction } from "../runAction";
import { fmtDate, formatLabel, personName, safeHttpUrl, somPaths } from "../somUtils";
import { Btn, EmptyBlock, Panel, Pill, ProgressBar, SimpleTable, type Tone } from "../ui";

const FILTERS = ["Upcoming", "Past", "All"] as const;
type Filter = (typeof FILTERS)[number];

const MODES: { value: SessionMode; label: string; tone: Tone }[] = [
  { value: "IN_PERSON", label: "In person", tone: "indigo" },
  { value: "ONLINE", label: "Online", tone: "cyan" },
  { value: "HYBRID", label: "Hybrid", tone: "fuchsia" },
];

const STATUSES: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: "PRESENT", label: "Present", active: "border-green-600 bg-green-600 text-white" },
  { value: "LATE", label: "Late", active: "border-amber-500 bg-amber-500 text-white" },
  { value: "ABSENT", label: "Absent", active: "border-red-600 bg-red-600 text-white" },
  { value: "EXCUSED", label: "Excused", active: "border-gray-500 bg-gray-500 text-white" },
];

const INPUT = "h-10 rounded-lg border border-lightGray bg-inputBackground px-3 text-sm";

/** yyyy-mm-dd in local time, for <input type="date">. */
const toInputDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** hh:mm in local time, for <input type="time">. */
const toInputTime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Combines a local date and time into an ISO string. */
const fromInputDateTime = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).toISOString();
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const fmtWeekday = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short" });

const modeMeta = (mode: SessionMode) => MODES.find((m) => m.value === mode) ?? MODES[0];

type SessionForm = {
  title: string;
  courseId: string;
  date: string;
  start: string;
  end: string;
  mode: SessionMode;
  location: string;
  meetingLink: string;
  week: string;
  notes: string;
};

const EMPTY_FORM: SessionForm = {
  title: "",
  courseId: "",
  date: "",
  start: "",
  end: "",
  mode: "IN_PERSON",
  location: "",
  meetingLink: "",
  week: "",
  notes: "",
};

const toForm = (s: LmsSession): SessionForm => ({
  title: s.title,
  courseId: s.courseId ? String(s.courseId) : "",
  date: toInputDate(s.starts_at),
  start: toInputTime(s.starts_at),
  end: toInputTime(s.ends_at),
  mode: s.mode,
  location: s.location ?? "",
  meetingLink: s.meeting_link ?? "",
  week: s.week != null ? String(s.week) : "",
  notes: s.notes ?? "",
});

type Learner = SessionAttendance["learners"][number];
type Mark = { status: AttendanceStatus | null; note: string };
const EMPTY_MARK: Mark = { status: null, note: "" };

export const CohortSessions = ({
  cohortId,
  programId,
  classes,
  canManage,
}: {
  cohortId: number;
  programId: number;
  classes: SomClass[];
  canManage: boolean;
}) => {
  const { data, loading, refetch } = useFetch(
    api.fetch.fetchLmsSessions,
    { cohortId: String(cohortId) },
    !canManage
  );
  const sessions = useMemo(() => data?.data ?? [], [data]);

  const [filter, setFilter] = useState<Filter>("Upcoming");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ id: number | null } | null>(null);
  const [form, setForm] = useState<SessionForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [attendanceFor, setAttendanceFor] = useState<LmsSession | null>(null);

  const now = Date.now();
  const isPast = (s: LmsSession) => new Date(s.starts_at).getTime() < now;

  const visible = useMemo(() => {
    const t = Date.now();
    if (filter === "All") return sessions;
    if (filter === "Past")
      return sessions.filter((s) => new Date(s.starts_at).getTime() < t).slice().reverse();
    return sessions.filter((s) => new Date(s.starts_at).getTime() >= t);
  }, [sessions, filter]);

  const mutate = async (fn: () => Promise<unknown>, success: string, failure: string) => {
    setBusy(true);
    const ok = await runAction(fn, { success, failure });
    setBusy(false);
    if (ok) refetch();
    return ok;
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditing({ id: null });
  };

  const openEdit = (s: LmsSession) => {
    setForm(toForm(s));
    setFormError("");
    setEditing({ id: s.id });
  };

  const saveSession = async () => {
    if (!editing) return;
    if (!form.title.trim() || !form.date || !form.start) {
      setFormError("Add a title, date and start time.");
      return;
    }
    if (form.end && form.end <= form.start) {
      setFormError("The end time must be after the start time.");
      return;
    }
    const link = form.meetingLink.trim();
    if (form.mode !== "IN_PERSON" && link && !safeHttpUrl(link)) {
      setFormError("The meeting link must start with http:// or https://.");
      return;
    }
    const week = form.week.trim() ? Number(form.week) : null;
    if (week !== null && (!Number.isInteger(week) || week < 1)) {
      setFormError("The week must be a whole number of 1 or more.");
      return;
    }
    setFormError("");
    const payload: SessionPayload = {
      cohortId,
      courseId: form.courseId ? Number(form.courseId) : null,
      title: form.title.trim(),
      starts_at: fromInputDateTime(form.date, form.start),
      ends_at: form.end ? fromInputDateTime(form.date, form.end) : null,
      mode: form.mode,
      location: form.mode === "ONLINE" ? null : form.location.trim() || null,
      meeting_link: form.mode === "IN_PERSON" ? null : link || null,
      week,
      notes: form.notes.trim() || null,
    };
    const id = editing.id;
    const ok = await mutate(
      () => (id ? api.put.updateLmsSession(payload, { id: String(id) }) : api.post.createLmsSession(payload)),
      id ? "Session updated" : "Session added",
      id ? "Could not update the session" : "Could not add the session"
    );
    if (ok) setEditing(null);
  };

  const toggleCancelled = (s: LmsSession) =>
    mutate(
      () => api.put.updateLmsSession({ cancelled: !s.cancelled }, { id: String(s.id) }),
      s.cancelled ? "Session restored" : "Session cancelled",
      s.cancelled ? "Could not restore the session" : "Could not cancel the session"
    );

  const removeSession = (s: LmsSession) =>
    showDeleteDialog({ name: s.title, id: s.id }, () => {
      mutate(
        () => api.delete.deleteLmsSession({ id: String(s.id) }),
        "Session deleted",
        "Could not delete the session"
      );
    });

  if (!canManage)
    return <EmptyBlock msg="Sessions and attendance are managed by instructors and School of Ministry managers." />;
  if (loading && !data) return <SkeletonLoader />;

  return (
    <div className="flex flex-col gap-3">
      {classes.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Classes in this cohort">
          {classes.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-x-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-primaryGray"
            >
              <span className="font-semibold text-primary">{c.name}</span>
              <span>· {formatLabel(c.classFormat)}</span>
              {c.schedule && <span>· {c.schedule}</span>}
              <span>· {personName(c.instructor)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show sessions">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                filter === f
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 text-primaryGray hover:bg-gray-50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Btn size="sm" variant="primary" onClick={openCreate}>
            + Session
          </Btn>
        </div>
      </div>

      <Panel>
        <SimpleTable<LmsSession>
          rows={visible}
          rowKey={(s) => s.id}
          minWidth={920}
          empty={
            <div className="p-4">
              <EmptyBlock
                msg={
                  filter === "Upcoming"
                    ? "No upcoming sessions."
                    : filter === "Past"
                      ? "No past sessions yet."
                      : "No sessions scheduled for this cohort yet."
                }
                action={
                  <Btn size="sm" onClick={openCreate}>
                    + Session
                  </Btn>
                }
              />
            </div>
          }
          columns={[
            {
              key: "week",
              header: "Week",
              className: "w-16",
              render: (s) => <span className="text-primaryGray">{s.week ?? "—"}</span>,
            },
            {
              key: "when",
              header: "Date / time",
              render: (s) => (
                <div className="whitespace-nowrap">
                  <p className="font-medium">
                    {fmtWeekday(s.starts_at)}, {fmtDate(s.starts_at)}
                  </p>
                  <p className="text-xs text-mainGray">
                    {fmtTime(s.starts_at)}
                    {s.ends_at && ` – ${fmtTime(s.ends_at)}`}
                  </p>
                </div>
              ),
            },
            {
              key: "title",
              header: "Session",
              render: (s) => (
                <div className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn("font-medium", s.cancelled && "text-mainGray line-through")}>
                      {s.title}
                    </span>
                    {s.cancelled && <Pill tone="red">Cancelled</Pill>}
                  </div>
                  <span className="text-xs text-mainGray">
                    {s.course ? s.course.name : "Whole cohort"}
                    {s.location && ` · ${s.location}`}
                  </span>
                </div>
              ),
            },
            {
              key: "mode",
              header: "Mode",
              render: (s) => {
                const m = modeMeta(s.mode);
                const link = safeHttpUrl(s.meeting_link);
                return (
                  <div className="flex flex-col items-start gap-1">
                    <Pill tone={m.tone}>{m.label}</Pill>
                    {link && !s.cancelled && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline"
                      >
                        Join link
                      </a>
                    )}
                  </div>
                );
              },
            },
            {
              key: "att",
              header: "Attendance",
              render: (s) => {
                if (s.recorded <= 0) return <span className="text-sm text-mainGray">Not taken</span>;
                const present = (s.tally?.PRESENT ?? 0) + (s.tally?.LATE ?? 0);
                const pct = s.expected > 0 ? (present / s.expected) * 100 : 0;
                return (
                  <div className="flex w-32 flex-col gap-1">
                    <span className="text-sm">
                      {present}/{s.expected} present
                    </span>
                    <ProgressBar value={pct} />
                  </div>
                );
              },
            },
            {
              key: "actions",
              header: <span className="sr-only">Actions</span>,
              render: (s) => {
                const due = isPast(s) && s.recorded === 0 && !s.cancelled;
                return (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Btn
                      size="sm"
                      variant={due ? "primary" : "secondary"}
                      disabled={s.cancelled || busy}
                      title={s.cancelled ? "Restore the session to take attendance" : undefined}
                      onClick={() => setAttendanceFor(s)}
                    >
                      {s.recorded > 0 ? "Edit attendance" : "Take attendance"}
                    </Btn>
                    <Btn size="sm" disabled={busy} onClick={() => openEdit(s)}>
                      Edit
                    </Btn>
                    <Btn size="sm" disabled={busy} onClick={() => toggleCancelled(s)}>
                      {s.cancelled ? "Restore" : "Cancel"}
                    </Btn>
                    <Btn
                      size="sm"
                      variant="ghost"
                      className="px-2 text-red-700"
                      disabled={busy}
                      onClick={() => removeSession(s)}
                    >
                      Delete
                    </Btn>
                  </div>
                );
              },
            },
          ]}
        />
      </Panel>

      <p className="text-xs text-mainGray">
        Attendance counts toward grades when the program weights it; late counts as present, excused is not counted.{" "}
        <Link to={somPaths.program(programId, "Grading & completion")} className="text-primary underline">
          Grading model
        </Link>
      </p>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        className="!max-w-lg"
        title={editing?.id ? "Edit session" : "Add session"}
      >
        {editing && (
          <form
            className="flex flex-col gap-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveSession();
            }}
          >
            <h3 className="text-lg font-semibold text-primary">{editing.id ? "Edit session" : "Add session"}</h3>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={INPUT}
                maxLength={191}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Class</span>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className={INPUT}
              >
                <option value="">Whole cohort</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={INPUT}
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Start time</span>
                <input
                  type="time"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                  className={INPUT}
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">End time (optional)</span>
                <input
                  type="time"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                  className={INPUT}
                />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Mode</span>
                <select
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value as SessionMode })}
                  className={INPUT}
                >
                  {MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Week (optional)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.week}
                  onChange={(e) => setForm({ ...form, week: e.target.value })}
                  className={INPUT}
                />
              </label>
            </div>
            {form.mode !== "ONLINE" && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Location</span>
                <input
                  value={form.location}
                  maxLength={191}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={INPUT}
                />
              </label>
            )}
            {form.mode !== "IN_PERSON" && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Meeting link</span>
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={form.meetingLink}
                  onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                  className={INPUT}
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Notes (optional)</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="rounded-lg border border-lightGray bg-inputBackground px-3 py-2 text-sm"
              />
            </label>
            {formError && (
              <p role="alert" className="text-sm text-red-700">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setEditing(null)}>Cancel</Btn>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-lighter disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editing.id ? "Save session" : "Add session"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {attendanceFor && (
        <AttendanceModal
          key={attendanceFor.id}
          session={attendanceFor}
        onClose={() => setAttendanceFor(null)}
          onSaved={() => {
            setAttendanceFor(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

const AttendanceModal = ({
  session,
  onClose,
  onSaved,
}: {
  session: LmsSession;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { data, loading } = useFetch(
    api.fetch.fetchSessionAttendance,
    { sessionId: String(session.id) },
    session.cancelled
  );
  const roster = data?.data;
  const loaded = Boolean(roster && roster.session.id === session.id);

  const [marks, setMarks] = useState<Partial<Record<number, Mark>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loaded || !roster) return;
    const next: Partial<Record<number, Mark>> = {};
    roster.learners.forEach((l) => {
      next[l.enrollmentId] = { status: l.status, note: l.note ?? "" };
    });
    setMarks(next);
  }, [loaded, roster]);

  const learners = useMemo<Learner[]>(
    () =>
      loaded && roster
        ? [...roster.learners].sort(
            (a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name)
          )
        : [],
    [loaded, roster]
  );
  const multipleClasses = new Set(learners.map((l) => l.classId)).size > 1;

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus | "UNMARKED", number> = {
      PRESENT: 0,
      LATE: 0,
      ABSENT: 0,
      EXCUSED: 0,
      UNMARKED: 0,
    };
    learners.forEach((l) => {
      const s = marks[l.enrollmentId]?.status;
      c[s ?? "UNMARKED"] += 1;
    });
    return c;
  }, [learners, marks]);

  const setMark = (id: number, patch: Partial<Mark>) =>
    setMarks((prev) => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_MARK), ...patch } }));

  const markAllPresent = () =>
    setMarks((prev) => {
      const next = { ...prev };
      learners.forEach((l) => {
        next[l.enrollmentId] = { ...(prev[l.enrollmentId] ?? EMPTY_MARK), status: "PRESENT" };
      });
      return next;
    });

  const save = async () => {
    const records = learners.flatMap((l) => {
      const m = marks[l.enrollmentId];
      return m?.status ? [{ enrollmentId: l.enrollmentId, status: m.status, note: m.note.trim() || null }] : [];
    });
    if (!records.length) return;
    setSaving(true);
    const ok = await runAction(() => api.put.saveSessionAttendance({ sessionId: session.id, records }), {
      success: "Attendance saved",
      failure: "Could not save attendance",
    });
    setSaving(false);
    if (ok) onSaved();
  };

  const marked = learners.length - counts.UNMARKED;
  let lastClass: number | null = null;

  return (
    <Modal open onClose={onClose} className="!max-w-2xl" title="Take attendance">
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-primary">Attendance · {session.title}</h3>
          <p className="text-sm text-primaryGray">
            {fmtWeekday(session.starts_at)}, {fmtDate(session.starts_at)} · {fmtTime(session.starts_at)}
            {session.course ? ` · ${session.course.name}` : " · Whole cohort"}
          </p>
        </div>

        {session.cancelled ? (
          <EmptyBlock msg="This session is cancelled. Restore it to take attendance." />
        ) : loading || !loaded ? (
          <SkeletonLoader />
        ) : !learners.length ? (
          <EmptyBlock msg="No learners are enrolled for this session yet." />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Pill tone="green">{counts.PRESENT} present</Pill>
              <Pill tone="amber">{counts.LATE} late</Pill>
              <Pill tone="red">{counts.ABSENT} absent</Pill>
              <Pill tone="gray">{counts.EXCUSED} excused</Pill>
              {counts.UNMARKED > 0 && <span className="text-xs text-mainGray">{counts.UNMARKED} not marked</span>}
              <Btn size="sm" className="ml-auto" onClick={markAllPresent}>
                Mark all present
              </Btn>
            </div>

            <ul className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
              {learners.map((l) => {
                const m = marks[l.enrollmentId] ?? EMPTY_MARK;
                const header = multipleClasses && l.classId !== lastClass;
                lastClass = l.classId;
                return (
                  <li key={l.enrollmentId} className="flex flex-col">
                    {header && (
                      <p className="bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-mainGray">
                        {l.className}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-primary">{l.name}</p>
                        {!multipleClasses && <p className="text-xs text-mainGray">{l.className}</p>}
                      </div>
                      <StatusRadios
                        name={l.name}
                        value={m.status}
                        onChange={(status) => setMark(l.enrollmentId, { status })}
                      />
                      <input
                        aria-label={`Note for ${l.name}`}
                        placeholder="Note (optional)"
                        value={m.note}
                        maxLength={191}
                        onChange={(e) => setMark(l.enrollmentId, { note: e.target.value })}
                        className="h-8 rounded-lg border border-lightGray bg-inputBackground px-2 text-sm sm:w-40"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {loaded && !session.cancelled && learners.length > 0 && (
            <span className="mr-auto text-xs text-mainGray">
              {marked} of {learners.length} marked
            </span>
          )}
          <Btn onClick={onClose}>Close</Btn>
          <Btn
            variant="primary"
            disabled={saving || session.cancelled || !loaded || marked === 0}
            onClick={save}
          >
            Save attendance
          </Btn>
        </div>
      </div>
    </Modal>
  );
};

/** Segmented Present / Late / Absent / Excused control with radio-group keyboard behaviour. */
const StatusRadios = ({
  name,
  value,
  onChange,
}: {
  name: string;
  value: AttendanceStatus | null;
  onChange: (status: AttendanceStatus) => void;
}) => {
  const focusIndex = Math.max(
    0,
    STATUSES.findIndex((s) => s.value === value)
  );
  const move = (from: number, delta: number, group: HTMLElement | null) => {
    const next = (from + delta + STATUSES.length) % STATUSES.length;
    onChange(STATUSES[next].value);
    const buttons = group?.querySelectorAll<HTMLButtonElement>("[role=radio]");
    buttons?.[next]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={`Attendance for ${name}`}
      className="inline-flex overflow-hidden rounded-lg border border-lightGray"
    >
      {STATUSES.map((s, i) => {
        const checked = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={i === focusIndex ? 0 : -1}
            onClick={() => onChange(s.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                move(i, 1, e.currentTarget.parentElement);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                move(i, -1, e.currentTarget.parentElement);
              }
            }}
            className={cn(
              "h-8 border-l border-lightGray px-2.5 text-xs font-medium first:border-l-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              checked ? s.active : "bg-white text-primaryGray hover:bg-gray-50"
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
};

export default CohortSessions;
