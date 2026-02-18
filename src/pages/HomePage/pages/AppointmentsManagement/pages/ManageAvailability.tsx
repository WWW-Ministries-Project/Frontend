import { useEffect, useMemo, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import StaffAvailabilityCard from "../Components/StaffAvailabilityCard";
import { Modal } from "@/components/Modal";
import StaffAvailabilityForm, {
  IStaffAvailabilityForm,
} from "../Components/StaffAvailabilityForm";
import { useFetch } from "@/CustomHooks/useFetch";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
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

const normalizeClockTime = (value: unknown): string => {
  const raw = toStringValue(value).trim();
  if (!raw.includes(":")) return "";

  const [hourPart, minutePart] = raw.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const formatTimeWithMeridiem = (value: string): string => {
  const normalized = normalizeClockTime(value);
  if (!normalized) return value;

  const [hourText, minuteText] = normalized.split(":");
  const hour = Number(hourText);
  const meridiem = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteText} ${meridiem}`;
};

const timeToMinutes = (time: string): number => {
  const normalizedTime = normalizeClockTime(time);

  if (!normalizedTime) {
    return 0;
  }

  const [hours, minutes] = normalizedTime.split(":").map(Number);

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
  const parsed = toStringValue(value).toLowerCase().trim();

  const dayMap: Record<string, DayOfWeek> = {
    monday: "monday",
    mon: "monday",
    tuesday: "tuesday",
    tue: "tuesday",
    tues: "tuesday",
    wednesday: "wednesday",
    wed: "wednesday",
    thursday: "thursday",
    thu: "thursday",
    thur: "thursday",
    thurs: "thursday",
    friday: "friday",
    fri: "friday",
    saturday: "saturday",
    sat: "saturday",
    sunday: "sunday",
    sun: "sunday",
  };

  if (dayMap[parsed]) {
    return dayMap[parsed];
  }

  if (dayOptions.includes(parsed as DayOfWeek)) {
    return parsed as DayOfWeek;
  }

  return "monday";
};

const normalizeSession = (session: unknown): Session | null => {
  if (!isRecord(session)) return null;

  const start = normalizeClockTime(
    session.start ?? session.start_time ?? session.startTime ?? session.from
  );
  const end = normalizeClockTime(
    session.end ?? session.end_time ?? session.endTime ?? session.to
  );

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
    slot.sessionDurationMinutes ??
      slot.session_duration_minutes ??
      slot.sessionDuration ??
      slot.duration,
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

  const startTime = normalizeClockTime(
    slot.startTime ?? slot.start_time ?? slot.start ?? slot.from
  );
  const endTime = normalizeClockTime(
    slot.endTime ?? slot.end_time ?? slot.end ?? slot.to
  );

  if (!startTime || !endTime) return null;

  const sessionsRaw =
    slot.sessions ?? slot.session ?? slot.availableSessions ?? slot.available_sessions;

  const normalizedSessions = Array.isArray(sessionsRaw)
    ? sessionsRaw
        .map(normalizeSession)
        .filter((session): session is Session => session !== null)
    : [];

  const sessionDurationMinutes = inferDuration(slot, normalizedSessions);

  return {
    day: normalizeDay(slot.day ?? slot.dayOfWeek ?? slot.day_of_week ?? slot.weekday),
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

  const staffRecord = isRecord(rawAvailability.staff)
    ? rawAvailability.staff
    : isRecord(rawAvailability.user)
    ? rawAvailability.user
    : null;

  const staffId = toStringValue(
    rawAvailability.staffId ??
      rawAvailability.staff_id ??
      rawAvailability.userId ??
      rawAvailability.user_id ??
      (staffRecord ? staffRecord.id : undefined)
  );

  if (!staffId) return null;

  const timeSlotsRaw = rawAvailability.timeSlots ?? rawAvailability.time_slots;
  const nestedTimeSlots = Array.isArray(timeSlotsRaw)
    ? timeSlotsRaw
        .map(normalizeTimeSlot)
        .filter((slot): slot is TimeSlot => slot !== null)
    : [];
  const flatTimeSlot = normalizeTimeSlot(rawAvailability);
  const timeSlots =
    nestedTimeSlots.length > 0
      ? nestedTimeSlots
      : flatTimeSlot
      ? [flatTimeSlot]
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
    rawAvailability.role ??
      rawAvailability.designation ??
      (staffRecord ? staffRecord.role ?? staffRecord.designation : undefined)
  );

  const currentSlot = normalizeTimeSlot(
    rawAvailability.currentSlot ?? rawAvailability.current_slot
  );

  return {
    id:
      toStringValue(
        rawAvailability.id ??
          rawAvailability.availabilityId ??
          rawAvailability.availability_id
      ) || undefined,
    staffId,
    staffName,
    position,
    role,
    maxBookingsPerSlot: Math.max(
      1,
      toNumberValue(
        rawAvailability.maxBookingsPerSlot ??
          rawAvailability.max_bookings_per_slot ??
          rawAvailability.maxBookings ??
          rawAvailability.max_bookings,
        1
      )
    ),
    timeSlots,
    currentSlot: currentSlot ?? timeSlots[0] ?? defaultCurrentSlot,
  };
};

const mapAvailabilityToForm = (
  availability: StaffAvailability
): IStaffAvailabilityForm => ({
  id: availability.id,
  staffId: availability.staffId,
  maxBookingsPerSlot: availability.maxBookingsPerSlot,
  timeSlots: availability.timeSlots,
  currentSlot:
    availability.currentSlot ?? availability.timeSlots[0] ?? defaultCurrentSlot,
});

const ManageAvailability = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IStaffAvailabilityForm | null>(null);

  const [staffFilter, setStaffFilter] = useState<string | null>(null);
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
  const {
    executeDelete,
    success: deleteSuccess,
    error: deleteError,
  } = useDelete(api.delete.deleteStaffAvailability);

  const allAvailability = useMemo(() => {
    if (!Array.isArray(availabilityData?.data)) return [];

    return availabilityData.data
      .map((availability) => normalizeAvailability(availability, membersLookup))
      .filter((availability): availability is StaffAvailability => availability !== null);
  }, [availabilityData, membersLookup]);

  const staffFilterOptions = useMemo(
    () =>
      allAvailability.reduce<{ value: string; label: string }[]>((acc, item) => {
        if (acc.some((option) => option.value === item.staffId)) {
          return acc;
        }

        acc.push({
          value: item.staffId,
          label: item.staffName || "Unknown Staff",
        });
        return acc;
      }, []),
    [allAvailability]
  );

  const hasTimeOverlap = (
    slotStart: string,
    slotEnd: string,
    filterStart?: string,
    filterEnd?: string
  ) => {
    const slotStartMinutes = timeToMinutes(slotStart);
    const slotEndMinutes = timeToMinutes(slotEnd);
    const filterStartMinutes = filterStart ? timeToMinutes(filterStart) : undefined;
    const filterEndMinutes = filterEnd ? timeToMinutes(filterEnd) : undefined;

    if (filterStartMinutes !== undefined && slotEndMinutes <= filterStartMinutes) {
      return false;
    }

    if (filterEndMinutes !== undefined && slotStartMinutes >= filterEndMinutes) {
      return false;
    }

    return true;
  };

  const resetFilters = () => {
    setStaffFilter(null);
    setDayFilter(null);
    setTimeFilter({});
  };

  const filteredAvailability = useMemo(
    () =>
      allAvailability.filter((availability) => {
        const matchesStaff =
          !staffFilter || availability.staffId === staffFilter;

        const matchesDay =
          !dayFilter || availability.timeSlots.some((slot) => slot.day === dayFilter);

        const hasTimeFilter = Boolean(timeFilter.start || timeFilter.end);
        const matchesTime =
          !hasTimeFilter ||
          availability.timeSlots.some((slot) => {
            if (slot.sessions.length > 0) {
              return slot.sessions.some(
                (session) =>
                  hasTimeOverlap(
                    session.start,
                    session.end,
                    timeFilter.start,
                    timeFilter.end
                  )
              );
            }

            return hasTimeOverlap(
              slot.startTime,
              slot.endTime,
              timeFilter.start,
              timeFilter.end
            );
          });

        return matchesStaff && matchesDay && matchesTime;
      }),
    [allAvailability, dayFilter, staffFilter, timeFilter.end, timeFilter.start]
  );

  useEffect(() => {
    if (!deleteSuccess) return;

    showNotification("Availability deleted successfully", "success");
    refetch();
  }, [deleteSuccess, refetch]);

  useEffect(() => {
    if (!deleteError) return;

    showNotification(deleteError.message || "Unable to delete availability", "error");
  }, [deleteError]);

  const handleDeleteAvailability = (availabilityId: string | number) => {
    executeDelete({ id: String(availabilityId) });
  };

  return (
    <div>
      <PageOutline>
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
            <label className="text-xs font-medium text-gray-600">Staff</label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={staffFilter ?? ""}
              onChange={(e) => setStaffFilter(e.target.value || null)}
            >
              <option value="">All Staff</option>
              {staffFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
            {timeFilter.start && (
              <span className="text-[11px] text-gray-500">
                {formatTimeWithMeridiem(timeFilter.start)}
              </span>
            )}
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
            {timeFilter.end && (
              <span className="text-[11px] text-gray-500">
                {formatTimeWithMeridiem(timeFilter.end)}
              </span>
            )}
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
          filteredAvailability.map((availability, index) => {
            const availabilityId = availability.id;

            return (
              <div key={`${availability.id ?? availability.staffId}-${index}`}>
                <StaffAvailabilityCard
                  availability={availability}
                  onEdit={() => {
                    setEditing(mapAvailabilityToForm(availability));
                    setOpen(true);
                  }}
                  onDelete={
                    availabilityId
                      ? () =>
                          showDeleteDialog(
                            {
                              id: availabilityId,
                              name: availability.staffName || "Availability",
                            },
                            handleDeleteAvailability
                          )
                      : undefined
                  }
                />
              </div>
            );
          })
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
