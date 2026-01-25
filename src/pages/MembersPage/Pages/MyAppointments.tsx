import React from "react";
import { Button } from "@/components";
import BannerWrapper from "../layouts/BannerWrapper";
import booking from "@/assets/banner/booking.svg";
import AppointmentCard from "../Component/AppointmentCard";
import { Modal } from "@/components/Modal";
import AppointmentBookingForm from "../Component/AppointmentBookingForm";
import { Appointment } from "@/utils/api/appointment/interfaces";
import AllAppointmentsLayout from "@/pages/HomePage/pages/AppointmentsManagement/Layout/AllAppointmentsLayout";

export const dummyAppointments: Appointment[] = [
  {
    id: "appt-1",
    staffId: "1",
    staffName: "John Doe",
    position: "Senior Pastor",

    fullName: "Michael Adams",
    email: "michael.adams@email.com",
    phone: "0240000001",
    purpose: "Personal counselling",
    note: "Looking for spiritual guidance",

    date: "2026-02-10",
    session: {
      start: "09:00",
      end: "09:30",
    },

    status: "Confirmed",
    createdAt: "2026-01-20T10:15:00Z",
  },
  {
    id: "appt-2",
    staffId: "2",
    staffName: "Jane Smith",
    position: "Assistant Pastor",

    fullName: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "0240000002",
    purpose: "Marriage counselling",
    note: "Couple session",

    date: "2026-02-11",
    session: {
      start: "10:00",
      end: "10:30",
    },

    status: "Pending",
    createdAt: "2026-01-22T14:40:00Z",
  },
  {
    id: "appt-3",
    staffId: "1",
    staffName: "John Doe",
    position: "Senior Pastor",

    fullName: "Daniel Brown",
    email: "daniel.brown@email.com",
    phone: "0240000003",
    purpose: "Prayer and encouragement",
    note: "",

    date: "2026-02-12",
    session: {
      start: "11:00",
      end: "11:30",
    },

    status: "Confirmed",
    createdAt: "2026-01-25T09:05:00Z",
  },
  {
    id: "appt-4",
    staffId: "2",
    staffName: "Jane Smith",
    position: "Assistant Pastor",

    fullName: "Grace Mensah",
    email: "grace.mensah@email.com",
    phone: "0240000004",
    purpose: "Mentorship session",
    note: "",

    date: "2026-02-13",
    session: {
      start: "11:30",
      end: "12:00",
    },

    status: "Cancelled",
    createdAt: "2026-01-26T16:20:00Z",
  },
  {
    id: "appt-5",
    staffId: "1",
    staffName: "John Doe",
    position: "Senior Pastor",

    fullName: "David Wilson",
    email: "david.wilson@email.com",
    phone: "0240000005",
    purpose: "Leadership coaching",
    note: "",

    date: "2026-02-14",
    session: {
      start: "10:30",
      end: "11:00",
    },

    status: "Confirmed",
    createdAt: "2026-01-27T11:00:00Z",
  },
  {
    id: "appt-6",
    staffId: "2",
    staffName: "Jane Smith",
    position: "Assistant Pastor",

    fullName: "Emily Davis",
    email: "emily.davis@email.com",
    phone: "0240000006",
    purpose: "Career guidance",
    note: "",

    date: "2026-02-15",
    session: {
      start: "10:00",
      end: "10:30",
    },

    status: "Pending",
    createdAt: "2026-01-28T08:45:00Z",
  },
  {
    id: "appt-7",
    staffId: "1",
    staffName: "John Doe",
    position: "Senior Pastor",

    fullName: "Paul Anderson",
    email: "paul.anderson@email.com",
    phone: "0240000007",
    purpose: "Follow-up session",
    note: "Continuation of last counselling",

    date: "2026-01-10",
    session: {
      start: "11:30",
      end: "12:00",
    },

    status: "Confirmed",
    createdAt: "2026-01-05T13:30:00Z",
  },
];

const isPastAppointment = (date: string) => {
  const today = new Date();
  const appointmentDate = new Date(date);
  appointmentDate.setHours(23, 59, 59, 999);
  return appointmentDate < today;
};

const groupedAppointments = {
  "Upcoming & Current Appointments": dummyAppointments.filter(
    (appt) => !isPastAppointment(appt.date)
  ),
  "Past Appointments": dummyAppointments.filter((appt) =>
    isPastAppointment(appt.date)
  ),
};

const MyAppointments = () => {
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    "Upcoming & Current Appointments": true,
    "Past Appointments": false,
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | undefined>(undefined);

  const handleBookAppointment = () => {
    setSelectedAppointment(undefined); // create mode
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-y-6">
      <BannerWrapper imgSrc={booking}>
        <div className="space-y-4 w-full">
          <div className="font-bold text-3xl">My Appointments</div>
          <div>Overview of your appointments and schedules.</div>
        </div>
      </BannerWrapper>

      <div className="flex flex-col gap-6">
        <div className="flex justify-end items-center">
          {/* <div className="font-semibold text-lg mb-4">Upcoming Appointments</div> */}
          <div className="">
            <Button
              value="Book appointment"
              variant="primary"
              onClick={handleBookAppointment}
            />
          </div>
        </div>

        <AllAppointmentsLayout
          Appointments={groupedAppointments}
          onEdit={(appt) => {
            console.log("Edit appointment:", appt);
            setSelectedAppointment(appt);
            setIsModalOpen(true);
          }}
          onDelete={(appt) => {
            console.log("Delete appointment:", appt);
          }}
        />

        {/* {Object.entries(groupedAppointments).map(([group, items]) => (
          <div key={group} className="space-y-3">
            <button
              className="w-full flex justify-between items-center font-semibold text-lg py-2 px-4 bg-gray-50 rounded-lg"
              onClick={() =>
                setOpenGroups((prev) => ({
                  ...prev,
                  [group]: !prev[group],
                }))
              }
            >
              <div className="flex gap-x-2">
                <span>{group}</span>
                <span>({items.length})</span>
              </div>
              <span className="text-sm">{openGroups[group] ? "−" : "+"}</span>
            </button>

            {openGroups[group] && (
              <div className="flex flex-col gap-4">
                {items.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onDelete={(appt) => {
                      console.log("Delete appointment:", appt);
                    }}
                    onEdit={(appt) => {
                      console.log("Edit appointment:", appt);
                      setSelectedAppointment(appt);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))} */}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(undefined);
        }}
      >
        <AppointmentBookingForm
          appointment={selectedAppointment}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(undefined);
          }}
        />
      </Modal>
    </div>
  );
};

export default MyAppointments;