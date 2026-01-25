import React from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import StaffAvailabilityCard from "../Components/StaffAvailabilityCard";
import { Modal } from "@/components/Modal";
import StaffAvailabilityForm from "../Components/StaffAvailabilityForm";

export const DummyContent = [
  {
    id: "avail-1",
    staffId: "1",
    staffName: "John Doe",
    position: "Senior Pastor",
    role: "Counsellor",
    maxBookingsPerSlot: 3,
    timeSlots: [
      {
        day: "monday",
        startTime: "09:00",
        endTime: "12:00",
        sessionDurationMinutes: 30,
        sessions: [
          { start: "09:00", end: "09:30" },
          { start: "09:30", end: "10:00" },
          { start: "10:00", end: "10:30" },
          { start: "10:30", end: "11:00" },
          { start: "11:00", end: "11:30" },
          { start: "11:30", end: "12:00" },
        ],
      },
    ],
    currentSlot: {
      day: "monday",
      startTime: "09:00",
      endTime: "12:00",
      sessionDurationMinutes: 30,
      sessions: [],
    },
  },
  {
    id: "avail-2",
    staffId: "2",
    staffName: "Jane Smith",
    position: "Assistant Pastor",
    role: "Mentor",
    maxBookingsPerSlot: 2,
    timeSlots: [
      {
        day: "tuesday",
        startTime: "10:00",
        endTime: "12:00",
        sessionDurationMinutes: 30,
        sessions: [
          { start: "10:00", end: "10:30" },
          { start: "10:30", end: "11:00" },
          { start: "11:00", end: "11:30" },
          { start: "11:30", end: "12:00" },
        ],
      },
    ],
    currentSlot: {
      day: "tuesday",
      startTime: "10:00",
      endTime: "12:00",
      sessionDurationMinutes: 30,
      sessions: [],
    },
  },
];

const ManageAvailability = () => {
    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);

    const [searchTerm, setSearchTerm] = React.useState("");
    const [dayFilter, setDayFilter] = React.useState<string | null>(null);
    const [timeFilter, setTimeFilter] = React.useState<{
      start?: string;
      end?: string;
    }>({});

    const resetFilters = () => {
      setSearchTerm("");
      setDayFilter(null);
      setTimeFilter({});
    };

    const filteredAvailability = DummyContent.filter((availability) => {
      // Search by staff name
      const matchesSearch =
        availability.staffName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Filter by day
      const matchesDay =
        !dayFilter ||
        availability.timeSlots.some(
          (slot) => slot.day === dayFilter
        );

      // Filter by time range
      const matchesTime =
        !timeFilter.start ||
        !timeFilter.end ||
        availability.timeSlots.some((slot) =>
          slot.sessions.some(
            (session) =>
              session.start >= timeFilter?.start! &&
              session.end <= timeFilter?.end!
          )
        );

      return matchesSearch && matchesDay && matchesTime;
    });

    return ( <div>
        <PageOutline className="p-6">
        <HeaderControls
        title="Manage Availability"
        subtitle="Set up when staff members are available for appointments with flexible time slots"
        btnName="Add Availability"
        // hasFilter
        // hasSearch={false}
        // showFilter={showFilter}
        // setShowFilter={setShowFilter}
        screenWidth={typeof window !== "undefined" ? window.innerWidth : 0}
        handleClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      />
      <div className="flex flex-wrap gap-4 my-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">
            Staff Name
          </label>
          <input
            type="text"
            placeholder="Search by staff name"
            className="border rounded px-3 py-2 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">
            Available Day
          </label>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={dayFilter ?? ""}
            onChange={(e) =>
              setDayFilter(e.target.value || null)
            }
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
          <label className="text-xs font-medium text-gray-600">
            Start Time
          </label>
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
          <label className="text-xs font-medium text-gray-600">
            End Time
          </label>
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

        {/* Content for managing availability goes here */}
        {filteredAvailability.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="font-medium">No availability found</p>
            <p className="text-sm mt-1">
              Try adjusting or resetting your filters.
            </p>
          </div>
        ) : (
          filteredAvailability.map((availability) => (
            <div key={availability.id}>
              <StaffAvailabilityCard
                availability={availability}
                onEdit={() => {
                  setEditing({
                    staffId: availability.staffId,
                    maxBookingsPerSlot: availability.maxBookingsPerSlot,
                    timeSlots: availability.timeSlots,
                    currentSlot: availability.currentSlot,
                  });
                  setOpen(true);
                }}
                onDelete={() => {}}
              />
            </div>
          ))
        )}

        <Modal
          open={open}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
        >
          
            <StaffAvailabilityForm
              availability={editing}
                onClose={() => {
                    setOpen(false);
                    setEditing(null);
                }}
                loading={false}
                
            />
        
        </Modal>

        </PageOutline>
    </div> );
}
 
export default ManageAvailability;