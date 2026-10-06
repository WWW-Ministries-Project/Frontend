import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";
import type {
  AdminRideOffer,
  AdminRideOverview,
  AdminRideRequest,
  RideRequestStatus,
} from "@/utils/api/rides/interfaces";
import { clockLabel, plural, serviceDateLabel } from "../utils/rideHelpers";
import {
  PanelError,
  PhoneLink,
  dangerButtonClass,
  formatWhen,
  inputClass,
} from "./AdminRideShared";
import { CancelRideModal } from "./AdminRideModals";
import {
  RideOfferStatusBadge,
  RideRequestStatusBadge,
} from "./RideStatusBadge";

interface RideOverviewPanelProps {
  /** Keeps the page's "Safety reports" tab badge in step. */
  onOpenReports: (count: number) => void;
  onShowReports: () => void;
}

const REQUEST_ORDER: Record<RideRequestStatus, number> = {
  ACCEPTED: 0,
  PENDING: 1,
  DECLINED: 2,
  WITHDRAWN: 3,
  CANCELLED: 4,
};

const normalize = (value: string | null | undefined) =>
  String(value ?? "").toLowerCase();

/** Does this ride involve the search term — driver, passenger, area or landmark? */
const rideMatches = (offer: AdminRideOffer, query: string) => {
  if (!query) return true;
  const haystack = [
    offer.driver.name,
    offer.driver.phone,
    offer.area.name,
    offer.car_details,
    ...offer.stops.map((stop) => stop.name),
    ...offer.requests.flatMap((request) => [
      request.passenger.name,
      request.passenger.phone,
      request.pickup_point.name,
    ]),
  ];
  return haystack.some((value) => normalize(value).includes(query));
};

/** Search hit inside the requests table, so that ride opens automatically. */
const requestsMatch = (offer: AdminRideOffer, query: string) =>
  Boolean(query) &&
  offer.requests.some(
    (request) =>
      normalize(request.passenger.name).includes(query) ||
      normalize(request.passenger.phone).includes(query) ||
      normalize(request.pickup_point.name).includes(query)
  );

interface StatTileProps {
  label: string;
  value: number;
  secondary?: string;
  highlight?: boolean;
  onClick?: () => void;
}

