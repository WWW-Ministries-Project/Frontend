import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { api } from "@/utils";
import type {
  AnnouncementAudience,
  AnnouncementPayload,
  LmsAnnouncement,
  SomClass,
} from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { runAction } from "../runAction";
import { fmtDate } from "../somUtils";
import { Btn, EmptyBlock, Panel, Pill, type Tone } from "../ui";

const MAX_BODY = 5000;
const INPUT = "h-10 rounded-lg border border-lightGray bg-inputBackground px-3 text-sm";

const AUDIENCES: { value: AnnouncementAudience; label: string }[] = [
  { value: "COHORT", label: "Whole cohort" },
  { value: "CLASS", label: "One class" },
  { value: "AT_RISK", label: "At-risk learners" },
];

type Channels = AnnouncementPayload["channels"];
const CHANNELS: { key: keyof Channels; label: string }[] = [
  { key: "inApp", label: "In-app" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
];

type DeliveryStatus = NonNullable<LmsAnnouncement["delivery"]>["status"];
const DELIVERY: Record<DeliveryStatus, { tone: Tone; label: string }> = {
  SENT: { tone: "green", label: "Sent" },
  QUEUED: { tone: "amber", label: "Queued" },
  SCHEDULED: { tone: "amber", label: "Scheduled" },
  FAILED: { tone: "red", label: "Failed" },
  CANCELLED: { tone: "gray", label: "Cancelled" },
};

type ComposerForm = {
  audience: AnnouncementAudience;
  courseId: string;
  title: string;
  body: string;
  channels: Channels;
  schedule: boolean;
  scheduledFor: string;
};

const EMPTY_FORM: ComposerForm = {
  audience: "COHORT",
  courseId: "",
  title: "",
  body: "",
  channels: { inApp: true, email: false, sms: false },
  schedule: false,
  scheduledFor: "",
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const fmtDateTime = (iso: string) => `${fmtDate(iso)}, ${fmtTime(iso)}`;

/** "just now", "12 min ago", "3 h ago", "2 days ago"; older items show the date. */
const relative = (iso: string) => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 0) return fmtDateTime(iso);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return fmtDateTime(iso);
};

/** Local "yyyy-mm-ddThh:mm" for the min attribute of <input type="datetime-local">. */
const localInputNow = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const audienceText = (a: LmsAnnouncement) =>
  a.audience === "CLASS" ? a.course?.name ?? "One class" : a.audience === "AT_RISK" ? "At-risk learners" : "Whole cohort";

