import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import emptyStateImage from "@/assets/emptyState.svg";
import ChurchLogo from "@/components/ChurchLogo";
import { FieldMessage, InlineAlert, notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";
import { ApiError } from "@/utils/api/errors/ApiError";
import type {
  EventResponseType,
  PublicEventRegistrationPayload,
  ValidatedEventMember,
} from "@/utils/api/events/interfaces";
import { cn } from "@/utils/cn";
import { relativePath } from "@/utils/const";

type Audience = "member" | "guest";
type LookupState = "idle" | "loading" | "found" | "error";
type Tone = "success" | "warning" | "danger" | "info" | "neutral";

type GuestForm = { name: string; phone: string; email: string; location: string };
type GuestErrors = Partial<Record<keyof GuestForm, string>>;

type Registration = {
  name: string;
  isMember: boolean;
  phone: string | null;
  reference: string | null;
};

const EMPTY_GUEST: GuestForm = { name: "", phone: "", email: "", location: "" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ICONS = {
  calendar:
    "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
  clock: "M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
};

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success/30 bg-success/5 text-success",
  warning: "border-warning/30 bg-warning/5 text-warning",
  danger: "border-error/25 bg-error/5 text-error",
  info: "border-info/30 bg-info/5 text-info",
  neutral: "border-gray-200 bg-gray-100 text-gray-700",
};

const BUTTON_PRIMARY =
  "inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";
const BUTTON_SECONDARY =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";
const BUTTON_LINK =
  "min-h-10 text-sm text-primaryGray underline underline-offset-2 hover:text-primary";
const INPUT =
  "h-10 w-full min-w-0 rounded-lg border bg-white px-3 text-sm text-primary outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10";

// "2026-11-14T00:00:00.000Z" or "2026-11-14" → a UTC midnight Date for that calendar day.
const toDay = (value?: string | null) =>
  value ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : null;

const formatDay = (date: Date) =>
  `${DAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;

const formatTime = (time?: string | null) => {
  if (!time) return "";
  const [rawHours, minutes = 0] = time.split(":").map(Number);
  if (Number.isNaN(rawHours)) return time;
  const suffix = rawHours >= 12 ? "pm" : "am";
  const hours = rawHours % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

const todayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / 864e5);

const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  return `${digits.slice(0, 3)} ••• ${digits.slice(-4)}`;
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const eventTypeLabel = (type?: string | null) => {
  if (!type || type.toLowerCase() === "other") return "Event";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

// Guest phone numbers are Ghanaian: 9 digits after the +233 prefix (or a leading 0).
const nationalDigits = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "");

const validateGuest = (guest: GuestForm): GuestErrors => {
  const errors: GuestErrors = {};
  if (guest.name.trim().split(/\s+/).filter(Boolean).length < 2)
    errors.name = "Enter your first and last name.";
  if (nationalDigits(guest.phone).length !== 9)
    errors.phone = "Enter a 10-digit number, e.g. 024 555 0142.";
  if (!guest.email.trim()) errors.email = "Enter your email address.";
  else if (!/^\S+@\S+\.\S+$/.test(guest.email.trim())) errors.email = "Check the email address.";
  if (!guest.location.trim()) errors.location = "Tell us which town or area you’re coming from.";
  return errors;
};

const icsEscape = (value: string) => value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

const downloadCalendarFile = (event: EventResponseType, name: string) => {
  const day = (value?: string | null) => (value ?? "").slice(0, 10).replace(/-/g, "");
  const time = (value?: string | null) => `${(value || "00:00").replace(":", "").slice(0, 4)}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Worldwide Word Ministries//Events//EN",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@worldwidewordministries.org`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${day(event.start_date)}T${time(event.start_time)}`,
    `DTEND:${day(event.end_date || event.start_date)}T${time(event.end_time || event.start_time)}`,
    `SUMMARY:${icsEscape(name)}`,
    event.location ? `LOCATION:${icsEscape(event.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name.replace(/\W+/g, "-").toLowerCase() || "event"}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const Pill = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      TONE_CLASSES[tone]
    )}
  >
    {children}
  </span>
);

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-lg bg-gray-200", className)} />
);

const EventRegister = () => {
  const { search } = useLocation();
  const lookupQuery = useMemo((): { token: string } | { event_id: string } | null => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    const eventId = params.get("event_id");
    if (token) return { token };
    if (eventId) return { event_id: eventId };
    return null;
  }, [search]);

  const [event, setEvent] = useState<EventResponseType | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [audience, setAudience] = useState<Audience | null>(null);

  const [memberQuery, setMemberQuery] = useState("");
  const [lookup, setLookup] = useState<LookupState>("idle");
  const [lookupError, setLookupError] = useState("");
  const [member, setMember] = useState<ValidatedEventMember | null>(null);

  const [guest, setGuest] = useState<GuestForm>(EMPTY_GUEST);
  const [triedGuestSubmit, setTriedGuestSubmit] = useState(false);

  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [extraRegistrations, setExtraRegistrations] = useState(0);

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lookupQuery) {
      setLoadingEvent(false);
      return;
    }
    let cancelled = false;
    setLoadingEvent(true);
    api.fetch
      .fetchPublicEventById(lookupQuery)
      .then((response) => {
        if (!cancelled) setEvent(response.data);
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingEvent(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lookupQuery]);

  const eventName = event?.name || event?.event_name || "Event";
  const membersOnly = event?.registration_audience === "MEMBERS_ONLY";
  const mode: Audience = audience ?? "member";

  const derived = useMemo(() => {
    if (!event) return null;
    const startDay = toDay(event.start_date);
    const endDay = toDay(event.end_date) ?? startDay;
    const multiDay = !!startDay && !!endDay && startDay.getTime() !== endDay.getTime();
    const dateLabel = !startDay
      ? "Date to be announced"
      : multiDay && endDay
        ? `${formatDay(startDay)} – ${formatDay(endDay)} ${endDay.getUTCFullYear()}`
        : `${formatDay(startDay)} ${startDay.getUTCFullYear()}`;
    const timeLabel = event.start_time
      ? `${formatTime(event.start_time)}${event.end_time ? ` – ${formatTime(event.end_time)}` : ""}`
      : "Time to be announced";

    const requires = !!event.requires_registration;
    const capacity = event.registration_capacity || null;
    const count = Math.min(
      capacity ?? Number.MAX_SAFE_INTEGER,
      (event.registration_count ?? 0) + extraRegistrations
    );
    const spotsLeft = capacity ? Math.max(capacity - count, 0) : null;
    const closesDay = toDay(event.registration_end_date);
    const daysLeft = closesDay ? daysBetween(todayUtc(), closesDay) : null;

    const full = requires && spotsLeft !== null && spotsLeft <= 0;
    // Trust the server's verdict; tell "full" and "closed" apart from the numbers.
    const closed =
      requires &&
      !full &&
      ((daysLeft !== null && daysLeft < 0) || event.registration_open === false);

    let status: { label: string; tone: Tone } = { label: "Registration open", tone: "success" };
    if (!requires) status = { label: "No registration needed", tone: "info" };
    else if (closed) status = { label: "Registration closed", tone: "neutral" };
    else if (full) status = { label: "Fully booked", tone: "danger" };
    else if (spotsLeft !== null && spotsLeft <= 10)
      status = {
        label: `Only ${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`,
        tone: "warning",
      };
    else if (daysLeft !== null && daysLeft <= 3) status = { label: "Closes soon", tone: "warning" };

    return {
      multiDay,
      dateLabel,
      timeLabel,
      requires,
      capacity,
      count,
      spotsLeft,
      closesDay,
      daysLeft,
      full,
      closed,
      status,
    };
  }, [event, extraRegistrations]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: eventName, url });
      } catch {
        // Dismissing the share sheet is not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      notify.success({ title: "Link copied", message: "Paste it in WhatsApp or a text." });
    } catch {
      notify.error({
        title: "Couldn’t copy the link",
        message: "Copy the address from your browser’s address bar instead.",
      });
    }
  };

  const addToCalendar = () => {
    if (event) downloadCalendarFile(event, eventName);
  };

  const pickAudience = (next: Audience) => {
    if (next === "guest" && membersOnly) {
      notify.info({
        title: "Members only",
        message: "Register with your member ID or phone number.",
      });
      return;
    }
    setAudience(next);
    setTriedGuestSubmit(false);
    setSubmitError("");
  };

  const memberCredentials = (value: string) => {
    const trimmed = value.trim();
    // Anything with letters is a member ID; digits alone could be either, so send both.
    return /[a-z]/i.test(trimmed)
      ? { member_id: trimmed }
      : { member_id: trimmed, phone_number: trimmed };
  };

  const findMember = async () => {
    if (!lookupQuery || lookup === "loading") return;
    const value = memberQuery.trim();
    if (!value) {
      setLookup("error");
      setLookupError("Enter your member ID or phone number.");
      return;
    }
    setLookup("loading");
    setLookupError("");
    try {
      const response = await api.post.validatePublicEventMember({
        ...lookupQuery,
        ...memberCredentials(value),
      });
      setMember(response.data);
      setLookup("found");
    } catch (error) {
      setMember(null);
      setLookup("error");
      setLookupError(
        error instanceof ApiError && error.statusCode === 404
          ? "We couldn’t find a member with those details. Check for typos, or register as a guest."
          : error instanceof Error
            ? error.message
            : "Couldn’t check your membership. Try again in a moment."
      );
    }
  };

  const resetMember = () => {
    setMember(null);
    setMemberQuery("");
    setLookup("idle");
    setLookupError("");
  };

  const guestErrors = triedGuestSubmit ? validateGuest(guest) : {};

  const submit = async () => {
    if (!lookupQuery || sending) return;

    if (mode === "member" && (lookup !== "found" || !member)) {
      setLookup("error");
      setLookupError(
        memberQuery.trim()
          ? "Tap “Find me” to confirm your membership first."
          : "Enter your member ID or phone number."
      );
      return;
    }
    if (mode === "guest" && Object.keys(validateGuest(guest)).length) {
      setTriedGuestSubmit(true);
      return;
    }

    const payload: PublicEventRegistrationPayload =
      mode === "member"
        ? { ...lookupQuery, is_member: true, ...memberCredentials(memberQuery) }
        : {
            ...lookupQuery,
            is_member: false,
            name: guest.name.trim(),
            email: guest.email.trim(),
            phone_number: `+233${nationalDigits(guest.phone)}`,
            location: guest.location.trim(),
          };

    setSending(true);
    setSubmitError("");
    try {
      const response = await api.post.publicRegisterEvent(payload);
      const record = (response.data as { registration?: { id?: number } } | null)?.registration;
      setRegistration({
        name: mode === "member" && member ? member.name : guest.name.trim(),
        isMember: mode === "member",
        phone: mode === "member" ? (member?.phone_number ?? null) : null,
        reference: record?.id ? `EV-${record.id}` : null,
      });
      setExtraRegistrations((count) => count + 1);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setSubmitError(
        /already registered/i.test(message)
          ? mode === "member"
            ? "You’re already registered for this event. Give your name at the welcome desk."
            : "That email is already registered for this event. Use a different email to register someone else."
          : message || "Couldn’t complete your registration. Try again in a moment."
      );
    } finally {
      setSending(false);
    }
  };

  const registerAnother = () => {
    setRegistration(null);
    resetMember();
    setGuest(EMPTY_GUEST);
    setTriedGuestSubmit(false);
    setSubmitError("");
  };

  const header = (
    <header className="border-b border-lightGray bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 tablet:px-6 tablet:py-3">
        <Link to={relativePath.login} aria-label="Worldwide Word Ministries home">
          <ChurchLogo className="tablet:hidden" />
          <ChurchLogo show className="hidden tablet:flex" />
        </Link>
        <Link to={relativePath.login} className={BUTTON_SECONDARY}>
          Member login
        </Link>
      </div>
    </header>
  );

  const footer = (
    <footer className="border-t border-lightGray bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-x-4 gap-y-2 px-4 py-4 text-xs text-gray-500 tablet:px-6">
        <span>© {new Date().getFullYear()} Worldwide Word Ministries</span>
      </div>
    </footer>
  );

  let body: ReactNode;

  if (loadingEvent) {
    body = (
      <main
        aria-busy="true"
        aria-label="Loading event"
        className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 pb-8 pt-4 tablet:px-6 tablet:pb-10 tablet:pt-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-12 lg:pt-8"
      >
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-video rounded-2xl" />
          <Skeleton className="h-8 w-[70%]" />
          <Skeleton className="h-5 w-[45%]" />
        </div>
        <div className="h-[360px] rounded-2xl border border-lightGray bg-white" />
      </main>
    );
  } else if (!event || !derived) {
    body = (
      <main className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="flex max-w-[420px] flex-col items-center gap-3 text-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-3xl border border-lightGray bg-white">
            <img src={emptyStateImage} alt="" className="w-24" />
          </div>
          <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
            Link not found
          </span>
          <h1 className="text-2xl font-semibold text-primary">We couldn’t find this event</h1>
          <p className="text-pretty text-base text-primaryGray">
            The registration link may be incomplete or the event may have been removed. Check the
            link you were sent, or sign in to see upcoming events.
          </p>
          <Link to={relativePath.login} className={cn(BUTTON_PRIMARY, "mt-2 px-5")}>
            Sign in to see events
          </Link>
        </div>
      </main>
    );
  } else {
    const { status, requires, capacity, count, spotsLeft, closesDay, daysLeft, full, closed } =
      derived;

    let blocked: {
      pill: string;
      tone: Tone;
      title: string;
      body: string;
      calendar: boolean;
    } | null = null;
    if (!registration) {
      if (!requires)
        blocked = {
          pill: "Open to everyone",
          tone: "info",
          title: "Just come along",
          body: "You don’t need to register for this event. Add it to your calendar so you don’t miss it.",
          calendar: true,
        };
      else if (closed)
        blocked = {
          pill: closesDay ? `Closed ${formatDay(closesDay)}` : "Closed",
          tone: "neutral",
          title: "Registration has closed",
          body: "We’re no longer taking registrations for this event. Message the church office if you still need a place.",
          calendar: false,
        };
      else if (full)
        blocked = {
          pill: `All ${capacity} spots taken`,
          tone: "danger",
          title: "This event is fully booked",
          body: "Every place has been taken. Message the church office to ask about cancellations.",
          calendar: false,
        };
    }

    const showCapacity = requires && !!capacity && !registration && !closed;
    const capacityPct = capacity ? Math.round((count / capacity) * 100) : 0;
    const facts = [
      { label: derived.multiDay ? "Dates" : "Date", value: derived.dateLabel, icon: ICONS.calendar },
      {
        label: derived.multiDay ? "Time, each day" : "Time",
        value: derived.timeLabel,
        icon: ICONS.clock,
      },
      ...(event.location
        ? [
            {
              label: "Venue",
              value: event.location,
              icon: ICONS.pin,
              href: `https://maps.google.com/?q=${encodeURIComponent(event.location)}`,
            },
          ]
        : []),
    ];

    const tabs: { key: Audience; label: string; disabled: boolean }[] = [
      { key: "member", label: "I’m a member", disabled: false },
      {
        key: "guest",
        label: membersOnly ? "Guests (members only)" : "I’m a guest",
        disabled: membersOnly,
      },
    ];

    const memberFound = lookup === "found" && !!member;
    const cantSubmit = mode === "member" && !memberFound;
    const submitLabel = sending
      ? "Registering…"
      : mode === "member" && memberFound && member
        ? `Register as ${member.name.split(" ")[0]}`
        : "Register";

    const guestFields: {
      key: keyof GuestForm;
      label: string;
      type: string;
      autoComplete: string;
      inputMode: "text" | "tel" | "email";
      placeholder: string;
      wide?: boolean;
    }[] = [
      {
        key: "name",
        label: "Full name",
        type: "text",
        autoComplete: "name",
        inputMode: "text",
        placeholder: "e.g. Kofi Mensah",
        wide: true,
      },
      {
        key: "phone",
        label: "Phone number",
        type: "tel",
        autoComplete: "tel-national",
        inputMode: "tel",
        placeholder: "024 555 0142",
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        autoComplete: "email",
        inputMode: "email",
        placeholder: "you@example.com",
      },
      {
        key: "location",
        label: "Town or area",
        type: "text",
        autoComplete: "address-level2",
        inputMode: "text",
        placeholder: "e.g. East Legon",
        wide: true,
      },
    ];

    body = (
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-x-8 gap-y-6 px-4 pb-8 pt-4 [grid-template-areas:'hero'_'form'_'about'] tablet:px-6 tablet:pb-10 tablet:pt-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-y-8 lg:pb-12 lg:pt-8 lg:[grid-template-areas:'hero_form'_'about_form']">
        <section className="flex min-w-0 flex-col gap-4 [grid-area:hero] tablet:gap-5">
          <div className="relative aspect-[2/1] max-h-[200px] w-full overflow-hidden rounded-2xl bg-gray-200 tablet:aspect-[21/9] tablet:max-h-[280px] lg:aspect-video lg:max-h-none">
            {event.poster ? (
              <img
                src={event.poster}
                alt={`${eventName} poster`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 p-6 text-center text-xl font-semibold text-white">
                {eventName}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Pill tone="neutral">{eventTypeLabel(event.event_type)}</Pill>
              <Pill tone={status.tone}>{status.label}</Pill>
            </div>
            <h1 className="text-balance text-2xl font-semibold text-primary tablet:text-[32px] tablet:leading-10">
              {eventName}
            </h1>
          </div>

          <ul className="grid gap-3 tablet:grid-cols-3 lg:grid-cols-1">
            {facts.map((fact) => (
              <li key={fact.label} className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-lightGray bg-white">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                    aria-hidden="true"
                  >
                    <path d={fact.icon} />
                  </svg>
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs text-gray-500">{fact.label}</span>
                  <span className="break-words text-sm font-medium text-primary">
                    {fact.value}
                  </span>
                  {"href" in fact && fact.href ? (
                    <a
                      href={fact.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primaryGray underline underline-offset-2 hover:text-primary"
                    >
                      Get directions
                    </a>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside
          id="register"
          className="min-w-0 [grid-area:form] lg:sticky lg:top-6"
          aria-label="Registration"
        >
          <div className="overflow-hidden rounded-2xl border border-lightGray bg-white shadow-[0_8px_24px_rgba(8,13,45,0.08)]">
            {showCapacity && capacity && spotsLeft !== null ? (
              <div className="flex flex-col gap-2 border-b border-gray-200 bg-[#F8F9FC] px-5 py-4">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-semibold text-primary">
                    {spotsLeft === 1 ? "1 spot left" : `${spotsLeft} spots left`}
                  </span>
                  <span className="text-primaryGray">
                    {count} of {capacity} taken
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={capacityPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Spots taken"
                  className="h-2 overflow-hidden rounded-full bg-gray-200"
                >
                  <div
                    className={cn(
                      "h-full rounded-full",
                      spotsLeft <= 10 ? "bg-warning" : "bg-primary"
                    )}
                    style={{ width: `${capacityPct}%` }}
                  />
                </div>
                {closesDay && daysLeft !== null ? (
                  <span className="text-xs text-primaryGray">
                    {daysLeft === 0
                      ? "Registration closes today"
                      : `Registration closes ${formatDay(closesDay)} · ${daysLeft} ${
                          daysLeft === 1 ? "day" : "days"
                        } left`}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-5 p-4 tablet:p-6">
              {blocked ? (
                <div className="flex flex-col gap-3">
                  <span className="self-start">
                    <Pill tone={blocked.tone}>{blocked.pill}</Pill>
                  </span>
                  <h2 className="text-xl font-semibold text-primary">{blocked.title}</h2>
                  <p className="text-pretty text-sm text-primaryGray">{blocked.body}</p>
                  <div className="flex flex-wrap gap-2">
                    {blocked.calendar ? (
                      <button type="button" onClick={addToCalendar} className={BUTTON_PRIMARY}>
                        Add to calendar
                      </button>
                    ) : null}
                    <button type="button" onClick={share} className={BUTTON_SECONDARY}>
                      Share event
                    </button>
                  </div>
                </div>
              ) : null}

              {registration ? (
                <div className="flex flex-col gap-4" role="status">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-success/30 bg-success/5 text-success">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-primary">
                      You’re registered, {registration.name.split(" ")[0]}
                    </h2>
                    <p className="text-pretty text-sm text-primaryGray">
                      {registration.isMember && registration.phone
                        ? `We’ve sent a confirmation text to ${maskPhone(
                            registration.phone
                          )}. Show it, or just give your name, at the welcome desk.`
                        : "Give your name at the welcome desk when you arrive."}
                    </p>
                  </div>
                  <dl className="m-0 overflow-hidden rounded-lg border border-gray-200">
                    {[
                      ["Event", eventName],
                      ["When", `${derived.dateLabel}${event.start_time ? `, ${formatTime(event.start_time)}` : ""}`],
                      ...(event.location ? [["Where", event.location]] : []),
                      ...(registration.reference ? [["Reference", registration.reference]] : []),
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between gap-4 border-b border-gray-200 px-3.5 py-2.5 text-sm last:border-b-0"
                      >
                        <dt className="text-gray-500">{label}</dt>
                        <dd className="m-0 break-words text-right font-medium text-primary">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
                    <button type="button" onClick={addToCalendar} className={BUTTON_PRIMARY}>
                      Add to calendar
                    </button>
                    <button type="button" onClick={share} className={BUTTON_SECONDARY}>
                      Invite a friend
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={registerAnother}
                    className={cn(BUTTON_LINK, "self-start")}
                  >
                    Register someone else
                  </button>
                </div>
              ) : null}

              {!blocked && !registration ? (
                <>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-primary">Register</h2>
                    <p className="text-sm text-primaryGray">Free · takes under a minute</p>
                  </div>

                  <div
                    role="tablist"
                    aria-label="Who is registering"
                    className="grid grid-cols-2 gap-1 rounded-lg border border-lightGray bg-lightGray/30 p-1"
                  >
                    {tabs.map((tab) => {
                      const active = mode === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          aria-disabled={tab.disabled}
                          onClick={() => pickAudience(tab.key)}
                          className={cn(
                            "min-h-9 rounded-md px-3 py-1.5 text-sm",
                            active
                              ? "bg-white font-semibold text-primary shadow-sm"
                              : "bg-transparent text-primary",
                            tab.disabled && "cursor-not-allowed text-gray-500"
                          )}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {mode === "member" ? (
                    memberFound && member ? (
                      <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                          {initialsOf(member.name)}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-sm font-semibold text-primary">{member.name}</span>
                          <span className="break-words text-xs text-primaryGray">
                            {[member.member_id, member.phone_number && maskPhone(member.phone_number)]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={resetMember}
                          className={cn(BUTTON_LINK, "flex-shrink-0 px-2")}
                        >
                          Not you?
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <label htmlFor="member-lookup" className="text-sm font-medium text-primary">
                          Member ID or phone number
                        </label>
                        <div className="flex flex-wrap gap-2 tablet:flex-nowrap">
                          <input
                            id="member-lookup"
                            type="text"
                            autoComplete="tel"
                            value={memberQuery}
                            onChange={(e) => {
                              setMemberQuery(e.target.value);
                              if (lookup === "error") {
                                setLookup("idle");
                                setLookupError("");
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void findMember();
                              }
                            }}
                            placeholder="e.g. WWM-10234 or 024 555 0142"
                            aria-invalid={lookup === "error"}
                            aria-describedby="member-lookup-help"
                            className={cn(
                              INPUT,
                              "flex-[1_1_200px]",
                              lookup === "error" ? "border-error" : "border-gray-500/35"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => void findMember()}
                            disabled={lookup === "loading"}
                            className={cn(
                              BUTTON_SECONDARY,
                              "basis-full tablet:basis-auto disabled:opacity-60"
                            )}
                          >
                            {lookup === "loading" ? "Finding…" : "Find me"}
                          </button>
                        </div>
                        {lookup === "error" && lookupError ? (
                          <FieldMessage>
                            <span role="alert">{lookupError}</span>
                          </FieldMessage>
                        ) : null}
                        <FieldMessage tone="hint" id="member-lookup-help">
                          We’ll fill in your details from your membership record.
                        </FieldMessage>
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
                      {guestFields.map((field) => {
                        const error = guestErrors[field.key];
                        const inputId = `guest-${field.key}`;
                        return (
                          <div
                            key={field.key}
                            className={cn("flex flex-col gap-1", field.wide && "col-span-full")}
                          >
                            <label htmlFor={inputId} className="text-sm font-medium text-primary">
                              {field.label}
                            </label>
                            <div className="flex">
                              {field.key === "phone" ? (
                                <span className="flex h-10 flex-shrink-0 items-center rounded-l-lg border border-r-0 border-lightGray bg-lightGray/30 px-3 text-sm text-primaryGray">
                                  +233
                                </span>
                              ) : null}
                              <input
                                id={inputId}
                                type={field.type}
                                autoComplete={field.autoComplete}
                                inputMode={field.inputMode}
                                value={guest[field.key]}
                                onChange={(e) =>
                                  setGuest((current) => ({
                                    ...current,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                placeholder={field.placeholder}
                                aria-invalid={!!error}
                                aria-describedby={error ? `${inputId}-error` : undefined}
                                className={cn(
                                  INPUT,
                                  field.key === "phone" && "rounded-l-none",
                                  error ? "border-error" : "border-gray-500/35"
                                )}
                              />
                            </div>
                            {error ? <FieldMessage id={`${inputId}-error`}>{error}</FieldMessage> : null}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {submitError ? <InlineAlert tone="error">{submitError}</InlineAlert> : null}

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => void submit()}
                      aria-disabled={cantSubmit || sending}
                      className={cn(
                        BUTTON_PRIMARY,
                        "min-h-11 w-full px-5 text-base",
                        (cantSubmit || sending) && "opacity-60"
                      )}
                    >
                      {submitLabel}
                    </button>
                    <p className="text-pretty text-center text-xs text-gray-500">
                      {mode === "member"
                        ? "We’ll text your confirmation to the number on your record."
                        : "We only use your details for this event."}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </aside>

        {event.description ? (
          <section className="flex min-w-0 flex-col gap-3 border-t border-lightGray pt-2 [grid-area:about] lg:border-t-0 lg:pt-0">
            <h2 className="text-base font-semibold text-primary">About this event</h2>
            <p className="max-w-[640px] whitespace-pre-line text-pretty text-base text-primaryGray">
              {event.description}
            </p>
          </section>
        ) : null}
      </main>
    );
  }

  return (
    <div ref={topRef} className="flex min-h-screen flex-col bg-[#F3F5FA] font-sans text-primary">
      {header}
      {body}
      {footer}
    </div>
  );
};

export default EventRegister;
