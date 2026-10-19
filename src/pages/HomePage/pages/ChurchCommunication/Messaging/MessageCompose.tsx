import { useEffect, useMemo, useState } from "react";

import { notify } from "@/components/feedback";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type { CommunityPerson } from "@/utils/api/community/interfaces";
import type {
  AudienceCount,
  AudienceScope,
  MessageAudience,
  MessageChannels,
} from "@/utils/api/messaging/interfaces";
import type { DepartmentType } from "@/utils/api/settings/departmentInterfaces";

import PageOutline from "../../../Components/PageOutline";
import { Field, PillTabs, TextArea, TextInput } from "../../MembershipManagement/components/membershipUi";
import {
  FieldHint,
  PlaceholderChips,
} from "../ui/commUi";
import {
  PHONE_MAX,
  appendToken,
  errorText,
  formatDayTime,
  useViewportWidth,
} from "../ui/commUtils";
import { useMessagePreview } from "./useMessagePreview";
import { CHANNELS, GENERAL_CHIPS, NO_CHANNELS, type ChannelKey } from "./messagingHelpers";

export interface ComposeSeed {
  title?: string;
  body?: string;
  emailSubject?: string;
  channels?: MessageChannels;
}

const CHURCH_NAME = "Worldwide Word Ministries";
const MIN_LEAD_MS = 5 * 60 * 1000;
const MAX_LEAD_MS = 90 * 24 * 60 * 60 * 1000;
const nf = (value: number) => value.toLocaleString("en-US");

const pad = (value: number) => String(value).padStart(2, "0");
const toLocalInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const reachKey: Record<ChannelKey, keyof AudienceCount> = { sms: "sms", email: "email", inApp: "inApp" };

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-5">
    <h2 className="text-base font-semibold text-primary">{title}</h2>
    {children}
  </section>
);

const useDebounced = <T,>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

