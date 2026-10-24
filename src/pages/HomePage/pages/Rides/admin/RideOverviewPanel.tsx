import { useMemo, useState } from "react";
import type {
  AdminRideOffer,
  AdminRideOverview,
  RideEvent,
  RideRequestStatus,
} from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import {
  Avatar,
  LoadError,
  Pill,
  type PillTone,
  RideSkeleton,
  SearchField,
  SeatBar,
  Segmented,
} from "../components/rideUi";
import {
  btnDangerGhost,
  listCard,
} from "../components/rideClasses";
import { clockLabel, initialsOf, plural } from "../utils/rideHelpers";
import { PhoneLink } from "./AdminRideShared";
import { formatWhen } from "./adminRideFormat";
import { CancelRideModal } from "./AdminRideModals";

type RideFilter = "all" | "pending" | "full" | "cancelled";

const FILTERS: { value: RideFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Needs reply" },
  { value: "full", label: "Full" },
  { value: "cancelled", label: "Cancelled" },
];

const REQUEST_PILL: Record<
  RideRequestStatus,
  { label: string; tone: PillTone }
> = {
  PENDING: { label: "Pending", tone: "warning" },
  ACCEPTED: { label: "Accepted", tone: "success" },
  DECLINED: { label: "Declined", tone: "danger" },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

const REQUEST_ORDER: Record<RideRequestStatus, number> = {
  ACCEPTED: 0,
  PENDING: 1,
  DECLINED: 2,
  WITHDRAWN: 3,
  CANCELLED: 4,
};

const normalize = (value: string | null | undefined) =>
  String(value ?? "").toLowerCase();

/** Does this ride involve the search term — driver, passenger, phone, area
 *  or landmark? */
const rideMatches = (offer: AdminRideOffer, query: string) => {
  if (!query) return true;
  return [
    offer.driver.name,
    offer.driver.phone,
    offer.area.name,
    offer.event?.name,
    offer.car_details,
    ...offer.stops.map((stop) => stop.name),
    ...offer.requests.flatMap((request) => [
      request.passenger.name,
      request.passenger.phone,
      request.pickup_point.name,
    ]),
  ].some((value) => normalize(value).includes(query));
};

const hasPending = (offer: AdminRideOffer) =>
  offer.requests.some((request) => request.status === "PENDING");

const filterMatches = (offer: AdminRideOffer, filter: RideFilter) => {
  const active = offer.status === "ACTIVE";
  if (filter === "pending") return active && hasPending(offer);
  if (filter === "full") return active && offer.seats_left < 1;
  if (filter === "cancelled") return !active;
  return true;
};

const offerPill = (offer: AdminRideOffer): { label: string; tone: PillTone } => {
  if (offer.status === "CANCELLED") return { label: "Cancelled", tone: "neutral" };
  if (offer.seats_left < 1) return { label: "Full", tone: "info" };
  if (hasPending(offer)) return { label: "Needs reply", tone: "warning" };
  return { label: "Active", tone: "success" };
};

interface StatTileProps {
  label: string;
  value: string;
  sub: string;
  hot?: boolean;
  onClick?: () => void;
}

const StatTile = ({ label, value, sub, hot, onClick }: StatTileProps) => {
  const body = (
    <>
      <span className="text-sm text-primaryGray">{label}</span>
      <span
        className={cn(
          "text-2xl font-semibold leading-8 tabular-nums",
          hot ? "text-amber-700" : "text-primary"
        )}
      >
        {value}
      </span>
      <span className="text-xs text-mainGray">{sub}</span>
    </>
  );
  const className = cn(
    "flex flex-col gap-1 rounded-xl border p-4 text-left",
    hot
      ? "border-amber-200 bg-amber-50"
      : "border-lightGray bg-white"
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        className,
        "transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
      )}
    >
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
};

