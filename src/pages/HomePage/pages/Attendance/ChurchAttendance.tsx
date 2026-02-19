import { useEffect, useMemo, useState } from "react";
import PageOutline from "../../Components/PageOutline";
import { HeaderControls } from "@/components/HeaderControls";
import EmptyState from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Button } from "@/components";
import { api, relativePath } from "@/utils";
import ChurchAttendanceForm, {
  IChurchAttendanceForm,
} from "./Components/ChurchAttendanceForm";
import ChurchAttendanceCard from "./Components/ChrchAttendanceCard";
import ChurchAttendanceHeader from "./Components/ChurchAttendanceHeader";
import { useStore } from "@/store/useStore";
import { useFetch } from "@/CustomHooks/useFetch";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog, showNotification } from "../../utils";

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const toOptionalStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number") return String(value);
  return undefined;
};

const normalizeGroup = (value: unknown): IChurchAttendanceForm["group"] => {
  if (value === "ADULTS" || value === "CHILDREN" || value === "BOTH") {
    return value;
  }
  return "BOTH";
};

const normalizeAttendanceRecord = (
  record: Record<string, unknown>
): IChurchAttendanceForm => ({
  eventId: toStringValue(record.eventId ?? record.event_id),
  date: toStringValue(record.date),
  group: normalizeGroup(record.group),
  adultMale: toNumber(record.adultMale ?? record.adult_male),
  adultFemale: toNumber(record.adultFemale ?? record.adult_female),
  childrenMale: toNumber(record.childrenMale ?? record.children_male),
  childrenFemale: toNumber(record.childrenFemale ?? record.children_female),
  youthMale: toNumber(record.youthMale ?? record.youth_male),
  youthFemale: toNumber(record.youthFemale ?? record.youth_female),
  visitingPastors: toNumber(record.visitingPastors ?? record.visiting_pastors),
  recordedBy: toStringValue(record.recordedBy ?? record.recorded_by),
  lastUpdatedBy: toStringValue(
    record.lastUpdatedBy ?? record.last_updated_by
  ),
  id:
    typeof record.id === "string" || typeof record.id === "number"
      ? record.id
      : typeof record.attendance_id === "string" ||
        typeof record.attendance_id === "number"
      ? record.attendance_id
      : undefined,
  event_name: toOptionalStringValue(record.event_name ?? record.eventName),
  recordedByName: toOptionalStringValue(
    record.recordedByName ?? record.recorded_by_name
  ),
});