export const MessageCompose = ({
  seed,
  timezone,
  onClose,
  onSent,
}: {
  seed: ComposeSeed;
  timezone: string;
  onClose: () => void;
  onSent: () => Promise<void>;
}) => {
  const vw = useViewportWidth();
  const phone = vw < PHONE_MAX;
  const sideBySide = vw >= 1100;

  const [scope, setScope] = useState<AudienceScope>("CHURCH");
  const [includeGuests, setIncludeGuests] = useState(false);
  const [includeVisitors, setIncludeVisitors] = useState(false);
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [channels, setChannels] = useState<MessageChannels>(seed.channels ?? { ...NO_CHANNELS, inApp: true });
  const [title, setTitle] = useState(seed.title ?? "");
  const [subject, setSubject] = useState(seed.emailSubject ?? "");
  const [body, setBody] = useState(seed.body ?? "");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [at, setAt] = useState("");
  const [previewChannel, setPreviewChannel] = useState<ChannelKey | null>(null);

  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [matches, setMatches] = useState<CommunityPerson[]>([]);
  const [baseCounts, setBaseCounts] = useState<{ members: number; guests: number; visitors: number } | null>(null);
  const [reach, setReach] = useState<AudienceCount | null>(null);

  /* ------------------------------- data ------------------------------- */

  useEffect(() => {
    let cancelled = false;
    api.fetch
      .fetchDepartments()
      .then((response) => !cancelled && setDepartments(response.data ?? []))
      .catch(() => undefined);
    const church = (guests: boolean, visitors: boolean): MessageAudience => ({
      scope: "CHURCH",
      departmentIds: [],
      userIds: [],
      includeGuests: guests,
      includeVisitors: visitors,
    });
    Promise.all([
      api.post.countMessageAudience({ audience: church(false, false) }),
      api.post.countMessageAudience({ audience: church(true, false) }),
      api.post.countMessageAudience({ audience: church(false, true) }),
    ])
      .then(([base, guests, visitors]) => {
        if (cancelled) return;
        const members = base.data?.people ?? 0;
        setBaseCounts({
          members,
          guests: Math.max(0, (guests.data?.people ?? 0) - members),
          visitors: Math.max(0, (visitors.data?.people ?? 0) - members),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const audience: MessageAudience = useMemo(
    () => ({
      scope,
      departmentIds: scope === "DEPARTMENTS" ? departmentIds : [],
      userIds: scope === "PEOPLE" ? people.map((person) => person.id) : [],
      includeGuests: scope === "CHURCH" && includeGuests,
      includeVisitors: scope === "CHURCH" && includeVisitors,
    }),
    [scope, departmentIds, people, includeGuests, includeVisitors]
  );
  const audienceOk = scope === "CHURCH" || (scope === "DEPARTMENTS" ? departmentIds.length > 0 : people.length > 0);
  const debouncedAudience = useDebounced(audience);

  useEffect(() => {
    if (!audienceOk) {
      setReach(null);
      return;
    }
    let cancelled = false;
    api.post
      .countMessageAudience({ audience: debouncedAudience })
      .then((response) => !cancelled && setReach(response.data))
      .catch(() => !cancelled && setReach(null));
    return () => {
      cancelled = true;
    };
  }, [debouncedAudience, audienceOk]);

  const debouncedPeopleQuery = useDebounced(peopleQuery.trim());
  useEffect(() => {
    if (!debouncedPeopleQuery) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    api.fetch
      .searchCommunityMembers({ q: debouncedPeopleQuery, take: 8 })
      .then((response) => !cancelled && setMatches(response.data ?? []))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [debouncedPeopleQuery]);

  const preview = useMessagePreview({ body, subject: channels.email ? subject : null, kind: "GENERAL" });
  const unknown = preview?.unknownPlaceholders ?? [];
  const segments = Math.max(1, preview?.sms.segments ?? 1);

  /* ---------------------------- validation ---------------------------- */

  const now = Date.now();
  const atTime = at ? new Date(at).getTime() : NaN;
  const atOk = when === "now" || (!Number.isNaN(atTime) && atTime >= now + MIN_LEAD_MS && atTime <= now + MAX_LEAD_MS);
  const chosen = CHANNELS.filter((channel) => channels[channel.key]);
  const missing = [
    !audienceOk && (scope === "DEPARTMENTS" ? "Choose at least one department" : "Add at least one person"),
    !chosen.length && "Choose a channel",
    !title.trim() && "Add a title",
    channels.email && !subject.trim() && "Add an email subject",
    !body.trim() && "Write the message",
    unknown.length > 0 && "Fix unknown placeholders",
    !atOk && "Pick a send time between 5 minutes and 90 days from now",
  ].filter(Boolean) as string[];

  const activePreview = previewChannel && channels[previewChannel] ? previewChannel : chosen[0]?.key ?? null;
  const peopleCount = reach?.people ?? 0;
  const sendLabel = when === "later" ? "Review and schedule" : "Review and send";

  const review = () => {
    if (missing.length) return;
    const parts = chosen.map((channel) => `${nf(reach?.[reachKey[channel.key]] ?? 0)} ${channel.label}`);
    confirmAction({
      title: when === "later" ? "Schedule this message?" : "Send this message now?",
      points: [
        `${nf(peopleCount)} people · ${parts.join(" · ")}`,
        when === "later"
          ? `Goes out ${formatDayTime(at)}. You can cancel it until then.`
          : "It starts sending immediately and can’t be recalled.",
        ...(channels.sms ? [`Uses about ${nf((reach?.sms ?? 0) * segments)} SMS segments.`] : []),
      ],
      confirmLabel: when === "later" ? "Schedule message" : `Send to ${nf(peopleCount)}`,
      cancelLabel: "Back to editing",
      onConfirm: async () => {
        try {
          await api.post.createGeneralMessage({
            title: title.trim(),
            body,
            emailSubject: channels.email ? subject.trim() : null,
            channels,
            audience,
            ...(when === "later" ? { scheduledFor: new Date(at).toISOString() } : {}),
          });
        } catch (error) {
          throw new Error(errorText(error, "The message wasn't sent. Try again."));
        }
        await onSent();
        notify.success(
          when === "later"
            ? {
                title: "Message scheduled",
                message: `Goes to ${nf(peopleCount)} people on ${formatDayTime(at)}. You can cancel it until then.`,
              }
            : { title: "Message is sending", message: `To ${nf(peopleCount)} people. Delivery updates appear in the list.` }
        );
      },
    });
  };

  const close = () => {
    if (title.trim() || body.trim()) {
      confirmAction({
        title: "Discard this message?",
        points: ["Your draft isn’t saved."],
        confirmLabel: "Discard",
        cancelLabel: "Keep editing",
        tone: "danger",
        onConfirm: onClose,
      });
    } else onClose();
  };

  const reachLabel = (key: ChannelKey) => {
    const n = reach?.[reachKey[key]];
    const total = reach?.people;
    if (n === undefined || total === undefined) return audienceOk ? "Counting…" : "Choose who gets it";
    const what = key === "sms" ? "have a phone" : key === "email" ? "have an email" : "use the app";
    return `${nf(n)} of ${nf(total)} ${what}`;
  };

  const sendButton = (
    <button
      type="button"
      onClick={review}
      disabled={missing.length > 0}
      className="min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {sendLabel}
    </button>
  );

  const previewText = preview?.body || body || "Your message appears here.";

  return (
    <PageOutline className={`flex flex-col gap-6 ${phone ? "pb-28" : ""}`}>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={close} className="self-start text-sm text-[#4B5563] hover:text-primary">
          ← Messaging
        </button>
        <h1 className="text-xl font-semibold leading-8 text-primary sm:text-2xl">New message</h1>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
          <Card title="1. Who gets it">
            <PillTabs
              ariaLabel="Audience"
              className="self-start"
              tabs={[
                { key: "CHURCH", label: "Whole church" },
                { key: "DEPARTMENTS", label: "Departments" },
                { key: "PEOPLE", label: "Specific people" },
              ]}
              value={scope}
              onChange={setScope}
            />
            {scope === "CHURCH" && (
              <div className="flex flex-col gap-2 text-sm text-primary">
                <p className="text-[#4B5563]">{baseCounts ? `${nf(baseCounts.members)} active members.` : "All active members."}</p>
                <label className="flex min-h-8 cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={includeGuests} onChange={(event) => setIncludeGuests(event.target.checked)} className="h-4 w-4 accent-primary" />
                  <span>Include guests{baseCounts ? ` (${nf(baseCounts.guests)})` : ""}</span>
                </label>
                <label className="flex min-h-8 cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={includeVisitors} onChange={(event) => setIncludeVisitors(event.target.checked)} className="h-4 w-4 accent-primary" />
                  <span>Include visitors who agreed to be contacted{baseCounts ? ` (${nf(baseCounts.visitors)})` : ""}</span>
                </label>
              </div>
            )}
            {scope === "DEPARTMENTS" && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-2">
                {departments.map((department) => {
                  const on = departmentIds.includes(department.id);
                  return (
                    <label
                      key={department.id}
                      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm text-primary ${on ? "border-primary bg-primary/5" : "border-lightGray bg-white"}`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          setDepartmentIds(on ? departmentIds.filter((id) => id !== department.id) : [...departmentIds, department.id])
                        }
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="flex-1">{department.name}</span>
                      {department.member_count !== undefined && (
                        <span className="text-xs text-[#6B7280]">{nf(department.member_count)} people</span>
                      )}
                    </label>
                  );
                })}
                {departments.length === 0 && <p className="text-sm text-[#6B7280]">Loading departments…</p>}
              </div>
            )}
            {scope === "PEOPLE" && (
              <div className="flex flex-col gap-2">
                <TextInput
                  type="search"
                  value={peopleQuery}
                  onChange={(event) => setPeopleQuery(event.target.value)}
                  placeholder="Search members by name"
                  aria-label="Search members"
                />
                {people.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {people.map((person) => (
                      <span key={person.id} className="inline-flex items-center gap-1 rounded-full bg-primary py-0.5 pl-2.5 pr-1 text-xs font-semibold text-white">
                        {person.name}
                        <button
                          type="button"
                          aria-label={`Remove ${person.name}`}
                          onClick={() => setPeople(people.filter((item) => item.id !== person.id))}
                          className="h-5 w-5 rounded-full"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {matches.filter((match) => !people.some((person) => person.id === match.id)).length > 0 && (
                  <div className="max-h-[200px] overflow-y-auto rounded-lg border border-[#E5E7EB]">
                    {matches
                      .filter((match) => !people.some((person) => person.id === match.id))
                      .map((match) => (
                        <button
                          key={match.id}
                          type="button"
                          onClick={() => {
                            setPeople([...people, match]);
                            setPeopleQuery("");
                          }}
                          className="flex min-h-11 w-full justify-between gap-2 border-b border-[#E5E7EB] bg-white px-3 py-2 text-left text-sm text-primary last:border-b-0 hover:bg-[#F3F4F6]"
                        >
                          <span>{match.name}</span>
                          <span className="text-xs text-[#6B7280]">{match.department ?? ""}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="2. How to send it">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-2">
              {CHANNELS.map((channel) => {
                const on = channels[channel.key];
                return (
                  <button
                    key={channel.key}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => setChannels({ ...channels, [channel.key]: !on })}
                    className={`flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-left text-primary ${on ? "border-primary bg-primary/5" : "border-lightGray bg-white"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border text-[12px] leading-none text-white ${on ? "border-primary bg-primary" : "border-[#9CA3AF] bg-white"}`}
                      >
                        {on ? "✓" : ""}
                      </span>
                      {channel.label}
                    </span>
                    <span className="text-xs text-[#6B7280]">{reachLabel(channel.key)}</span>
                  </button>
                );
              })}
            </div>
            {channels.sms && <FieldHint>SMS is charged per message segment. Long messages use more than one.</FieldHint>}
          </Card>

          <Card title="3. Message">
            <Field label="Title *">
              <TextInput value={title} onChange={(event) => setTitle(event.target.value)} maxLength={150} placeholder="Sunday service moved to 9am" />
              <FieldHint>Only admins see this. It names the message in history and is the in-app notification heading.</FieldHint>
            </Field>
            {channels.email && (
              <Field label="Email subject *">
                <TextInput value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={150} />
              </Field>
            )}
            <div className="flex flex-col gap-1">
              <Field label="Message *">
                <TextArea
                  rows={6}
                  value={body}
                  maxLength={2000}
                  hasError={unknown.length > 0}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Hi {first_name}, …"
                />
              </Field>
              <PlaceholderChips
                chips={GENERAL_CHIPS}
                onAdd={(token) => setBody(appendToken(body, token))}
                counter={`${(preview?.body ?? body).length} characters${channels.sms ? ` · ${segments} SMS each` : ""}`}
              />
              {unknown.length > 0 && (
                <FieldHint tone="error">
                  {unknown.join(", ")} isn’t a placeholder we can fill. Use first name, last name or church name.
                </FieldHint>
              )}
            </div>
          </Card>

          <Card title="4. When">
            <PillTabs
              ariaLabel="When to send"
              className="self-start"
              tabs={[
                { key: "now", label: "Send now" },
                { key: "later", label: "Schedule" },
              ]}
              value={when}
              onChange={(value) => {
                setWhen(value);
                if (value === "later" && !at) {
                  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  tomorrow.setHours(9, 0, 0, 0);
                  setAt(toLocalInput(tomorrow));
                }
              }}
            />
            {when === "later" && (
              <Field label="Date and time" className="max-w-[320px]">
                <TextInput
                  type="datetime-local"
                  value={at}
                  onChange={(event) => setAt(event.target.value)}
                  min={toLocalInput(new Date(now + MIN_LEAD_MS))}
                  max={toLocalInput(new Date(now + MAX_LEAD_MS))}
                  hasError={!atOk}
                />
                <FieldHint tone={atOk ? "muted" : "error"}>
                  {atOk
                    ? `Church time (${timezone}). Between 5 minutes and 90 days from now.`
                    : "Pick a time between 5 minutes and 90 days from now."}
                </FieldHint>
              </Field>
            )}
          </Card>
        </div>

        <aside
          className={`flex min-w-0 flex-[1_1_320px] flex-col gap-4 ${sideBySide ? "sticky top-4 max-w-[400px]" : "max-w-full"}`}
        >
          <section className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-5">
            <h2 className="text-base font-semibold text-primary">Preview</h2>
            {activePreview ? (
              <>
                <PillTabs
                  ariaLabel="Preview channel"
                  size="sm"
                  className="self-start"
                  tabs={chosen.map((channel) => ({ key: channel.key, label: channel.label }))}
                  value={activePreview}
                  onChange={setPreviewChannel}
                />
                <div className="flex min-h-[160px] flex-col gap-2 rounded-2xl bg-[#F3F5FA] p-4 text-sm text-primary">
                  {activePreview === "sms" && (
                    <>
                      <p className="text-center text-xs text-[#6B7280]">WWM · SMS</p>
                      <p className="max-w-[90%] self-start whitespace-pre-wrap rounded-[16px_16px_16px_4px] border border-[#E5E7EB] bg-white px-3 py-2 [text-wrap:pretty]">
                        {previewText}
                      </p>
                    </>
                  )}
                  {activePreview === "email" && (
                    <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
                      <div className="border-b border-[#E5E7EB] px-4 py-3">
                        <p className="text-xs text-[#6B7280]">From {CHURCH_NAME}</p>
                        <p className="font-semibold">{preview?.subject || subject || "(No subject)"}</p>
                      </div>
                      <p className="whitespace-pre-wrap px-4 py-3 [text-wrap:pretty]">{previewText}</p>
                    </div>
                  )}
                  {activePreview === "inApp" && (
                    <div className="flex gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary text-xs font-semibold text-white">W</span>
                      <div className="min-w-0">
                        <p className="font-semibold">{title || "Message title"}</p>
                        <p className="line-clamp-3 text-[#4B5563]">{previewText}</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#6B7280]">Filled in for a sample member.</p>
              </>
            ) : (
              <p className="text-sm text-[#6B7280]">Choose a channel to see how it looks.</p>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-5">
            <h2 className="text-base font-semibold text-primary">Reach</h2>
            <p className="text-2xl font-semibold leading-8 text-primary">{reach ? `${nf(reach.people)} people` : "—"}</p>
            <div className="flex flex-col gap-1 text-sm">
              {chosen.map((channel) => {
                const n = reach?.[reachKey[channel.key]] ?? 0;
                return (
                  <div key={channel.key} className="flex justify-between gap-2">
                    <span className="text-[#4B5563]">{channel.label}</span>
                    <span className="font-semibold text-primary">
                      {nf(n)}
                      {channel.key === "sms" ? ` · ${nf(n * segments)} segments` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            {missing.length > 0 && (
              <div className="flex flex-col gap-1 rounded-lg bg-[#F8F9FC] p-3 text-sm">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Still needed</p>
                {missing.map((item) => (
                  <p key={item} className="text-[#374151]">
                    · {item}
                  </p>
                ))}
              </div>
            )}
            {!phone && sendButton}
          </section>
        </aside>
      </div>

      {phone && (
        <div className="fixed inset-x-0 bottom-0 z-[90] flex items-center gap-3 border-t border-lightGray bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(8,13,45,0.08)]">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">{reach ? `${nf(reach.people)} people` : "—"}</p>
            <p className="truncate text-xs text-[#6B7280]">{missing[0] ?? chosen.map((channel) => channel.label).join(", ")}</p>
          </div>
          {sendButton}
        </div>
      )}
    </PageOutline>
  );
};
