import { Button } from "@/components";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useMemo, useEffect } from "react";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { Appointment, BookedSession, BookingFormValues, StaffAvailability } from "@/utils/api/appointment/interfaces";



const DummyContent = [
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

const validationSchema = Yup.object({
  fullName: Yup.string().required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  purpose: Yup.string().required("Purpose is required"),
  staffId: Yup.string().required("Staff is required"),
  date: Yup.string().required("Date is required"),
  session: Yup.object().required("Please select a time slot"),
});

const getDayFromDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

const AppointmentBookingForm = ({
  onClose,
  bookedSessions = [],
    appointment,
}: {
  onClose: () => void;
  bookedSessions?: BookedSession[];
  appointment?: Appointment;
}) => {
  const initialValues: BookingFormValues = {
    fullName: appointment?.fullName ?? "",
    email: appointment?.email ?? "",
    phone: appointment?.phone ?? "",
    purpose: appointment?.purpose ?? "",
    note: appointment?.note ?? "",
    staffId: appointment?.staffId ?? "",
    date: appointment?.date ?? "",
    session: appointment?.session ?? undefined,
  };

  const staffAvailability: StaffAvailability[] = DummyContent;

  const handleSubmit = (values: BookingFormValues) => {
    // Handle form submission logic here
    console.log("Form submitted with values:", values);
  }

  return (
    <div className="h-full w-full">
      <div className="h-full w-full">
        

        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => {
            useEffect(() => {
              if (values.date) {
                setFieldValue("session", undefined);
              }
            }, [values.date]);

            const selectedStaff = staffAvailability.find(
              (s) => s.staffId === values.staffId
            );

            const day = values.date ? getDayFromDate(values.date) : null;

            const slotsForDay = useMemo(() => {
              if (!selectedStaff || !day) return [];
              return selectedStaff.timeSlots.filter(
                (slot) => slot.day === day
              );
            }, [selectedStaff, day]);

            return (
              <Form className="h-[calc(100vh-180px)] flex flex-col overflow-auto">
                <div className="sticky top-0 z-10">
            <FormHeader>
              <p className="text-lg font-semibold">
                {appointment ? "Edit Appointment" : "Create Appointment"}
              </p>
              <p className="text-sm text-white">
                {appointment
                  ? "Modify the details of your appointment"
                  : "Book a new appointment with our staff"}
              </p>
            </FormHeader>
          </div>
                {/* User details */}
            <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
                <Field
                  component={FormikInputDiv}
                  label="Full Name *"
                  name="fullName"
                  id="fullName"
                  className="w-full"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field
                  component={FormikInputDiv}
                  label="Email *"
                  name="email"
                  id="email"
                  className="w-full"
                />

                <Field
                  component={FormikInputDiv}
                  label="Phone Number *"
                  name="phone"
                  id="phone"
                  className="w-full"
                />
                </div>

                <Field
                  component={FormikInputDiv}
                  label="Purpose of Appointment *"
                  name="purpose"
                  id="purpose"
                  className="w-full"
                />

                <Field
                  component={FormikInputDiv}
                  type="textarea"
                  label="Additional Note"
                  name="note"
                  id="note"
                  className="w-full"
                />

                {/* Staff selection */}
                <Field
                  component={FormikSelectField}
                  label="Appointment With *"
                  name="staffId"
                  id="staffId"
                  className="w-full"
                  options={staffAvailability.map((s) => ({
                    label: s.staffName,
                    value: s.staffId,
                  }))}
                  onSelect={(value: string) => {
                    setFieldValue("staffId", value);
                    setFieldValue("date", "");
                    setFieldValue("session", undefined);
                  }}
                />

                {/* Availability note */}
                {selectedStaff && (
                  <div className="text-sm bg-muted p-3 rounded break-words">
                    <strong>Availability:</strong>
                    {selectedStaff.timeSlots.map((slot) => (
                      <div key={slot.day} className="capitalize">
                        {slot.day}: {slot.startTime} – {slot.endTime}
                      </div>
                    ))}
                  </div>
                )}

                {/* Date selection */}
                <Field
                  component={FormikInputDiv}
                  type="date"
                  label="Select Date *"
                  name="date"
                  id="date"
                  min={new Date().toISOString().split("T")[0]}
                  disabled={!values.staffId}
                  className="w-full"
                />

                {/* Session selection */}
                {values.staffId && values.date && slotsForDay.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Time Slot *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {slotsForDay.flatMap((slot) =>
                        slot.sessions.map((s, idx) => {
                          const isBooked = bookedSessions.some(
                            (b) =>
                              b.staffId === values.staffId &&
                              b.date === values.date &&
                              b.start === s.start &&
                              b.end === s.end
                          );

                          return (
                            <button
                              key={`${s.start}-${idx}`}
                              type="button"
                              disabled={isBooked}
                              className={`border rounded px-3 py-2 text-sm ${
                                isBooked
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : values.session?.start === s.start
                                  ? "bg-primary text-white"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() =>
                                setFieldValue("session", s)
                              }
                            >
                              {s.start} – {s.end}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {values.staffId && values.date && slotsForDay.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No available time slots for the selected date.
                  </div>
                )}
                </div>

                <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
                  <Button
                    value="Cancel"
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                  />
                  <Button
                    onClick={() => handleSubmit(values)}
                    value={appointment ? "Update Appointment" : "Book Appointment"}
                  />
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default AppointmentBookingForm;