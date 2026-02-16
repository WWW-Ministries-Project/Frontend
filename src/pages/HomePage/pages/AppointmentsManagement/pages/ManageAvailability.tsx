import { useMemo, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import StaffAvailabilityCard from "../Components/StaffAvailabilityCard";
import { Modal } from "@/components/Modal";
import StaffAvailabilityForm, {
  IStaffAvailabilityForm,
} from "../Components/StaffAvailabilityForm";
import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import {
  DayOfWeek,
  Session,
  StaffAvailability,
  TimeSlot,
} from "@/utils/api/appointment/interfaces";

const dayOptions: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const defaultCurrentSlot: TimeSlot = {
  day: "monday",
  startTime: "09:00",
  endTime: "12:00",
  sessionDurationMinutes: 30,
  sessions: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringValue = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const toNumberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const normalized = Math.max(0, minutes);
  const h = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const m = (normalized % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const generateSessions = (
  startTime: string,
  endTime: string,
  duration: number
): Session[] => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const sessions: Session[] = [];
  let cursor = start;

  while (cursor + duration <= end) {
    sessions.push({
      start: minutesToTime(cursor),
      end: minutesToTime(cursor + duration),
    });
    cursor += duration;
  }

  return sessions;
};

const normalizeDay = (value: unknown): DayOfWeek => {
  const parsed = toStringValue(value).toLowerCase();

  if (dayOptions.includes(parsed as DayOfWeek)) {
    return parsed as DayOfWeek;
  }

  return "monday";
};

const normalizeSession = (session: unknown): Session | null => {
  if (!isRecord(session)) return null;

  const start = toStringValue(session.start ?? session.start_time);
  const end = toStringValue(session.end ?? session.end_time);

  if (!start || !end) return null;

  return {
    start,
    end,
  };
};

const inferDuration = (
  slot: Record<string, unknown>,
  sessions: Session[]
): number => {
  const fromPayload = toNumberValue(
    slot.sessionDurationMinutes ?? slot.session_duration_minutes,
    0
  );

  if (fromPayload > 0) return fromPayload;

  if (sessions.length > 0) {
    const inferred =
      timeToMinutes(sessions[0].end) - timeToMinutes(sessions[0].start);
    if (inferred > 0) return inferred;
  }

  return 30;
};

const normalizeTimeSlot = (slot: unknown): TimeSlot | null => {
  if (!isRecord(slot)) return null;

  const startTime = toStringValue(slot.startTime ?? slot.start_time);
  const endTime = toStringValue(slot.endTime ?? slot.end_time);

  if (!startTime || !endTime) return null;

  const normalizedSessions = Array.isArray(slot.sessions)
    ? slot.sessions
        .map(normalizeSession)
        .filter((session): session is Session => session !== null)
    : [];

  const sessionDurationMinutes = inferDuration(slot, normalizedSessions);

  return {
    day: normalizeDay(slot.day),
    startTime,
    endTime,
    sessionDurationMinutes,
    sessions:
      normalizedSessions.length > 0
        ? normalizedSessions
        : generateSessions(startTime, endTime, sessionDurationMinutes),
  };
};

const normalizeAvailability = (
  rawAvailability: unknown,
  memberLookup: Record<string, string>
): StaffAvailability | null => {
  if (!isRecord(rawAvailability)) return null;

  const staffRecord = isRecord(rawAvailability.staff) ? rawAvailability.staff : null;

  const staffId = toStringValue(
    rawAvailability.staffId ??
      rawAvailability.staff_id ??
      (staffRecord ? staffRecord.id : undefined)
  );

  if (!staffId) return null;

  const timeSlotsRaw = rawAvailability.timeSlots ?? rawAvailability.time_slots;
  const timeSlots = Array.isArray(timeSlotsRaw)
    ? timeSlotsRaw
        .map(normalizeTimeSlot)
        .filter((slot): slot is TimeSlot => slot !== null)
    : [];

  const staffName =
    toStringValue(
      rawAvailability.staffName ??
        rawAvailability.staff_name ??
        (staffRecord
          ?
              staffRecord.name ??
              staffRecord.fullName ??
              staffRecord.full_name
          : undefined)
    ) || memberLookup[staffId] || "Unknown Staff";

  const position = toStringValue(
    rawAvailability.position ??
      (staffRecord ? staffRecord.position ?? staffRecord.title : undefined)
  );

  const role = toStringValue(
    rawAvailability.role ?? (staffRecord ? staffRecord.role : undefined)
  );

  return {
    id: toStringValue(rawAvailability.id) || undefined,
    staffId,
    staffName,
    position,
    role,
    maxBookingsPerSlot: Math.max(
      1,
      toNumberValue(
        rawAvailability.maxBookingsPerSlot ?? rawAvailability.max_bookings_per_slot,
        1
      )
    ),
    timeSlots,
    currentSlot: timeSlots[0] ?? defaultCurrentSlot,
  };
};

const mapAvailabilityToForm = (
  availability: StaffAvailability
): IStaffAvailabilityForm => ({
  staffId: availability.staffId,
  maxBookingsPerSlot: availability.maxBookingsPerSlot,
  timeSlots: availability.timeSlots,
  currentSlot: availability.timeSlots[0] ?? defaultCurrentSlot,
});

const ManageAvailability = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IStaffAvailabilityForm | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState<DayOfWeek | null>(null);
  const [timeFilter, setTimeFilter] = useState<{
    start?: string;
    end?: string;
  }>({});

  const membersOptions = useStore((state) => state.membersOptions);

  const membersLookup = useMemo(
    () =>
      membersOptions.reduce<Record<string, string>>((acc, option) => {
        acc[String(option.value)] = option.label;
        return acc;
      }, {}),
    [membersOptions]
  );

  const {
    data: availabilityData,
    loading,
    refetch,
  } = useFetch(api.fetch.fetchStaffAvailability);

  const allAvailability = useMemo(() => {
    if (!Array.isArray(availabilityData?.data)) return [];

    return availabilityData.data
      .map((availability) => normalizeAvailability(availability, membersLookup))
      .filter((availability): availability is StaffAvailability => availability !== null);
  }, [availabilityData, membersLookup]);

  const resetFilters = () => {
    setSearchTerm("");
    setDayFilter(null);
    setTimeFilter({});
  };

  const filteredAvailability = useMemo(
    () =>
      allAvailability.filter((availability) => {
        const matchesSearch = availability.staffName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        const matchesDay =
          !dayFilter || availability.timeSlots.some((slot) => slot.day === dayFilter);

        const matchesTime =
          !timeFilter.start ||
          !timeFilter.end ||
          availability.timeSlots.some((slot) => {
            if (slot.sessions.length > 0) {
              return slot.sessions.some(
                (session) =>
                  session.start >= timeFilter.start! && session.end <= timeFilter.end!
              );
            }

            return (
              slot.startTime >= timeFilter.start! && slot.endTime <= timeFilter.end!
            );
          });

        return matchesSearch && matchesDay && matchesTime;
      }),
    [allAvailability, dayFilter, searchTerm, timeFilter.end, timeFilter.start]
  );

  return (
    <div>
      <PageOutline className="p-6">
        <HeaderControls
          title="Manage Availability"
          subtitle="Set up when staff members are available for appointments with flexible time slots"
          btnName="Add Availability"
          screenWidth={typeof window !== "undefined" ? window.innerWidth : 0}
          handleClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        />

        <div className="flex flex-wrap gap-4 my-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Staff Name</label>
            <input
              type="text"
              placeholder="Search by staff name"
              className="border rounded px-3 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Available Day</label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={dayFilter ?? ""}
              onChange={(e) => setDayFilter((e.target.value as DayOfWeek) || null)}
            >
              <option value="">All Days</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Start Time</label>
            <input
              type="time"
              className="border rounded px-3 py-2 text-sm"
              value={timeFilter.start ?? ""}
              onChange={(e) =>
                setTimeFilter((prev) => ({
                  ...prev,
                  start: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">End Time</label>
            <input
              type="time"
              className="border rounded px-3 py-2 text-sm"
              value={timeFilter.end ?? ""}
              onChange={(e) =>
                setTimeFilter((prev) => ({
                  ...prev,
                  end: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm px-4 py-2 border rounded hover:bg-gray-50"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <p className="font-medium">Loading availability...</p>
          </div>
        ) : filteredAvailability.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="font-medium">No availability found</p>
            <p className="text-sm mt-1">Try adjusting or resetting your filters.</p>
          </div>
        ) : (
          filteredAvailability.map((availability) => (
            <div key={`${availability.id ?? availability.staffId}`}>
              <StaffAvailabilityCard
                availability={availability}
                onEdit={() => {
                  setEditing(mapAvailabilityToForm(availability));
                  setOpen(true);
                }}
              />
            </div>
          ))
        )}

        <Modal
          open={open}
          className="max-w-4xl"
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
        >
          <StaffAvailabilityForm
            availability={editing ?? undefined}
            onClose={() => {
              setOpen(false);
              setEditing(null);
            }}
            onSuccess={refetch}
          />
        </Modal>
      </PageOutline>
    </div>
  );
};

export default ManageAvailability;
