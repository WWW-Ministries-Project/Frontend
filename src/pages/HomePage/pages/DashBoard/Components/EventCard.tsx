import { formatDatefull, formatTime } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { ApiError } from "@/utils/api/errors/ApiError";
import { Modal } from "@/components/Modal";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  ShareIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { eventType } from "../../EventsManagement/utils/eventInterfaces";
import { useCallback, useEffect, useRef, useState } from "react";

interface IProps {
  event: eventType;
  onClose?: () => void;
  handleEventClick?: () => void
  showInModal?: boolean;
}

const resolveEventId = (rawValue: unknown): string | number | null => {
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue !== "string") return null;

  const trimmedValue = rawValue.trim();
  if (!trimmedValue) return null;

  const numericValue = Number(trimmedValue);
  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  return trimmedValue;
};

export const EventCard = ({ event, onClose, handleEventClick, showInModal }: IProps) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileShareMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopShareMenuRef = useRef<HTMLDivElement | null>(null);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isMemberPortal =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/member");
  const canRegisterForEvent = event.requires_registration;

  /* ------------------------------- Date helpers ------------------------------- */
  const getDateOnly = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  const parseUtcFromDateAndTime = (
    isoDate?: string,
    hhmm?: string,
    fallback = "09:00"
  ) => {
    if (!isoDate) return null;
    const dateOnly = getDateOnly(isoDate);
    if (!dateOnly) return null;
    const time = hhmm && /^\d{2}:\d{2}$/.test(hhmm) ? hhmm : fallback;
    const d = new Date(`${dateOnly}T${time}:00Z`);
    return isNaN(d.getTime()) ? null : d;
  };

  const convertToUserTimezone = (isoDate: string, hhmm?: string) => {
    if (!isoDate || !hhmm) return null;
    const d = parseUtcFromDateAndTime(isoDate, hhmm);
    if (!d) return null;
    return d.toLocaleTimeString("en-US", {
      timeZone: userTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getUserTimezoneDate = (isoDate: string, hhmm?: string) => {
    if (!isoDate) return null;
    const d =
      hhmm && /^\d{2}:\d{2}$/.test(hhmm)
        ? parseUtcFromDateAndTime(isoDate, hhmm)
        : new Date(isoDate);
    if (!d || isNaN(d.getTime())) return null;

    return d.toLocaleDateString("en-US", {
      timeZone: userTimezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /* --------------------------------- Calendar -------------------------------- */
  const toIsoNoMs = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
  const formatForGCal = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const getStartEnd = () => {
    const startDateTime =
      parseUtcFromDateAndTime(event.start_date, event.start_time, "09:00") ||
      new Date();

    const endBaseIso = event.end_date || event.start_date;

    const endDateTime = event.end_time
      ? parseUtcFromDateAndTime(endBaseIso, event.end_time)
      : new Date(startDateTime.getTime() + 60 * 60 * 1000);

    return {
      startDateTime,
      endDateTime: endDateTime || new Date(startDateTime.getTime() + 60 * 60 * 1000),
    };
  };

  const generateGoogleCalendarUrl = () => {
    try {
      const { startDateTime, endDateTime } = getStartEnd();
      const base = "https://calendar.google.com/calendar/render";
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event.event_name || "Event",
        dates: `${formatForGCal(startDateTime)}/${formatForGCal(endDateTime)}`,
        details: event.description || "",
        location: event.location || "",
        ctz: userTimezone,
      });
      return `${base}?${params.toString()}`;
    } catch {
      return "#";
    }
  };

  const generateOutlookCalendarUrl = () => {
    try {
      const { startDateTime, endDateTime } = getStartEnd();
      const base = "https://outlook.live.com/calendar/0/deeplink/compose";
      const params = new URLSearchParams({
        rru: "addevent",
        path: "/calendar/action/compose",
        allday: "false",
        subject: event.event_name || "Event",
        body: event.description || "",
        location: event.location || "",
        startdt: toIsoNoMs(startDateTime),
        enddt: toIsoNoMs(endDateTime),
      });
      return `${base}?${params.toString()}`;
    } catch {
      return "#";
    }
  };

  const downloadIcs = () => {
    const { startDateTime, endDateTime } = getStartEnd();
    const dt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//YourApp//Event//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${(window.crypto?.randomUUID?.() || Date.now())}@yourapp`,
      `DTSTAMP:${dt(new Date())}`,
      `DTSTART:${dt(startDateTime)}`,
      `DTEND:${dt(endDateTime)}`,
      `SUMMARY:${(event.event_name || "Event").replace(/\n/g, " ")}`,
      `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
      `LOCATION:${(event.location || "").replace(/\n/g, " ")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(event.event_name || "event").replace(/\s+/g, "-")}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* -------------------------------- Share/Copy -------------------------------- */
  const buildShareMessage = () => {
    const userTimeStr = convertToUserTimezone(event.start_date, event.start_time);
    const userDateStr = getUserTimezoneDate(event.start_date, event.start_time);
    const endTimeStr = convertToUserTimezone(
      event.end_date || event.start_date,
      event.end_time
    );

    let msg = `🎉 *${event.event_name || "Event"}*\n\n`;
    msg += `📅 *Date:* ${userDateStr || formatDatefull(event.start_date)}\n`;

    if (userTimeStr || event.start_time) {
      msg += `🕐 *Time:* ${userTimeStr || formatTime(event.start_time)}`;
      if (endTimeStr || event.end_time) {
        msg += ` - ${endTimeStr || formatTime(event.end_time)}`;
      }
      msg += ` (${
        Intl.DateTimeFormat().resolvedOptions().timeZone
          .split("/")
          .pop()
          ?.replace("_", " ")
      })\n`;
    }

    if (event.location) msg += `📍 *Location:* ${event.location}\n`;
    if (event.description) msg += `\n📝 *Details:* ${event.description}`;
    return msg;
  };

  const handleShareWhatsApp = async () => {
    try {
      const text = buildShareMessage();
      if (navigator.share) {
        await navigator.share({ text, title: event.event_name || "Event" });
        setShowShareMenu(false);
        return;
      }
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
        setShowShareMenu(false);
        return;
      }
      const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      const w = window.open(webUrl, "_blank", "noopener,noreferrer");
      if (!w) window.location.href = webUrl;
      setShowShareMenu(false);
    } catch {
      showNotification("Unable to open WhatsApp. Please try again.", "error");
    }
  };

  const handleRegisterForEvent = useCallback(async () => {
    const eventId = resolveEventId(event.id);

    if (!eventId) {
      showNotification(
        "Unable to register for this event right now.",
        "error",
        "Event registration"
      );
      return;
    }

    setIsRegistrationDialogOpen(false);
    setIsRegistering(true);

    try {
      const response = await api.post.registerEvent({ event_id: eventId });
      const responseRecord =
        response && typeof response === "object"
          ? (response as { data?: unknown })
          : null;
      const payload = responseRecord?.data;
      const payloadRecord =
        payload && typeof payload === "object"
          ? (payload as Record<string, unknown>)
          : null;

      const successMessage =
        (payloadRecord?.message as string) ||
        (payloadRecord?.status as string) ||
        "You are registered for this event.";

      showNotification(successMessage, "success", "Event registration");
    } catch (error) {
      if (error instanceof ApiError) {
        return;
      }

      showNotification(
        error instanceof Error
          ? error.message
          : "Unable to register for this event right now.",
        "error",
        "Event registration"
      );
    } finally {
      setIsRegistering(false);
    }
  }, [event.id]);

  const handleAddToCalendar = (type: "google" | "outlook") => {
    const url =
      type === "google" ? generateGoogleCalendarUrl() : generateOutlookCalendarUrl();
    if (url && url !== "#") {
      const nw = window.open(url, "_blank", "noopener,noreferrer");
      if (!nw) window.location.href = url;
    } else {
      showNotification(
        "Unable to generate calendar link. Please check the event details.",
        "error"
      );
    }
    setShowShareMenu(false);
  };

  const updateMenuPosition = useCallback(() => {
    const trigger = menuButtonRef.current;
    if (!trigger) return;

    const isDesktop = window.matchMedia("(min-width: 640px)").matches;
    if (!isDesktop) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = 256; // Tailwind w-64
    const estimatedMenuHeight = desktopShareMenuRef.current?.offsetHeight || 300;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8;
    const offset = 8;

    let left = triggerRect.right - menuWidth;
    left = Math.max(margin, Math.min(left, viewportWidth - menuWidth - margin));

    const canFitBelow =
      triggerRect.bottom + offset + estimatedMenuHeight <= viewportHeight - margin;
    const top = canFitBelow
      ? triggerRect.bottom + offset
      : Math.max(margin, triggerRect.top - estimatedMenuHeight - offset);

    setMenuPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!showShareMenu) return;

    const rafId = window.requestAnimationFrame(updateMenuPosition);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        mobileShareMenuRef.current?.contains(target) ||
        desktopShareMenuRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return;
      }
      setShowShareMenu(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowShareMenu(false);
    };

    const handleReposition = () => updateMenuPosition();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [showShareMenu, updateMenuPosition]);

  /* ----------------------------- Precomputed text ----------------------------- */
  const userTimeStr = convertToUserTimezone(event.start_date, event.start_time);
  const userEndTimeStr = convertToUserTimezone(
    event.end_date || event.start_date,
    event.end_time
  );

  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-200 overflow-visible shadow-sm sm:hover:shadow-md transition-shadow duration-200
        p-4 sm:p-6
      "
    >
      {/* Top-right actions */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-2 z-10">

        {!showInModal && (
          <button
            onClick={handleEventClick}
            className="p-2 sm:p-2.5 bg-white flex items-center rounded-lg gap-2 hover:shadow-lg transition-shadow duration-200 border border-gray-200 active:scale-95"
            aria-label="Close"
          >
            <ArrowTopRightOnSquareIcon className="h-6 w-6 md:h-4 md:w-4 text-gray-700" /> <p className="hidden md:block">View details</p>
          </button>
        )}
        
          <button
            ref={menuButtonRef}
            onClick={() => setShowShareMenu((prev) => !prev)}
            className="p-2 sm:p-2.5 bg-white flex items-center rounded-lg gap-2  hover:shadow-lg transition-shadow duration-200 border border-gray-200 active:scale-95"
            title="Add to calendar or share"
            aria-haspopup="dialog"
            aria-expanded={showShareMenu}
          >
            
            <EllipsisVerticalIcon className="h-6 w-6 md:h-4 md:w-4 text-gray-700" /> 
          </button>
        
        {showInModal && (
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 bg-white flex items-center rounded-lg gap-2 hover:shadow-lg transition-shadow duration-200 border border-gray-200 active:scale-95"
            aria-label="Close"
            title="Close"
          >
            <XMarkIcon className="h-5 w-5 sm:h-4 sm:w-4 text-gray-700" /> 
          </button>
        )}
      </div>

      {/* Click outside to close (shared mobile/desktop backdrop) */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setShowShareMenu(false)}
          aria-hidden="true"
        />
      )}

      {/* Poster */}
      {showInModal && event.poster && (
        <div className="h-44 sm:h-48 bg-gray-100 relative overflow-hidden rounded-lg mb-3 sm:mb-4">
          <img
            src={event.poster}
            alt={event.event_name || "Event"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2 sm:space-y-2">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 pr-16 truncate" >
            {event?.event_name || "-"}
          </h3>
          {showInModal && event?.description && (
            <p className="  leading-relaxed text-gray-600">
              {event.description}
            </p>
          )}
        </div>

        {/* Meta row: wraps nicely on mobile */}
        <div className="flex flex-col xs:flex-row sm:flex-row gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-h-[28px]">
            <CalendarDaysIcon className="h-5 w-5 text-gray-600 shrink-0" />
            <span className=" text-gray-700">
              {getUserTimezoneDate(event.start_date, event.start_time) ||
                formatDatefull(event.start_date)}
            </span>
          </div>

          

          {(event.start_time || event.end_time) && (
            <>
              <span className="hidden md:inline text-gray-400">|</span>
              <div className="flex items-center gap-2 min-h-[28px]">
                <ClockIcon className="h-5 w-5 text-gray-600 shrink-0" />
                <span className=" text-gray-700">
                  {userTimeStr || (event.start_time ? formatTime(event.start_time) : "")}
                  {(userEndTimeStr || event.end_time) &&
                    ` - ${userEndTimeStr || formatTime(event.end_time)}`}
                  <span className=" text-gray-500 ml-1">
                    ({userTimezone.split("/").pop()?.replace("_", " ")})
                  </span>
                </span>
              </div>
            </>
          )}
        </div>

        {showInModal && event.location && (
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-gray-600 shrink-0" />
            <span className=" text-gray-700">{event.location}</span>
          </div>
        )}

        {canRegisterForEvent && (
          <div>
            <button
              type="button"
              onClick={() => setIsRegistrationDialogOpen(true)}
              disabled={isRegistering}
              className="mt-2 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRegistering ? "Registering..." : "Register"}
            </button>
          </div>
        )}
      </div>

      <Modal
        open={isRegistrationDialogOpen}
        persist={false}
        className="max-w-md"
        onClose={() => setIsRegistrationDialogOpen(false)}
      >
        <div className="p-6">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-primary">
              Confirm event registration
            </h3>
            <p className="text-sm text-primaryGray">
              Register for {event?.event_name || "this event"}?
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-lightGray px-4 py-2 text-sm font-medium text-primaryGray transition-colors hover:bg-gray-50"
              onClick={() => setIsRegistrationDialogOpen(false)}
              disabled={isRegistering}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleRegisterForEvent}
              disabled={isRegistering}
            >
              {isRegistering ? "Registering..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Share/Add menu: bottom sheet on mobile, popover on ≥sm */}
      {showShareMenu && (
        <>
          {/* Bottom sheet (mobile) */}
          <div
            ref={mobileShareMenuRef}
            role="dialog"
            aria-modal="true"
            className="
              fixed sm:hidden z-[70] left-0 right-0 bottom-0
              bg-white rounded-t-2xl shadow-2xl border-t border-gray-200
              p-3 pt-2
            "
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-300 mb-2" />
            <div className="text-center text-xs text-gray-500 font-medium pb-2">
              Add to Calendar
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleAddToCalendar("google")}
                className="w-full px-4 py-3 text-sm font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg active:scale-[.99] flex items-center justify-center gap-2"
              >
                <CalendarDaysIcon className="h-5 w-5" />
                Google Calendar
              </button>
              <button
                onClick={() => handleAddToCalendar("outlook")}
                className="w-full px-4 py-3 text-sm font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg active:scale-[.99] flex items-center justify-center gap-2"
              >
                <CalendarDaysIcon className="h-5 w-5" />
                Outlook Calendar
              </button>
              <button
                onClick={downloadIcs}
                className="w-full px-4 py-3 text-sm font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg active:scale-[.99] flex items-center justify-center gap-2"
              >
                <CalendarDaysIcon className="h-5 w-5" />
                Download .ics
              </button>
            </div>

            <div className="mt-3 text-center text-xs text-gray-500 font-medium border-t border-gray-100 pt-3">
              Share Event
            </div>
            <div className="grid grid-cols-1 gap-2 pb-2">
              <button
                onClick={handleShareWhatsApp}
                className="w-full px-4 py-3 text-sm font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg active:scale-[.99] flex items-center justify-center gap-2"
              >
                <ShareIcon className="h-5 w-5" />
                Share 
              </button>
            </div>

            <button
              onClick={() => setShowShareMenu(false)}
              className="w-full mt-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg active:scale-[.99]"
            >
              Close
            </button>
          </div>

          {/* Popover (desktop/tablet) */}
          <div
            ref={desktopShareMenuRef}
            role="dialog"
            aria-modal="true"
            className="
              hidden sm:block fixed z-[70] bg-white rounded-lg shadow-lg border border-gray-200
              py-2 w-64
            "
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className="px-3 py-1 text-xs text-gray-500 font-medium border-b border-gray-100">
              Add to Calendar
            </div>
            <button
              onClick={() => handleAddToCalendar("google")}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              Google Calendar
            </button>
            <button
              onClick={() => handleAddToCalendar("outlook")}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              Outlook Calendar
            </button>
            <button
              onClick={downloadIcs}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              Download .ics
            </button>

            <div className="px-3 py-1 text-xs text-gray-500 font-medium border-y border-gray-100 mt-1">
              Share Event
            </div>
            <button
              onClick={handleShareWhatsApp}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <ShareIcon className="h-4 w-4" />
              Share on ...
            </button>
          </div>
        </>
      )}
    </div>
  );
};