const StatTile = ({
  label,
  value,
  secondary,
  highlight,
  onClick,
}: StatTileProps) => {
  const body = (
    <>
      <span className="text-xs font-medium uppercase tracking-wide text-primaryGray">
        {label}
      </span>
      <span
        className={cn(
          "text-2xl font-semibold tabular-nums",
          highlight ? "text-amber-700 dark:text-amber-200" : "text-primary"
        )}
      >
        {value}
      </span>
      {secondary ? (
        <span className="text-xs text-primaryGray">{secondary}</span>
      ) : null}
    </>
  );
  const className = cn(
    "flex min-h-[104px] flex-col gap-1 rounded-2xl border bg-white p-4 text-left shadow-sm",
    highlight
      ? "border-amber-200 dark:border-amber-400/40"
      : "border-lightGray"
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        className,
        "transition hover:border-primary/40 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      )}
    >
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
};

const RequestsTable = ({ requests }: { requests: AdminRideRequest[] }) => (
  <div className="overflow-x-auto rounded-xl border border-lightGray">
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead>
        <tr className="bg-lightGray/50 text-xs uppercase tracking-wide text-primary">
          <th scope="col" className="px-4 py-2.5 font-semibold">
            Passenger
          </th>
          <th scope="col" className="px-4 py-2.5 font-semibold">
            Phone
          </th>
          <th scope="col" className="px-4 py-2.5 font-semibold">
            Pickup point
          </th>
          <th scope="col" className="px-4 py-2.5 font-semibold">
            Pickup
          </th>
          <th scope="col" className="px-4 py-2.5 font-semibold">
            Requested
          </th>
          <th scope="col" className="px-4 py-2.5 font-semibold">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr
            key={request.id}
            className="border-t border-lightGray align-top text-primary"
          >
            <td className="px-4 py-3 font-medium">{request.passenger.name}</td>
            <td className="px-4 py-3">
              <PhoneLink phone={request.passenger.phone} />
            </td>
            <td className="px-4 py-3">
              <span className="block">{request.pickup_point.name}</span>
              <span className="text-xs text-primaryGray">
                {request.pickup_point.area_label}
              </span>
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              {clockLabel(request.pickup_time)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-primaryGray">
              {formatWhen(request.requested_at)}
            </td>
            <td className="px-4 py-3">
              <RideRequestStatusBadge status={request.status} />
              {request.status === "DECLINED" &&
              (request.decline_reason || request.decline_message) ? (
                <div className="mt-1 max-w-[220px] text-xs text-primaryGray">
                  {request.decline_reason ? (
                    <span className="block">{request.decline_reason}</span>
                  ) : null}
                  {request.decline_message ? (
                    <span className="block italic">
                      “{request.decline_message}”
                    </span>
                  ) : null}
                </div>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface RideCardProps {
  offer: AdminRideOffer;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
}

const RideCard = ({ offer, expanded, onToggle, onCancel }: RideCardProps) => {
  const filled = Math.max(0, offer.seats_total - offer.seats_left);
  const pending = offer.requests.filter(
    (request) => request.status === "PENDING"
  ).length;
  const requests = [...offer.requests].sort(
    (a, b) => (REQUEST_ORDER[a.status] ?? 9) - (REQUEST_ORDER[b.status] ?? 9)
  );
  const cancelled = offer.status === "CANCELLED";
  const requestsId = `ride-${offer.id}-requests`;

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-lightGray bg-white p-5 shadow-sm",
        cancelled && "opacity-80"
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-primary">
              {offer.driver.name}
            </h3>
            <RideOfferStatusBadge status={offer.status} />
          </div>
          <PhoneLink phone={offer.driver.phone} className="mt-0.5" />
        </div>
        {!cancelled ? (
          <button
            type="button"
            className={dangerButtonClass}
            onClick={onCancel}
          >
            Cancel ride
          </button>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-primaryGray">From</dt>
          <dd className="font-medium text-primary">{offer.area.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-primaryGray">Sets off</dt>
          <dd className="font-medium text-primary">
            {clockLabel(offer.depart_time)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-primaryGray">Seats filled</dt>
          <dd className="font-medium tabular-nums text-primary">
            {filled}/{offer.seats_total}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-primaryGray">Car</dt>
          <dd className="text-primary">
            {offer.car_details || (
              <span className="text-primaryGray">Not given</span>
            )}
          </dd>
        </div>
      </dl>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primaryGray">
          Route
        </p>
        {offer.stops.length ? (
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {offer.stops.map((stop) => (
              <li
                key={stop.id}
                className="flex items-center gap-2 rounded-lg bg-lightGray/30 px-2.5 py-1"
              >
                <span className="tabular-nums text-xs font-semibold text-primaryGray">
                  {clockLabel(stop.pickup_time)}
                </span>
                <span className="text-primary">{stop.name}</span>
              </li>
            ))}
            <li className="flex items-center rounded-lg bg-primary/10 px-2.5 py-1 font-medium text-primary">
              Church
            </li>
          </ol>
        ) : (
          <p className="text-sm text-primaryGray">No pickup points listed.</p>
        )}
      </div>

      <p className="text-xs text-primaryGray">
        Published {formatWhen(offer.created_at)}
        {cancelled && offer.cancelled_at
          ? ` · Cancelled ${formatWhen(offer.cancelled_at)}`
          : ""}
      </p>

      <div className="border-t border-lightGray pt-3">
        {requests.length ? (
          <>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={requestsId}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left text-sm font-medium text-primary hover:bg-lightGray/30"
            >
              <span>
                {plural(requests.length, "seat request")}
                {pending ? (
                  <span className="ml-2 font-normal text-amber-800 dark:text-amber-200">
                    · {pending} pending
                  </span>
                ) : null}
              </span>
              {expanded ? (
                <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            {expanded ? (
              <div id={requestsId} className="mt-3">
                <RequestsTable requests={requests} />
              </div>
            ) : null}
          </>
        ) : (
          <p className="px-1 text-sm text-primaryGray">No seat requests yet.</p>
        )}
      </div>
    </li>
  );
};

/** Every ride for one Sunday, with everyone on it — the church office's view. */
export const RideOverviewPanel = ({
  onOpenReports,
  onShowReports,
}: RideOverviewPanelProps) => {
  const [serviceDate, setServiceDate] = useState("");
  const [overview, setOverview] = useState<AdminRideOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [cancelTarget, setCancelTarget] = useState<AdminRideOffer | null>(
    null
  );
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setFailed(false);
    try {
      const response = await api.fetch.fetchRideAdminOverview(
        serviceDate ? { service_date: serviceDate } : undefined
      );
      if (requestId !== requestRef.current) return;
      setOverview(response.data ?? null);
    } catch {
      if (requestId === requestRef.current) setFailed(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [serviceDate]);

  useEffect(() => {
    load();
  }, [load]);

  const openReports = overview?.stats.open_reports;
  useEffect(() => {
    if (typeof openReports === "number") onOpenReports(openReports);
  }, [openReports, onOpenReports]);

  const query = search.trim().toLowerCase();
  const offers = useMemo(() => overview?.offers ?? [], [overview]);
  const visible = useMemo(
    () => offers.filter((offer) => rideMatches(offer, query)),
    [offers, query]
  );

  // A search that hits a passenger or pickup point opens that ride's
  // requests; the admin can still collapse it again.
  useEffect(() => {
    if (!query) return;
    const hits = offers.filter((offer) => requestsMatch(offer, query));
    if (!hits.length) return;
    setExpanded((current) => {
      const next = new Set(current);
      hits.forEach((offer) => next.add(offer.id));
      return next;
    });
  }, [offers, query]);

  const toggle = (id: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allExpanded =
    visible.length > 0 &&
    visible.every(
      (offer) => !offer.requests.length || expanded.has(offer.id)
    );

  const dates = overview?.service_dates?.length
    ? overview.service_dates
    : overview
      ? [overview.service_date]
      : [];
  const selectedDate = serviceDate || overview?.service_date || "";
  const stats = overview?.stats;
  const isCurrent =
    Boolean(overview) && overview?.service_date === overview?.current_service_date;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[220px] flex-col gap-1 text-xs font-medium text-primaryGray">
          Service date
          <select
            className={inputClass}
            value={selectedDate}
            disabled={!overview}
            onChange={(event) => {
              setServiceDate(event.target.value);
              setExpanded(new Set());
            }}
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {serviceDateLabel(date)}
                {date === overview?.current_service_date ? " · This Sunday" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-medium text-primaryGray">
          Search
          <span className="relative">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primaryGray"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Driver, passenger, area or pickup point"
              className={cn(inputClass, "pl-9")}
            />
          </span>
        </label>
      </div>

      {failed && !overview ? (
        <PanelError
          message="Failed to load Sunday rides. Please try again."
          onRetry={load}
        />
      ) : !overview ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <span className="sr-only">Loading Sunday rides…</span>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-[104px] rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col gap-5 transition-opacity",
            loading && "pointer-events-none opacity-60"
          )}
          aria-busy={loading}
        >
          {failed ? (
            <PanelError
              message="Couldn't refresh this date. Showing the last loaded rides."
              onRetry={load}
            />
          ) : null}

          {stats ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <StatTile
                label="Rides"
                value={stats.rides}
                secondary={
                  stats.cancelled_rides
                    ? `${stats.cancelled_rides} cancelled`
                    : isCurrent
                      ? "This Sunday"
                      : serviceDateLabel(overview.service_date)
                }
              />
              <StatTile label="Seats offered" value={stats.seats_offered} />
              <StatTile
                label="Seats filled"
                value={stats.seats_filled}
                secondary={
                  stats.seats_offered
                    ? `${Math.round((stats.seats_filled / stats.seats_offered) * 100)}% of seats`
                    : undefined
                }
              />
              <StatTile
                label="Pending requests"
                value={stats.pending_requests}
                secondary={
                  stats.declined_requests
                    ? `${stats.declined_requests} declined`
                    : undefined
                }
              />
              <StatTile
                label="Open reports"
                value={stats.open_reports}
                highlight={stats.open_reports > 0}
                secondary="View safety reports →"
                onClick={onShowReports}
              />
            </div>
          ) : null}

          {offers.length === 0 ? (
            <EmptyState
              scope="section"
              msg="No rides for this Sunday"
              description={
                isCurrent
                  ? "When members offer seats to the service, their rides appear here."
                  : "No rides were offered for this service date."
              }
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-primaryGray">
                <span>
                  {query
                    ? `${visible.length} of ${plural(offers.length, "ride")} match`
                    : plural(offers.length, "ride")}
                </span>
                {visible.some((offer) => offer.requests.length) ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() =>
                      setExpanded(
                        allExpanded
                          ? new Set()
                          : new Set(visible.map((offer) => offer.id))
                      )
                    }
                  >
                    {allExpanded ? "Collapse all requests" : "Expand all requests"}
                  </button>
                ) : null}
              </div>

              {visible.length === 0 ? (
                <EmptyState
                  scope="section"
                  msg="No matching rides"
                  description="No driver, passenger, area or pickup point matches your search."
                />
              ) : (
                <ul className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                  {visible.map((offer) => (
                    <RideCard
                      key={offer.id}
                      offer={offer}
                      expanded={expanded.has(offer.id)}
                      onToggle={() => toggle(offer.id)}
                      onCancel={() => setCancelTarget(offer)}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {cancelTarget ? (
        <CancelRideModal
          ride={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => {
            setCancelTarget(null);
            load();
          }}
        />
      ) : null}
    </section>
  );
};
