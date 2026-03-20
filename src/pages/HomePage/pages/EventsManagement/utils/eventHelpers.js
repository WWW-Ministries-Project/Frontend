import { array, date, number, object, string } from "yup";
import { formatDate } from "/src/utils/helperFunctions";

const getDisplayValue = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return "-";
};

const formatAttendanceArrival = (value) => {
  if (!value) return "-";

  if (typeof value === "string" && /^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return getDisplayValue(value);
  }

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAttendanceName = (record) =>
  getDisplayValue(
    record?.name,
    record?.full_name,
    record?.member_name,
    record?.memberName,
    record?.user_name,
    record?.user?.user_info?.name,
    record?.user?.user_info?.user?.name,
    record?.user?.name
  );

const getAttendancePhone = (record) =>
  getDisplayValue(
    record?.phone,
    record?.primary_number,
    record?.user?.primary_number,
    record?.user?.user_info?.primary_number
  );

const getAttendanceArrival = (record) =>
  formatAttendanceArrival(
    record?.arrival_time ??
      record?.arrivalTime ??
      record?.checked_in_at ??
      record?.checkedInAt ??
      record?.created_at ??
      record?.createdAt
  );

const getAttendanceDate = (record) => {
  const visitedAt = record?.created_at ?? record?.createdAt;
  return visitedAt ? formatDate(visitedAt) : "-";
};

export const months = [
  { name: "January", value: 1 },
  { name: "February", value: 2 },
  { name: "March", value: 3 },
  { name: "April", value: 4 },
  { name: "May", value: 5 },
  { name: "June", value: 6 },
  { name: "July", value: 7 },
  { name: "August", value: 8 },
  { name: "September", value: 9 },
  { name: "October", value: 10 },
  { name: "November", value: 11 },
  { name: "December", value: 12 },
];

export const registeredEventAttendance = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => getAttendanceName(row.original),
  },
  {
    header: "Membership",
    cell: ({ row }) =>
      getDisplayValue(
        row.original.event_status,
        row.original.membership_type,
        row.original.membershipStatus
      ),
  },
  {
    header: "Phone",
    accessorKey: "user_info.primary_number",
    cell: ({ row }) => getAttendancePhone(row.original),
  },
  {
    header: "Arrival",
    cell: ({ row }) => getAttendanceArrival(row.original),
  },
  {
    header: "Last visited",
    accessorKey: "created_at",
    cell: ({ row }) => getAttendanceDate(row.original),
  },
];

export const eventColumns = [
  { header: "Name", accessorKey: "name", id: "title" },
  {
    header: "Date",
    cell: (props) => formatDate(props.getValue()),
    accessorKey: "start_date",
    id: "date",
  },
];

export const eventInput = {
  name: "",
  event_type: "",
  start_date: "",
  event_name_id: "",
  start_time: "",
  end_time: "",
  location: "",
  description: "",
  repetitive: "no",
  day_event: "one",
  end_date: "",
  recurrence_end_date: "",
  requires_registration: false,
  registration_end_date: "",
  registration_capacity: "",
  registration_audience: "MEMBERS_AND_NON_MEMBERS",
  recurring: {
    frequency: "weekly",
    interval: 1,
    daysOfWeek: [],
  },
};

export const eventUpdateFormValidator = object()
  .shape({
    event_name_id: string().required("Required"),
    start_date: date("invalid date").required("Required"),
    start_time: string().required("Required"),
    end_time: string().required("Required"),
    end_date: date("invalid date")
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null ? null : value
      )
      .nullable(),
    registration_end_date: date("invalid date")
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null ? null : value
      )
      .nullable(),
    registration_capacity: number()
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null
          ? null
          : Number(originalValue)
      )
      .nullable()
      .integer("Capacity must be a whole number")
      .min(1, "Minimum is 1"),
  })
  .test(
    "update-event-end-date-range",
    "Event end date cannot be before start date",
    function validateUpdateEndDateRange(value) {
      if (!value?.start_date || !value?.end_date) return true;

      const startDate = new Date(value.start_date);
      const endDate = new Date(value.end_date);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return true;
      }

      if (endDate < startDate) {
        return this.createError({
          path: "end_date",
          message: "Event end date cannot be before start date",
        });
      }

      return true;
    }
  )
  .test(
    "update-registration-settings-required",
    "Registration details are required",
    function validateUpdateRegistrationSettings(value) {
      if (!value?.requires_registration) {
        return true;
      }

      if (!value.registration_end_date) {
        return this.createError({
          path: "registration_end_date",
          message: "Registration end date is required",
        });
      }

      if (
        value.registration_capacity === undefined ||
        value.registration_capacity === null ||
        value.registration_capacity === ""
      ) {
        return this.createError({
          path: "registration_capacity",
          message: "Capacity is required",
        });
      }

      return true;
    }
  )
  .test(
    "update-registration-end-date-range",
    "Registration end date cannot be after start date",
    function validateUpdateRegistrationDateRange(value) {
      if (!value?.requires_registration || !value?.start_date || !value?.registration_end_date) {
        return true;
      }

      const startDate = new Date(value.start_date);
      const registrationEndDate = new Date(value.registration_end_date);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(registrationEndDate.getTime())
      ) {
        return true;
      }

      if (registrationEndDate > startDate) {
        return this.createError({
          path: "registration_end_date",
          message: "Registration end date cannot be after start date",
        });
      }

      return true;
    }
  );

