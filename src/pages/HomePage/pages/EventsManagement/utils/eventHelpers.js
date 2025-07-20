import * as Yup from "yup";
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
  event_name_id: "",
  start_date: "",
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
  // poster: "",
  recurring: {
    //   frequency: "",
    //   interval: 0,
    daysOfWeek: 0,
    //   dayOfMonth: null,
    //   monthOfYear: null,
  },
};
export const eventFormValidator = Yup.object().shape({
  // name: Yup.string().required("Required"),
  event_name_id: Yup.string().required("Required"),
  start_date: Yup.date("invalid date").required("Required"),
  start_time: Yup.string().required("Required"),
  day_event: Yup.string()
    .oneOf(["one", "multi"], "Invalid value")
    .required("Required"),

  // recurring: Yup.object().shape({
  //   daysOfWeek: Yup.number().nullable()
  //     .when("day_event", {
  //       is: (day_event) => day_event === "multi",
  //       then: Yup.number()
  //         .min(2, "Minimum is 2")
  //         .required("Required"),
  //     }),
  // }),

  // number_days:Yup.number().min(2,"should have a minimum of 2"),
  // repeatEvery:Yup.number().min(1,"should have a minimum of 1")
  // repetitive: Yup.boolean().required("Required")
  // recurring: Yup.object({
  //   frequency: Yup.string().when("repetitive", {
  //     is: "yes",
  //     then: Yup.oneOf(["daily", "weekly", "monthly", "yearly"]).required(
  //       "Required"
  //     ),
  //   }),
  //   daysOfWeek: Yup.number()
  //     .min(1)
  //     .when("repetitive", {
  //       is: "yes",
  //       then: Yup.number().min(1, "Minimum is 1").required("Required"),
  //     }),
  //   interval: Yup.number()
  //     .min(1)
  //     .when("repetitive", {
  //       is: "yes",
  //       then: Yup.number().min(1, "Minimum is 1").required("Required"),
  //     }),
  // }),
});

export const eventTypeColors = {
  ACTIVITY: "#FF6B4D",
  PROGRAM: "#00CFC1", // This is already correct
  SERVICE: "#FFD700",
  other: "#C1BFFF",
};

export const getBadgeColor = (eventType) => {
    const colors = eventTypeColors;
    return colors[eventType] || "#A8E10C";
};
