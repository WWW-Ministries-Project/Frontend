import { array, date, number, object, string } from "yup";
import { formatDate } from "/src/utils/helperFunctions";

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
    cell: ({ row }) => row.original.user.user_info.user.name,
  },
  {
    header: "Membership",
    cell: ({ row }) => row.original.event_status,
  },
  {
    header: "Phone",
    accessorKey: "user_info.primary_number",
    cell: ({ row }) => row.original.user.user_info.primary_number,
  },
  {
    header: "Arrival",
    cell: ({ row }) => row.original.user.user_info.name,
  },
  {
    header: "Last visited",
    accessorKey: "created_at",
    cell: ({ row }) => formatDate(row.original.created_at),
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
  // end_date: "",
  // start_time: "",
  // end_time: "",
  // location: "",
  // description: "",
  repetitive: "no",
  // repeatUnit: "months",
  // repeatDays: [],
  // onDays: [],
  // ends: "end_of_year",
  // endsOn: "",
  day_event: "one",
  end_date: "",
  // poster: "",
  recurring: {
    frequency: "weekly",
    interval: 1,
    daysOfWeek: [],
    //   dayOfMonth: null,
    //   monthOfYear: null,
  },
};

export const eventUpdateFormValidator = object().shape({
  // name: string().required("Required"),
  // event_type: string().required("Required"),
  event_name_id: string().required("Required"),
  start_date: date("invalid date").required("Required"),
  start_time: string().required("Required"),
  end_time: string().required("Required"),
});

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
    "end-date-required",
    "End date is required",
    function validateEndDateRequirement(value) {
      if (!value) return true;
      if (
        (value.day_event === "multi" || value.repetitive === "yes") &&
        !value.end_date
      ) {
        return this.createError({
          path: "end_date",
          message: "End date is required",
        });
      }
      return true;
    }
  )
  .test(
    "end-date-after-start-date",
    "End date cannot be before start date",
    function validateEndDateRange(value) {
      if (!value?.start_date || !value?.end_date) return true;

      const startDate = new Date(value.start_date);
      const endDate = new Date(value.end_date);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return true;
      }

      if (endDate < startDate) {
        return this.createError({
          path: "end_date",
          message: "End date cannot be before start date",
        });
      }

      return true;
    }
  )
  .test(
    "recurring-values-required",
    "Recurring details are required",
    function validateRecurringFields(value) {
      if (
        !value ||
        (value.repetitive !== "yes" && value.day_event !== "multi")
      ) {
        return true;
      }

      const recurring = value.recurring ?? {};
      const interval = Number(recurring.interval);
      const days = Array.isArray(recurring.daysOfWeek)
        ? recurring.daysOfWeek
        : [];

      if (!days.length) {
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