export const eventFormValidator = eventUpdateFormValidator.shape({
  day_event: string()
    .oneOf(["one", "multi"], "Invalid value")
    .required("Required"),
  repetitive: string().oneOf(["yes", "no"], "Invalid value").required("Required"),
  end_date: date("invalid date")
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? null : value
    )
    .nullable(),
  recurrence_end_date: date("invalid date")
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? null : value
    )
    .nullable(),
  recurring: object()
    .shape({
      frequency: string().nullable(),
      interval: number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null
            ? undefined
            : Number(originalValue)
        )
        .nullable()
        .integer("Repeat Every must be a whole number")
        .min(1, "Minimum is 1"),
      daysOfWeek: array()
        .of(number().integer().min(0).max(6))
        .nullable(),
    })
    .nullable(),
})
  .test(
    "event-end-date-required",
    "Event end date is required",
    function validateEndDateRequirement(value) {
      if (!value) return true;
      if (value.day_event === "multi" && !value.end_date) {
        return this.createError({
          path: "end_date",
          message: "Event end date is required",
        });
      }
      return true;
    }
  )
  .test(
    "end-date-after-start-date",
    "End date cannot be before start date",
    function validateEndDateRange(value) {
      if (!value?.start_date || !value?.end_date || value.day_event !== "multi") {
        return true;
      }

      const startDate = new Date(value.start_date);
      const endDate = new Date(value.end_date);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return true;
      }

      if (endDate < startDate) {
        return this.createError({
          path: "end_date",
          message: "Event end date cannot be before start date",
        });
      }

      return true;
    }
  )
  .test(
    "recurrence-end-date-required",
    "Recurrence end date is required",
    function validateRecurrenceEndDateRequirement(value) {
      if (!value || value.repetitive !== "yes") return true;

      if (!value.recurrence_end_date) {
        return this.createError({
          path: "recurrence_end_date",
          message: "Recurrence end date is required",
        });
      }

      return true;
    }
  )
  .test(
    "recurrence-end-date-after-start-date",
    "Recurrence end date cannot be before start date",
    function validateRecurrenceEndDateRange(value) {
      if (!value?.start_date || !value?.recurrence_end_date) return true;

      const startDate = new Date(value.start_date);
      const recurrenceEndDate = new Date(value.recurrence_end_date);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(recurrenceEndDate.getTime())
      ) {
        return true;
      }

      if (recurrenceEndDate < startDate) {
        return this.createError({
          path: "recurrence_end_date",
          message: "Recurrence end date cannot be before start date",
        });
      }

      return true;
    }
  )
  .test(
    "recurring-values-required",
    "Recurring details are required",
    function validateRecurringFields(value) {
      if (!value || value.repetitive !== "yes" || value.day_event === "multi") {
        return true;
      }

      const recurring = value.recurring ?? {};
      const interval = Number(recurring.interval);
      const days = Array.isArray(recurring.daysOfWeek)
        ? recurring.daysOfWeek
        : [];

      if (recurring.frequency === "weekly" && !days.length) {
        return this.createError({
          path: "recurring.daysOfWeek",
          message: "Select at least one day",
        });
      }

      if (value.repetitive === "yes") {
        if (
          recurring.interval === undefined ||
          recurring.interval === null ||
          recurring.interval === ""
        ) {
          return this.createError({
            path: "recurring.interval",
            message: "Repeat Every is required",
          });
        }

        if (Number.isNaN(interval) || interval < 1) {
          return this.createError({
            path: "recurring.interval",
            message: "Minimum is 1",
          });
        }

        if (!recurring.frequency) {
          return this.createError({
            path: "recurring.frequency",
            message: "Repeat Unit is required",
          });
        }
      }

      return true;
    }
  )
  .test(
    "registration-settings-required",
    "Registration details are required",
    function validateRegistrationSettings(value) {
      if (!value?.requires_registration) {
        return true;
      }

      if (!value.registration_end_date) {
        return this.createError({
          path: "registration_end_date",
          message: "Registration end date is required",
        });
      }

      if (
        value.registration_capacity === undefined ||
        value.registration_capacity === null ||
        value.registration_capacity === ""
      ) {
        return this.createError({
          path: "registration_capacity",
          message: "Capacity is required",
        });
      }

      if (!value.registration_audience) {
        return this.createError({
          path: "registration_audience",
          message: "Select who can register",
        });
      }

      return true;
    }
  )
  .test(
    "registration-end-date-range",
    "Registration end date cannot be after start date",
    function validateRegistrationEndDateRange(value) {
      if (!value?.requires_registration || !value?.start_date || !value?.registration_end_date) {
        return true;
      }

      const startDate = new Date(value.start_date);
      const registrationEndDate = new Date(value.registration_end_date);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(registrationEndDate.getTime())
      ) {
        return true;
      }

      if (registrationEndDate > startDate) {
        return this.createError({
          path: "registration_end_date",
          message: "Registration end date cannot be after start date",
        });
      }

      return true;
    }
  );

export const eventTypeColors = {
  ACTIVITY: "#FF6B4D",
  PROGRAM: "#00CFC1", // This is already correct
  SERVICE: "#FFD700",
  other: "#C1BFFF",
  OTHER: "#C1BFFF",
};

export const getBadgeColor = (eventType) => {
    const colors = eventTypeColors;
    return colors[eventType] || "#A8E10C";
};
