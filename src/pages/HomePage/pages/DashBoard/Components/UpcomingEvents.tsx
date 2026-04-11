import { useAuth } from "@/context/AuthWrapper";
import { useStore } from "@/store/useStore";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { EventCard } from "./EventCard";
import { Modal } from "@/components/Modal";
import { eventType } from "../../EventsManagement/utils/eventInterfaces";

type DepartmentPositionRecord = Record<string, unknown>;

const toNormalizedId = (value: unknown): string | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
};

const getNestedId = (value: unknown): string | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return toNormalizedId((value as DepartmentPositionRecord).id);
};

const collectUserAudienceIds = (
  departmentValues: string[] | undefined,
  departmentPositions: Array<string | Record<string, unknown>> | undefined
) => {
  const departmentIds = new Set<string>();
  const positionIds = new Set<string>();

  if (Array.isArray(departmentValues)) {
    departmentValues.forEach((value) => {
      const normalizedValue = toNormalizedId(value);
      if (normalizedValue) {
        departmentIds.add(normalizedValue);
      }
    });
  }

  if (Array.isArray(departmentPositions)) {
    departmentPositions.forEach((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        const normalizedValue = toNormalizedId(entry);
        if (normalizedValue) {
          departmentIds.add(normalizedValue);
        }
        return;
      }

      const record = entry as DepartmentPositionRecord;
      const departmentId = toNormalizedId(
        record.department_id ?? getNestedId(record.department)
      );
      const positionId = toNormalizedId(
        record.position_id ?? getNestedId(record.position)
      );

      if (departmentId) {
        departmentIds.add(departmentId);
      }

      if (positionId) {
        positionIds.add(positionId);
      }
    });
  }

  return { departmentIds, positionIds };
};

const hasAudienceMatch = (selectedIds: unknown, userIds: Set<string>) => {
  if (!Array.isArray(selectedIds) || userIds.size === 0) {
    return false;
  }

  return selectedIds.some((value) => {
    const normalizedValue = toNormalizedId(value);
    return normalizedValue ? userIds.has(normalizedValue) : false;
  });
};

const resolveDateOnly = (value: unknown): string => {
  const rawValue = String(value ?? "").trim();
  const datePrefixMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})/);

  if (datePrefixMatch) {
    return datePrefixMatch[1];
  }

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
};

const resolveDateTime = (
  dateValue: unknown,
  timeValue: unknown,
  fallbackTime: string
) => {
  const dateOnly = resolveDateOnly(dateValue);
  if (!dateOnly) {
    return Number.NaN;
  }

  const normalizedTime =
    typeof timeValue === "string" && /^\d{2}:\d{2}$/.test(timeValue.trim())
      ? timeValue.trim()
      : fallbackTime;

  return new Date(`${dateOnly}T${normalizedTime}`).getTime();
};

const isUpcomingOrOngoingEvent = (event: eventType) => {
  const startTimestamp = resolveDateTime(
    event.start_date,
    event.start_time,
    "00:00"
  );
  const endTimestamp = resolveDateTime(
    event.end_date || event.start_date,
    event.end_time,
    "23:59"
  );

  if (Number.isNaN(startTimestamp) && Number.isNaN(endTimestamp)) {
    return false;
  }

  if (!Number.isNaN(endTimestamp)) {
    return endTimestamp >= Date.now();
  }

  return startTimestamp >= Date.now();
};

const compareEventsBySchedule = (a: eventType, b: eventType) => {
  const aTimestamp = resolveDateTime(a.start_date, a.start_time, "00:00");
  const bTimestamp = resolveDateTime(b.start_date, b.start_time, "00:00");

  if (Number.isNaN(aTimestamp) && Number.isNaN(bTimestamp)) {
    return String(a.event_name || a.name || "").localeCompare(
      String(b.event_name || b.name || "")
    );
  }

  if (Number.isNaN(aTimestamp)) {
    return 1;
  }

  if (Number.isNaN(bTimestamp)) {
    return -1;
  }

  if (aTimestamp !== bTimestamp) {
    return aTimestamp - bTimestamp;
  }

  return String(a.event_name || a.name || "").localeCompare(
    String(b.event_name || b.name || "")
  );
};

const isUserExpectedAttendee = (
  event: eventType,
  userAudienceIds: ReturnType<typeof collectUserAudienceIds>
) => {
  if (!event.audience_type || event.audience_type === "all") {
    return true;
  }

  if (event.audience_type === "department") {
    return hasAudienceMatch(
      event.target_departments,
      userAudienceIds.departmentIds
    );
  }

  if (event.audience_type === "position") {
    return hasAudienceMatch(event.target_positions, userAudienceIds.positionIds);
  }

  return true;
};

export const UpcomingEvents = () => {
  const { user } = useAuth();
  const { events } = useStore((state) => ({
    events: state.events,
    setEvents: state.setEvents,
  }));

  const [openModaal, setOpenModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<eventType | null>(null)
  const userAudienceIds = useMemo(
    () => collectUserAudienceIds(user.department, user.department_positions),
    [user.department, user.department_positions]
  );
  const upcomingAndOngoingEvents = useMemo(
    () =>
      (events || [])
        .filter(isUpcomingOrOngoingEvent)
        .filter((event) => isUserExpectedAttendee(event, userAudienceIds))
        .sort(compareEventsBySchedule)
        .slice(0, 4),
    [events, userAudienceIds]
  );


  const handleEventDetails = (event: eventType): void => {
    setSelectedEvent(event);
    setOpenModal(true)
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <CalendarIcon className="text-primary" height={24} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          Upcoming & Ongoing Events
        </h3>
      </div>

      {upcomingAndOngoingEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center">
            <CalendarIcon className="text-gray-600" height={24} />
          </div>
          <h4 className="text-lg font-medium text-gray-600 mb-2">
            No Upcoming or Ongoing Events
          </h4>
          <p className="text-gray-500">
            Check back soon — any upcoming or ongoing event will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols- gap-6 max-h-[50vh] overflow-auto z-10">
          {upcomingAndOngoingEvents.map((event) => (
            <div key={event.id} >
              <EventCard  event={event} handleEventClick = {() =>handleEventDetails (event)}/>
            </div>
            
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      <Modal persist open={openModaal} onClose={() => setOpenModal(false)}>
        <div className="">
          {selectedEvent && <EventCard event={selectedEvent} showInModal={true} onClose={() => setOpenModal(false)}/>}
        </div>
      </Modal>
    </div>
  );
};
