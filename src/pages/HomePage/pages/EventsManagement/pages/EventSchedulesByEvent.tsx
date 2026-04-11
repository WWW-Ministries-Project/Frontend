import EmptyState from "@/components/EmptyState";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils/api/apiCalls";
import { formatDate } from "@/utils/helperFunctions";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import calendar from "/src/assets/calendar.svg";
import locationIcon from "/src/assets/location.svg";
import SkeletonLoader from "@/pages/HomePage/Components/TableSkeleton";

const EventSchedulesByEvent = () => {
  const query = location.search;
  const params = new URLSearchParams(query);
  const eventNameId = params.get("event_name_id");
  const eventName = params.get("event_name") || "Event";
  const navigate = useNavigate();

  const { data, loading } = useFetch(api.fetch.fetchEvents, {
    page: 1,
    page_size: 500,
    take: 500,
  });

  const schedules = useMemo(() => {
    const all: any[] = Array.isArray(data?.data) ? data.data : [];
    if (!eventNameId) return all;
    return all
      .filter((e: any) => String(e.event_name_id) === String(eventNameId))
      .sort(
        (a: any, b: any) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
  }, [data, eventNameId]);

  const upcoming = schedules.filter(
    (e: any) => new Date(e.start_date) >= new Date(new Date().toDateString())
  );
  const past = schedules.filter(
    (e: any) => new Date(e.start_date) < new Date(new Date().toDateString())
  );

  const ScheduleRow = ({ event }: { event: any }) => {
    const eventDate = new Date(event.start_date);
    const month = eventDate.toLocaleString("en-US", { month: "short" });
    const day = eventDate.getDate();
    const isPast = new Date(event.start_date) < new Date(new Date().toDateString());

    return (
      <div
        onClick={() =>
          navigate(
            `/home/events/events/view-event?event_id=${event.id}`
          )
        }
        className="flex cursor-pointer items-center gap-4 rounded-xl border border-lightGray bg-white p-4 transition-shadow hover:shadow-md"
      >
        {/* Date badge */}
        <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-primary/5 py-2 text-center">
          <p className="text-xs font-medium uppercase text-primaryGray">{month}</p>
          <p className="text-2xl font-bold leading-none text-primary">{day}</p>
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${isPast ? "bg-gray-400" : "bg-green-500"}`}
            />
            <p className="text-sm font-semibold text-primary">
              {formatDate(event.start_date + "")}
              {event.end_date && event.end_date !== event.start_date
                ? ` – ${formatDate(event.end_date + "")}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1 text-xs text-primaryGray">
              <img src={calendar} alt="" className="h-3.5 w-3.5" />
              {event.start_time} – {event.end_time}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 text-xs text-primaryGray">
                <img src={locationIcon} alt="" className="h-3.5 w-3.5" />
                <span className="truncate max-w-[200px]">{event.location}</span>
              </span>
            )}
          </div>

          {event.recurrence_series_id && (
            <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
              Recurring series
            </span>
          )}
        </div>

        {/* Arrow */}
        <svg
          className="h-4 w-4 shrink-0 text-primaryGray"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    );
  };

  return (
    <PageOutline>
      {/* Back + heading */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-1 text-sm text-primaryGray hover:text-primary transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-semibold text-primary">{eventName}</h1>
        <p className="mt-1 text-sm text-primaryGray">
          All scheduled occurrences of this event
        </p>
      </div>

      {loading ? (
        <SkeletonLoader />
      ) : schedules.length === 0 ? (
        <EmptyState
          scope="section"
          className="mx-auto w-[20rem]"
          msg="No scheduled events found for this event."
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((event: any) => (
                  <ScheduleRow key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">
                Past ({past.length})
              </h2>
              <div className="space-y-3 opacity-70">
                {past.map((event: any) => (
                  <ScheduleRow key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageOutline>
  );
};

export default EventSchedulesByEvent;