const RideCard = ({
  offer,
  onCancel,
}: {
  offer: AdminRideOffer;
  onCancel: () => void;
}) => {
  const cancelled = offer.status === "CANCELLED";
  const taken = Math.max(0, offer.seats_total - offer.seats_left);
  const pill = offerPill(offer);
  const requests = [...offer.requests].sort(
    (a, b) => (REQUEST_ORDER[a.status] ?? 9) - (REQUEST_ORDER[b.status] ?? 9)
  );

  return (
    <li
      className={cn(listCard, "flex min-w-0 flex-col gap-3 p-4 tablet:p-5", cancelled && "opacity-70")}
    >
      <div className="flex items-center gap-3">
        <Avatar initials={initialsOf(offer.driver.name)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base font-semibold text-primary">
            {offer.driver.name}
          </span>
          <PhoneLink phone={offer.driver.phone} />
        </div>
        <Pill tone={pill.tone}>{pill.label}</Pill>
      </div>

      <p className="text-sm text-primaryGray">
        {offer.area.name} → Church · leaves {clockLabel(offer.depart_time)}
        {offer.car_details ? ` · ${offer.car_details}` : ""}
      </p>

      <SeatBar
        taken={taken}
        total={offer.seats_total}
        label={`${taken} of ${offer.seats_total} seats filled`}
      />

      {offer.stops.length ? (
        <ul className="flex flex-wrap gap-2" aria-label="Pickup points">
          {offer.stops.map((stop) => (
            <li
              key={stop.id}
              className="rounded-full border border-gray-200 bg-inputBackground px-2.5 py-0.5 text-xs text-gray-700"
            >
              <strong className="font-semibold">{clockLabel(stop.pickup_time)}</strong>{" "}
              · {stop.name}
            </li>
          ))}
        </ul>
      ) : null}

      {requests.length ? (
        <ul className="overflow-hidden rounded-lg border border-gray-200">
          {requests.map((request) => {
            const status = REQUEST_PILL[request.status] ?? {
              label: request.status,
              tone: "neutral" as const,
            };
            const note = [
              request.decline_reason ? `Reason: ${request.decline_reason}` : null,
              request.decline_message ? `“${request.decline_message}”` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-200 px-3 py-2 last:border-b-0"
              >
                <div className="flex min-w-0 flex-[1_1_160px] flex-col">
                  <span className="text-sm font-medium text-primary">
                    {request.passenger.name}{" "}
                    {request.passenger.phone ? (
                      <span className="font-normal text-mainGray">
                        · <PhoneLink phone={request.passenger.phone} className="text-mainGray" />
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-mainGray">
                    {request.pickup_point.name} · {clockLabel(request.pickup_time)}
                    {request.requested_at
                      ? ` · asked ${formatWhen(request.requested_at)}`
                      : ""}
                  </span>
                  {note ? <span className="text-xs text-mainGray">{note}</span> : null}
                </div>
                <Pill tone={status.tone}>{status.label}</Pill>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-mainGray">No one has asked to join yet.</p>
      )}

      {cancelled && offer.cancelled_at ? (
        <p className="text-xs text-mainGray">
          Cancelled {formatWhen(offer.cancelled_at)}
        </p>
      ) : null}

      {!cancelled ? (
        <div className="flex justify-end border-t border-gray-200 pt-3">
          <button type="button" onClick={onCancel} className={btnDangerGhost}>
            Cancel ride
          </button>
        </div>
      ) : null}
    </li>
  );
};

/** Offers grouped by church event, earliest start first.
 *  Offers without an event (older data) form their own group. */
const groupByEvent = (offers: AdminRideOffer[]) => {
  const groups = new Map<
    string,
    { key: string; event: RideEvent | null; offers: AdminRideOffer[] }
  >();
  offers.forEach((offer) => {
    const key = offer.event ? String(offer.event.id) : "none";
    const group = groups.get(key) ?? {
      key,
      event: offer.event ?? null,
      offers: [],
    };
    group.offers.push(offer);
    groups.set(key, group);
  });
  return [...groups.values()].sort((a, b) =>
    (a.event?.start_time ?? "99:99").localeCompare(b.event?.start_time ?? "99:99")
  );
};

/** The overview's stats for a subset of offers — same rules as the backend. */
const statsFor = (offers: AdminRideOffer[]) => {
  const active = offers.filter((offer) => offer.status === "ACTIVE");
  const requests = active.flatMap((offer) => offer.requests);
  return {
    rides: active.length,
    cancelled_rides: offers.length - active.length,
    seats_offered: active.reduce((sum, offer) => sum + offer.seats_total, 0),
    seats_filled: requests.filter((request) => request.status === "ACCEPTED").length,
    pending_requests: requests.filter((request) => request.status === "PENDING").length,
    declined_requests: requests.filter((request) => request.status === "DECLINED").length,
  };
};

const eventHeading = (event: RideEvent | null) =>
  event
    ? [event.name, event.start_time ? `starts ${clockLabel(event.start_time)}` : null]
        .filter(Boolean)
        .join(" · ")
    : "No event recorded";

interface RideOverviewPanelProps {
  overview: AdminRideOverview | null;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onShowReports: () => void;
}

/** Every ride for one date, grouped by church event, with everyone on it —
 *  the church office's view. */
export const RideOverviewPanel = ({
  overview,
  loading,
  failed,
  onRetry,
  onShowReports,
}: RideOverviewPanelProps) => {
  const [filter, setFilter] = useState<RideFilter>("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [cancelTarget, setCancelTarget] = useState<AdminRideOffer | null>(null);

  const query = search.trim().toLowerCase();
  const offers = useMemo(() => overview?.offers ?? [], [overview]);
  const groups = useMemo(() => groupByEvent(offers), [offers]);
  const activeEvent = groups.some((group) => group.key === eventFilter)
    ? eventFilter
    : "all";
  const eventOffers = useMemo(
    () =>
      activeEvent === "all"
        ? offers
        : offers.filter(
            (offer) => (offer.event ? String(offer.event.id) : "none") === activeEvent
          ),
    [offers, activeEvent]
  );
  const visibleGroups = useMemo(
    () =>
      groupByEvent(
        eventOffers.filter(
          (offer) => filterMatches(offer, filter) && rideMatches(offer, query)
        )
      ),
    [eventOffers, filter, query]
  );

  if (!overview) {
    return failed ? (
      <LoadError message="Couldn't load rides for this date." onRetry={onRetry} />
    ) : (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-[104px] animate-pulse rounded-xl bg-lightGray/30" />
          ))}
        </div>
        <RideSkeleton rows={2} className="h-56" />
      </div>
    );
  }

  const stats = statsFor(eventOffers);
  const openReports = overview.stats.open_reports;
  const isPast = overview.service_date < overview.current_service_date;
  const percent = stats.seats_offered
    ? `${Math.round((stats.seats_filled / stats.seats_offered) * 100)}% of seats offered`
    : "No seats offered";
  const showHeadings = groups.length > 1 || visibleGroups.some((group) => group.event);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 transition-opacity",
        loading && "pointer-events-none opacity-60"
      )}
      aria-busy={loading}
    >
      {failed ? (
        <LoadError
          message="Couldn't refresh this date. Showing the last loaded rides."
          onRetry={onRetry}
        />
      ) : null}

      {groups.length > 1 ? (
        <Segmented
          label="Church event"
          value={activeEvent}
          onChange={setEventFilter}
          options={[
            { value: "all", label: `All events (${groups.length})` },
            ...groups.map((group) => ({
              value: group.key,
              label: group.event
                ? `${group.event.name}${group.event.start_time ? ` · ${clockLabel(group.event.start_time)}` : ""}`
                : "No event",
            })),
          ]}
        />
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        <StatTile
          label="Rides"
          value={String(stats.rides)}
          sub={
            stats.cancelled_rides
              ? `${stats.cancelled_rides} cancelled`
              : "None cancelled"
          }
        />
        <StatTile
          label="Seats filled"
          value={`${stats.seats_filled} / ${stats.seats_offered}`}
          sub={percent}
        />
        <StatTile
          label="Waiting for a reply"
          value={String(stats.pending_requests)}
          sub={`${plural(stats.pending_requests, "request")} pending${
            stats.declined_requests ? ` · ${stats.declined_requests} declined` : ""
          }`}
          hot={stats.pending_requests > 0}
          onClick={() => setFilter("pending")}
        />
        <StatTile
          label="Open reports"
          value={String(openReports)}
          sub={openReports ? "Needs the safety team" : "All clear"}
          hot={openReports > 0}
          onClick={onShowReports}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Segmented
          label="Filter rides"
          value={filter}
          options={FILTERS}
          onChange={setFilter}
          className="flex-none"
        />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Driver, passenger, phone or place"
          label="Search rides"
          className="max-w-[340px] flex-[1_1_240px]"
        />
      </div>

      {visibleGroups.length ? (
        visibleGroups.map((group) => (
          <section
            key={group.key}
            aria-label={eventHeading(group.event)}
            className="flex flex-col gap-3"
          >
            {showHeadings ? (
              <h2 className="text-base font-semibold text-primary">
                {eventHeading(group.event)}
                <span className="ml-2 text-sm font-normal text-mainGray">
                  {plural(group.offers.length, "ride")}
                </span>
              </h2>
            ) : null}
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,440px),1fr))] gap-4">
              {group.offers.map((offer) => (
                <RideCard
                  key={offer.id}
                  offer={offer}
                  onCancel={() => setCancelTarget(offer)}
                />
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className="py-8 text-center text-sm text-mainGray">
          {eventOffers.length
            ? "No rides match."
            : isPast
              ? "No rides were offered for this date."
              : "No rides offered for this date yet. They appear here as members publish them."}
        </p>
      )}

      {cancelTarget ? (
        <CancelRideModal
          ride={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => {
            setCancelTarget(null);
            onRetry();
          }}
        />
      ) : null}
    </div>
  );
};