export default function ChurchAttendance() {
  const { data, refetch } = useFetch(api.fetch.fetchChurchAttendance);
  const { executeDelete, success } = useDelete(api.delete.deleteChurchAttendance);
  const [attendance, setAttendance] = useState<IChurchAttendanceForm[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IChurchAttendanceForm | null>(null);

  const [showFilter, setShowFilter] = useState(false);
  const [groupBy, setGroupBy] = useState<"event" | "date">("event");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState({
    event: "",
    month: "",
    group: "",
  });

  const { eventsOptions } = useStore();

  const eventLookup = useMemo(() => {
    const map: Record<string, string> = {};
    eventsOptions?.forEach((e) => {
      map[String(e.value)] = e.label;
    });
    return map;
  }, [eventsOptions]);

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    { label: "Attendance", link: "" },
  ];

  const filteredAttendance = useMemo(() => {
    return attendance.filter((r) => {
      
      const eventMatch = filters.event
        ? r.eventId === filters.event
        : true;
      const monthMatch = filters.month
        ? r.date.startsWith(filters.month)
        : true;
      const groupMatch = filters.group ? r.group === filters.group : true;
      return eventMatch && monthMatch && groupMatch;
    });
  }, [attendance, filters]);

  const groupedAttendance = useMemo(() => {
    const groups: Record<string, IChurchAttendanceForm[]> = {};
    filteredAttendance.forEach((record) => {
      const key =
        groupBy === "event"
          ? eventLookup[record?.eventId] ?? "Unknown Event"
          : record.date.slice(0, 7);
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });
    return groups;
  }, [filteredAttendance, groupBy, eventLookup]);

  useEffect(() => {
    const keys = Object.keys(groupedAttendance);
    if (keys.length) setOpenGroups({ [keys[0]]: true });
  }, [groupedAttendance]);

  useEffect(() => {
    if (data && data.data && Array.isArray(data.data)) {
      setAttendance(data.data.map(normalizeAttendanceRecord));
    }
  }, [data]);

  useEffect(() => {
    if (success) {
      refetch();
      showNotification("Attendance record deleted successfully", "success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const deleteAttendance = async (attendanceId: string | number) => {
    executeDelete({ id: String(attendanceId) });
  };

  return (
    <PageOutline crumbs={crumbs}>
      <HeaderControls
        title="Church Attendance"
        subtitle="Record and review attendance statistics"
        btnName="Record Attendance"
        hasFilter
        hasSearch={false}
        showFilter={showFilter}
        setShowFilter={setShowFilter}
        screenWidth={window.innerWidth}
        handleClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
      />

      {showFilter && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Event</label>
            <select
              className="h-10 border rounded px-3"
              value={filters.event}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p, event: e.target.value
                }))
              }
            >
              <option value="">All Events</option>
              {eventsOptions?.map((event) => (
                <option key={event.value} value={String(event.value)}>
                  {event.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Month</label>
            <input
              type="month"
              className="h-10 border rounded px-3"
              value={filters.month}
              onChange={(e) =>
                setFilters((p) => ({ ...p, month: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Group</label>
            <select
              className="h-10 border rounded px-3"
              value={filters.group}
              onChange={(e) =>
                setFilters((p) => ({ ...p, group: e.target.value }))
              }
            >
              <option value="">All</option>
              <option value="ADULTS">Adults</option>
              <option value="CHILDREN">Children</option>
              <option value="BOTH">Both</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <Button
              value="Reset"
              variant="secondary"
              onClick={() =>
                setFilters({ event: "", month: "", group: "" })
              }
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          className={`px-3 py-1 rounded text-sm border ${
            groupBy === "event" ? "bg-primary text-white" : ""
          }`}
          onClick={() => setGroupBy("event")}
        >
          Group by Event
        </button>
        <button
          className={`px-3 py-1 rounded text-sm border ${
            groupBy === "date" ? "bg-primary text-white" : ""
          }`}
          onClick={() => setGroupBy("date")}
        >
          Group by Date
        </button>
      </div>

      {filteredAttendance.length === 0 && (
        <EmptyState scope="page" msg="No attendance records found" />
      )}

      <div className="space-y-6">
        {Object.entries(groupedAttendance).map(([group, records]) => (
          <div key={group} className="space-y-3">
            
            <button
              className="w-full flex justify-between items-center font-semibold text-lg py-2 px-4 bg-gray-50 rounded-lg"
              onClick={() =>
                setOpenGroups((p) => ({ ...p, [group]: !p[group] }))
              }
            >
              <span>
                {group} ({records.length})
              </span>
              <span>{openGroups[group] ? "−" : "+"}</span>
            </button>

            {openGroups[group] && (
              <div className="rounded-xl border bg-white">
                <ChurchAttendanceHeader />
                {records.map((record) => (
                  <ChurchAttendanceCard
                    key={
                      record.id
                        ? String(record.id)
                        : `${record.eventId}-${record.date}-${record.group}`
                    }
                    record={record}
                    onEdit={(rec) => {
                      setEditing(rec);
                      setShowForm(true);
                    }}
                    onDelete={() => {
                      if (record.id !== undefined) {
                        showDeleteDialog(
                          {
                            name: eventLookup[record.eventId] ?? "Attendance record",
                            id: record.id,
                          },
                          deleteAttendance
                        );
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={showForm} className="max-w-3xl" onClose={() => setShowForm(false)}>
        <ChurchAttendanceForm
          initialData={editing || undefined}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          refetch={refetch}
        />
      </Modal>
    </PageOutline>
  );
}