export const CohortAnnouncements = ({
  cohortId,
  classes,
  canManage,
}: {
  cohortId: number;
  classes: SomClass[];
  canManage: boolean;
}) => {
  const { data, loading, refetch } = useFetch(
    api.fetch.fetchCohortAnnouncements,
    { cohortId: String(cohortId) },
    !canManage
  );
  const items = data?.data ?? [];

  const [form, setForm] = useState<ComposerForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([]);

  const anyChannel = form.channels.inApp || form.channels.email || form.channels.sms;
  const canSend =
    !sending &&
    form.title.trim().length > 0 &&
    form.body.trim().length > 0 &&
    form.body.length <= MAX_BODY &&
    anyChannel &&
    (form.audience !== "CLASS" || Boolean(form.courseId)) &&
    (!form.schedule || Boolean(form.scheduledFor));

  const [confirming, setConfirming] = useState(false);

  /** Validates, then asks for confirmation: announcements can email or text a whole cohort. */
  const review = () => {
    if (!canSend) return;
    if (form.schedule) {
      const when = new Date(form.scheduledFor);
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        setError("Choose a time in the future to schedule this announcement.");
        return;
      }
    }
    setError("");
    setConfirming(true);
  };

  const draftAudience =
    form.audience === "CLASS"
      ? (classes.find((k) => String(k.id) === String(form.courseId))?.name ?? "one class")
      : form.audience === "AT_RISK"
        ? "learners flagged as at risk"
        : "the whole cohort";
  const channelText = [form.channels.inApp && "in-app", form.channels.email && "email", form.channels.sms && "SMS"]
    .filter(Boolean)
    .join(", ");

  const send = async () => {
    if (!canSend) return;
    setConfirming(false);
    const scheduledFor = form.schedule ? new Date(form.scheduledFor).toISOString() : null;
    const payload: AnnouncementPayload = {
      cohortId,
      audience: form.audience,
      courseId: form.audience === "CLASS" ? Number(form.courseId) : null,
      title: form.title.trim(),
      body: form.body.trim(),
      channels: form.channels,
      ...(scheduledFor ? { scheduledFor } : {}),
    };
    setSending(true);
    const ok = await runAction(() => api.post.sendCohortAnnouncement(payload), {
      success: scheduledFor ? "Announcement scheduled" : "Announcement sent",
      failure: "Could not send the announcement",
    });
    setSending(false);
    if (ok) {
      setForm(EMPTY_FORM);
      refetch();
    }
  };

  if (!canManage)
    return <EmptyBlock msg="Announcements are managed by instructors and School of Ministry managers." />;

  return (
    <div className="flex flex-col gap-4">
      <Panel title="New announcement">
        <form
          className="flex flex-col gap-4 p-4"
          // No implicit submit: Enter in a field must never send a message.
          onSubmit={(e) => e.preventDefault()}
        >
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium text-primary">Send to</legend>
            <div
              role="radiogroup"
              aria-label="Audience"
              className="inline-flex w-fit flex-wrap overflow-hidden rounded-lg border border-lightGray"
            >
              {AUDIENCES.map((a) => {
                const checked = form.audience === a.value;
                return (
                  <button
                    key={a.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setForm({ ...form, audience: a.value })}
                    className={cn(
                      "h-9 border-l border-lightGray px-3 text-sm first:border-l-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                      checked ? "bg-primary font-medium text-white" : "bg-white text-primaryGray hover:bg-gray-50"
                    )}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
            {form.audience === "CLASS" && (
              <label className="mt-1 flex flex-col gap-1 text-sm sm:max-w-xs">
                <span className="font-medium text-primary">Class</span>
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className={INPUT}
                >
                  <option value="">Choose a class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {form.audience === "AT_RISK" && (
              <p className="text-xs text-mainGray">Goes to learners the gradebook flags as at risk.</p>
            )}
          </fieldset>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-primary">Title</span>
            <input
              value={form.title}
              maxLength={191}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={INPUT}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="flex items-center justify-between">
              <span className="font-medium text-primary">Message</span>
              <span
                aria-live="polite"
                className={cn("text-xs", form.body.length > MAX_BODY ? "text-red-700" : "text-mainGray")}
              >
                {form.body.length}/{MAX_BODY}
              </span>
            </span>
            <textarea
              rows={5}
              value={form.body}
              maxLength={MAX_BODY}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="rounded-lg border border-lightGray bg-inputBackground px-3 py-2 text-sm"
            />
          </label>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium text-primary">Channels</legend>
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map((c) => {
                const on = form.channels[c.key];
                return (
                  <button
                    key={c.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setForm({ ...form, channels: { ...form.channels, [c.key]: !on } })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm",
                      on ? "border-primary bg-primary text-white" : "border-gray-200 text-primaryGray hover:bg-gray-50"
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            {!anyChannel && <p className="text-xs text-red-700">Choose at least one channel.</p>}
            {form.channels.sms && (
              <p className="text-xs text-mainGray">
                SMS is charged per message and long texts are split into several parts; keep it short.
              </p>
            )}
          </fieldset>

          <div className="flex flex-col gap-2">
            <label className="flex w-fit items-center gap-2 text-sm text-primary">
              <input
                type="checkbox"
                checked={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.checked })}
              />
              Schedule for later
            </label>
            {form.schedule && (
              <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
                <span className="font-medium text-primary">Send at</span>
                <input
                  type="datetime-local"
                  min={localInputNow()}
                  value={form.scheduledFor}
                  onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
                  className={INPUT}
                />
              </label>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={review}
              disabled={!canSend}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-lighter disabled:cursor-not-allowed disabled:opacity-50"
            >
              {form.schedule ? "Schedule" : "Send"}
            </button>
          </div>
        </form>
      </Panel>

      <Modal open={confirming} onClose={() => setConfirming(false)} className="!max-w-md" title="Confirm announcement">
        <div className="flex flex-col gap-4 p-5">
          <h3 className="text-lg font-semibold text-primary">
            {form.schedule ? "Schedule this announcement?" : "Send this announcement?"}
          </h3>
          <p className="text-sm text-primaryGray">
            “{form.title.trim()}” goes to <b className="text-primary">{draftAudience}</b> by {channelText}
            {form.schedule && form.scheduledFor ? ` on ${new Date(form.scheduledFor).toLocaleString()}` : " now"}.
          </p>
          {(form.channels.email || form.channels.sms) && (
            <p className="text-xs text-amber-700">Email and SMS can’t be recalled once they are sent.</p>
          )}
          <div className="flex justify-end gap-2">
            <Btn onClick={() => setConfirming(false)}>Back</Btn>
            <Btn variant="primary" disabled={sending} onClick={send}>
              {form.schedule ? "Schedule" : "Send"}
            </Btn>
          </div>
        </div>
      </Modal>

      <Panel title="Sent announcements">
        {loading && !data ? (
          <SkeletonLoader />
        ) : !items.length ? (
          <div className="p-4">
            <EmptyBlock msg="No announcements have been sent to this cohort yet." />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((a) => {
              const open = expanded.includes(a.id);
              const long = a.body.length > 240 || a.body.split("\n").length > 3;
              const status = a.delivery ? DELIVERY[a.delivery.status] : null;
              return (
                <li key={a.id} className="flex flex-col gap-1.5 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-primary">{a.title}</h4>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {status && <Pill tone={status.tone}>{status.label}</Pill>}
                    </div>
                  </div>
                  <p
                    className={cn("whitespace-pre-line text-sm text-primaryGray", !open && "line-clamp-3")}
                  >
                    {a.body}
                  </p>
                  {long && (
                    <Btn
                      variant="ghost"
                      className="w-fit text-xs"
                      onClick={() =>
                        setExpanded((prev) => (open ? prev.filter((id) => id !== a.id) : [...prev, a.id]))
                      }
                    >
                      {open ? "Show less" : "Show more"}
                    </Btn>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mainGray">
                    <span>
                      {a.sentByName ?? "Someone"} → {audienceText(a)}
                    </span>
                    <time dateTime={a.createdAt} title={fmtDateTime(a.createdAt)}>
                      {relative(a.createdAt)}
                    </time>
                    {a.delivery?.status === "SCHEDULED" && a.scheduled_for && (
                      <span>Scheduled for {fmtDateTime(a.scheduled_for)}</span>
                    )}
                    <span>
                      {a.recipient_count} recipient{a.recipient_count === 1 ? "" : "s"}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {CHANNELS.filter((c) => a.channels?.[c.key]).map((c) => (
                        <Pill key={c.key} tone="gray" className="px-2 font-medium">
                          {c.label}
                        </Pill>
                      ))}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export default CohortAnnouncements;
