import { useEffect, useMemo, type ReactNode } from "react";
import { NavLink, Outlet, useSearchParams } from "react-router-dom";
import type { RideEvent } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { MembersOnlyNotice } from "./components/MembersOnlyNotice";
import {
  DashedEmpty,
  LoadError,
  RideSkeleton,
  SafetyCard,
} from "./components/rideUi";
import { useMyRide } from "./hooks/useMyRide";
import { useRideCatalog } from "./hooks/useRideCatalog";
import type { RidesContext } from "./hooks/useRidesContext";
import {
  EVENT_PARAM,
  clockLabel,
  eventChipLabel,
  eventDateLabel,
  isGuestViewer,
  rideEventOf,
  ridePaths,
  withEvent,
} from "./utils/rideHelpers";

const TABS = [
  { to: ridePaths.find, label: "Find a ride" },
  { to: ridePaths.offer, label: "Offer a ride" },
  { to: ridePaths.mine, label: "My ride" },
];

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto w-full max-w-[1200px] p-4 md:p-6">{children}</div>
);

const readEventId = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

/** Which church event the tabs are about — "Sun 11 Oct · Sunday Service"
 *  chips in one scrolling row; a dot marks events the member already rides
 *  to. Nothing to choose with a single event, so it hides. */
const EventPicker = ({
  events,
  selectedId,
  markedIds,
  onSelect,
}: {
  events: RideEvent[];
  selectedId: number | null;
  markedIds: number[];
  onSelect: (eventId: number) => void;
}) => {
  if (events.length < 2) return null;
  return (
    <div
      role="radiogroup"
      aria-label="Church event"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 tablet:-mx-6 tablet:px-6"
    >
      {events.map((event) => {
        const on = event.id === selectedId;
        const marked = markedIds.includes(event.id);
        return (
          <button
            key={event.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${eventChipLabel(event)}${marked ? ". You have a ride" : ""}`}
            onClick={() => onSelect(event.id)}
            className={cn(
              "inline-flex min-h-[36px] flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm transition-colors",
              on
                ? "border-white bg-white font-semibold text-primary"
                : "border-white/30 text-white/90 hover:bg-white/10"
            )}
          >
            {eventChipLabel(event)}
            {marked ? (
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-green-500"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

/** Shell for every member Ride to church route: the dark header band with
 *  the event picker and the Find / Offer / My ride tabs, and one copy of the
 *  member's ride and the catalog for the selected event (`?event_id=`).
 *  Guests and signed-in non-members get the members-only notice. */
const RidesLayout = () => {
  const guest = isGuestViewer();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramId = readEventId(searchParams.get(EVENT_PARAM));

  const {
    myRide,
    loading: myRideLoading,
    error: myRideError,
    membersOnly: rideMembersOnly,
    refresh: refreshMyRide,
    apply: applyMyRide,
  } = useMyRide({ enabled: !guest, pollWhilePending: true, eventId: paramId });

  // Without an event in the URL, My ride picks one (the soonest the member
  // rides to, else the soonest); the catalog then follows that event.
  const catalogEnabled =
    !guest && (paramId !== null || !myRideLoading || Boolean(myRideError));
  const {
    catalog,
    loading: catalogFetching,
    error: catalogError,
    membersOnly: catalogMembersOnly,
    refresh: refreshCatalog,
  } = useRideCatalog(catalogEnabled, paramId);

  const events = useMemo(
    () => catalog?.events ?? myRide?.events ?? [],
    [catalog, myRide]
  );
  const known = paramId !== null && events.some((row) => row.id === paramId);

  // Put the chosen event in the URL so the tabs share it, and move off an
  // event that has stopped taking rides.
  useEffect(() => {
    if (paramId !== null && (known || !events.length)) return;
    const fallback =
      (paramId === null ? rideEventOf(myRide)?.id : null) ??
      catalog?.event_id ??
      catalog?.event?.id ??
      events[0]?.id ??
      null;
    if (!fallback || fallback === paramId) return;
    const next = new URLSearchParams(searchParams);
    next.set(EVENT_PARAM, String(fallback));
    setSearchParams(next, { replace: true });
  }, [paramId, known, events, myRide, catalog, searchParams, setSearchParams]);

  if (guest || rideMembersOnly || catalogMembersOnly) {
    return (
      <Shell>
        <MembersOnlyNotice />
      </Shell>
    );
  }

  const event = events.find((row) => row.id === paramId) ?? null;
  const eventId = event?.id ?? null;
  const myEventIds = myRide?.my_event_ids ?? [];

  // Only hand the pages answers about the selected event.
  const catalogForEvent =
    catalog && eventId !== null && (catalog.event_id ?? catalog.event?.id) === eventId
      ? catalog
      : null;
  const myRideForEvent =
    myRide && eventId !== null && rideEventOf(myRide)?.id === eventId
      ? myRide
      : null;

  const settledWithoutEvents =
    catalog !== null && !catalogFetching && events.length === 0;

  const selectEvent = (id: number) => {
    const next = new URLSearchParams(searchParams);
    next.set(EVENT_PARAM, String(id));
    setSearchParams(next);
  };

  const context: RidesContext = {
    event,
    events,
    myEventIds,
    myRide: myRideForEvent,
    myRideLoading: !myRideForEvent && !myRideError,
    refreshMyRide,
    applyMyRide,
    catalog: catalogForEvent,
    catalogLoading: !catalogForEvent && !catalogError,
    refreshCatalog,
  };

  const eyebrow = event
    ? [
        eventDateLabel(event),
        event.name,
        event.start_time ? `Starts ${clockLabel(event.start_time)}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <Shell>
      <div className="overflow-hidden rounded-xl border border-lightGray bg-white">
        <div className="bg-primary px-4 pt-5 text-white tablet:px-6">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-4">
            <div className="flex flex-col gap-1">
              {eyebrow ? (
                <span className="text-xs font-semibold uppercase tracking-[0.04em] text-white/80">
                  {eyebrow}
                </span>
              ) : null}
              <h1 className="text-xl font-semibold leading-8 tablet:text-2xl">
                Ride to church
              </h1>
              <p className="text-base text-white/80">
                Share the drive to services and programmes with another member.
                Areas and landmarks only, never your address.
              </p>
            </div>
            <EventPicker
              events={events}
              selectedId={eventId}
              markedIds={myEventIds}
              onSelect={selectEvent}
            />
            {settledWithoutEvents ? null : (
              <nav
                aria-label="Ride to church"
                className="-mb-px flex gap-1 overflow-x-auto"
              >
                {TABS.map((tab) => (
                  <NavLink
                    key={tab.to}
                    to={withEvent(tab.to, eventId)}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-white font-semibold text-primary"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      )
                    }
                  >
                    {tab.label}
                    {tab.to === ridePaths.mine &&
                    eventId !== null &&
                    myEventIds.includes(eventId) ? (
                      <span
                        aria-label="You have a ride"
                        className="h-2 w-2 rounded-full bg-green-600"
                      />
                    ) : null}
                  </NavLink>
                ))}
              </nav>
            )}
            {settledWithoutEvents ? <div className="h-1" /> : null}
          </div>
        </div>
        <div className="px-4 pb-8 pt-6 tablet:px-6">
          {settledWithoutEvents ? (
            <div className="mx-auto max-w-[1120px]">
              <DashedEmpty
                large
                title="No church events are taking rides yet"
                description="Rides open for confirmed services and programmes up to two weeks ahead. Check back closer to the next one."
              />
            </div>
          ) : !event ? (
            <div className="mx-auto max-w-[1120px]">
              {catalogError && !catalogFetching ? (
                <LoadError
                  message="Couldn't load Ride to church. Check your connection and try again."
                  onRetry={() => {
                    void refreshCatalog();
                    void refreshMyRide();
                  }}
                />
              ) : (
                <RideSkeleton rows={3} />
              )}
            </div>
          ) : (
            <Outlet key={event.id} context={context} />
          )}
        </div>
      </div>
    </Shell>
  );
};

/** Main column plus the side column (safety rules, and anything a tab adds
 *  above them). Side-by-side from 1024px, stacked below. */
export const RideColumns = ({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) => (
  <div className="mx-auto grid max-w-[1120px] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
    <div className="flex min-w-0 flex-col gap-6">{children}</div>
    <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4">
      {aside}
      <SafetyCard />
    </aside>
  </div>
);

export default RidesLayout;
