import { formatDatefull, formatTime } from "@/utils";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  XCircleIcon,
  ShareIcon,
  PlusIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { eventType } from "../../EventsManagement/utils/eventInterfaces";
import { useState } from "react";

interface IProps {
  event: eventType;
  onClose?: () => void;
  handleEventClick?: () => void
  showInModal?: boolean;
}

export const EventCard = ({ event, onClose, handleEventClick, showInModal }: IProps) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
      alert("Unable to open WhatsApp. Please try again.");
    }
  };

  const handleAddToCalendar = (type: "google" | "outlook") => {
    const url =
      type === "google" ? generateGoogleCalendarUrl() : generateOutlookCalendarUrl();
    if (url && url !== "#") {
      const nw = window.open(url, "_blank", "noopener,noreferrer");
      if (!nw) window.location.href = url;
    } else {
      alert("Unable to generate calendar link. Please check the event details.");
    }
    setShowShareMenu(false);
  };

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
            <ArrowTopRightOnSquareIcon className="h-6 w-6 sm:h-4 sm:w-4 text-gray-700" /> <p>View details</p>
          </button>
        )}
        
          <button
            onClick={() => setShowShareMenu(true)}
            className="p-2 sm:p-2.5 bg-white flex items-center rounded-lg gap-2  hover:shadow-lg transition-shadow duration-200 border border-gray-200 active:scale-95"
            title="Add to calendar or share"
            aria-haspopup="dialog"
            aria-expanded={showShareMenu}
          >
            
            <ShareIcon className="h-5 w-5 sm:h-4 sm:w-4 text-gray-700" /> 
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

      {/* Click outside to close (for desktop popover) */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
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
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 pr-16" >
            {event.event_name || "Brainstorming session"}
          </h3>
          {showInModal && event.description && (
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
      </div>

      {/* Share/Add menu: bottom sheet on mobile, popover on ≥sm */}
      {showShareMenu && (
        <>
          {/* Bottom sheet (mobile) */}
          <div
            role="dialog"
            aria-modal="true"
            className="
              fixed sm:hidden z-50 left-0 right-0 bottom-0
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
                Share on WhatsApp
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
            role="dialog"
            aria-modal="true"
            className="
              hidden sm:block absolute z-[70] right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200
              py-2 w-64
            "
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
              Share on WhatsApp
            </button>
          </div>
        </>
      )}
    </div>
  );
};
