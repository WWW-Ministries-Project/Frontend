import * as Yup from "yup";
import { formatTime } from "/src/utils/helperFunctions";

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

export const years = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
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
    cell: ({ row }) => formatTime(row.original.created_at),
  },
];

export const eventColumns = [
  { header: "Name", accessorKey: "name", id: "title" },
  { header: "Location", accessorKey: "location", id: "location" },
];
export const eventInput = {
  // name: "",
  // type: "",
  // start_date: "",
  // end_date: "",
  // start_time: "",
  // end_time: "",
  // location: "",
  // description: "",
  // repetitive: "no",
  // repeatUnit: "months",
  // repeatDays: [],
  // onDays: [],
  // ends: "end_of_year",
  // endsOn: "",
  // day_event: "one",
  // poster: "",
  // recurring: {
  //   frequency: "",
  //   interval: 0,
  //   daysOfWeek: null,
  //   dayOfMonth: null,
  //   monthOfYear: null,
  // },
};
export const eventFormValidator = Yup.object({
  // name: Yup.string().required("Required"),
  // type: Yup.string().required("Required"),
  // start_date: Yup.date().required("Required"),
  // start_date: Yup.date().required("Required"),
  // start_time: Yup.string().required("Required"),
  // // end_time: Yup.string().required("Required"),
  // location: Yup.string().required("Required"),
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

export const maxMinValueForDate = () => {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const maxDate = currentYear + "-12-31";
  const minDate = today.toISOString().split("T")[0];
  return { minDate, maxDate };
};
