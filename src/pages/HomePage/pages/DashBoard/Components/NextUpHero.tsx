import { showNotification } from "@/pages/HomePage/utils";
import { ridePaths } from "@/pages/HomePage/pages/Rides/utils/rideHelpers";
import { api } from "@/utils/api/apiCalls";
import { ApiError } from "@/utils/api/errors/ApiError";
import { useState } from "react";
import { Link } from "react-router-dom";
import { eventType } from "../../EventsManagement/utils/eventInterfaces";
import {
  canRegister,
  countdown,
  eventEnd,
  eventName,
  eventStart,
  eventTimeRange,
  eventTypeLabel,
  eventZone,
  googleCalendarUrl,
  monthShort,
  relativeLongDay,
} from "../utils/homeUtils";

const DEFAULT_BANNER =
  "https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg";

const CarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const RegisterButton = ({ event }: { event: eventType }) => {
  const [busy, setBusy] = useState(false);

  const register = async () => {
    setBusy(true);
    try {
      await api.post.registerEvent({ event_id: event.id });
      showNotification("You are registered for this event.", "success", "Event registration");
    } catch (error) {
      // ApiError is already surfaced by the axios interceptors.
      if (!(error instanceof ApiError)) {
        showNotification("Unable to register for this event right now.", "error", "Event registration");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={register}
      disabled={busy}
      className="min-h-[36px] flex-none rounded-lg bg-[#FBBF24] px-3 text-[13px] font-bold text-[#080D2D] hover:bg-[#FCD34D] disabled:opacity-60"
    >
      {busy ? "Registering…" : "Register"}
    </button>
  );
};

export const NextUpHero = ({
  events,
  showRides,
  bannerImage,
}: {
  /** Upcoming events, soonest first. The first is featured. */
  events: eventType[];
  showRides: boolean;
  bannerImage?: string;
}) => {
  const [next, ...rest] = events;
  const coming = rest.slice(0, 2);
  const now = new Date();

  const start = next ? eventStart(next) : null;
  const end = next ? eventEnd(next) : null;
  const ongoing = !!start && start <= now && (!end || end >= now);
  const type = next ? eventTypeLabel(next) : "";
  const zone = next ? eventZone(next) : "";
  const time = next ? eventTimeRange(next) : "";
  const when = next
    ? [
        start ? relativeLongDay(start, now) : "",
        time ? `${time}${zone ? ` (${zone})` : ""}` : "",
        next.location || "",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const addToCalendar = () => {
    const url = next ? googleCalendarUrl(next) : null;
    if (!url) {
      showNotification("Unable to generate calendar link. Please check the event details.", "error");
      return;
    }
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) window.location.href = url;
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-[#080D2D] bg-cover bg-center bg-no-repeat text-[#fff]"
      style={{ backgroundImage: `url('${bannerImage || DEFAULT_BANNER}')` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,45,0.95)_0%,rgba(8,13,45,0.8)_55%,rgba(8,13,45,0.55)_100%)]" />
      <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-[clamp(20px,3vw,32px)] p-[clamp(20px,3vw,32px)]">
        <div className="flex min-w-0 flex-col gap-4">
          {next ? (
            <>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBBF24] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.04em] text-[#080D2D]">
                  {ongoing ? "Happening now" : `Next up · ${start ? countdown(start, now) : "soon"}`}
                </span>
                {type && (
                  <span className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.3)] px-2.5 py-1 text-xs font-semibold">
                    {type}
                  </span>
                )}
              </div>
              <h2 className="text-[clamp(26px,4.5vw,36px)] font-bold leading-[1.2] [text-wrap:pretty]">
                {eventName(next)}
              </h2>
              {when && <p className="text-base leading-6 text-[#E5E7EB]">{when}</p>}
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addToCalendar}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#fff] px-[18px] text-sm font-semibold text-[#080D2D] hover:bg-[#F3F4F6]"
                >
                  Add to calendar
                </button>
                {showRides && (
                  <>
                    <Link
                      to={ridePaths.find}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.4)] px-[18px] text-sm font-semibold text-[#fff] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#fff] hover:no-underline"
                    >
                      <CarIcon />
                      Get a ride
                    </Link>
                    <Link
                      to={ridePaths.offer}
                      className="inline-flex min-h-[44px] items-center px-[18px] text-sm font-semibold text-[#FDE68A] hover:text-[#FDE68A] hover:underline"
                    >
                      Offer a ride
                    </Link>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[clamp(26px,4.5vw,36px)] font-bold leading-[1.2]">
                No upcoming events
              </h2>
              <p className="text-base leading-6 text-[#E5E7EB]">
                Check back soon. Upcoming services and programs will appear here.
              </p>
            </>
          )}
        </div>

        {coming.length > 0 && (
          <div className="flex min-w-0 flex-col gap-3 self-end">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#CBD5E1]">
              Coming up
            </p>
            {coming.map((event) => {
              const s = eventStart(event);
              const meta = [
                s ? s.toLocaleDateString("en-US", { weekday: "short" }) : "",
                eventTimeRange(event),
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3.5 rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.1)] px-3.5 py-3 backdrop-blur-[4px]"
                >
                  <div className="flex w-11 flex-none flex-col items-center">
                    <span className="text-[11px] font-bold tracking-[0.06em] text-[#FBBF24]">
                      {s ? monthShort(s) : ""}
                    </span>
                    <span className="text-[22px] font-bold leading-[26px]">{s ? s.getDate() : ""}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{eventName(event)}</p>
                    {meta && <p className="text-[13px] text-[#CBD5E1]">{meta}</p>}
                  </div>
                  {canRegister(event, now) && <RegisterButton event={event} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
