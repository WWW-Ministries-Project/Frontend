import { formatTime } from "/src/utils/helperFunctions";
import * as Yup from "yup";

export const months = [
  {name: "January", value: 1},
  {name: "February", value: 2},
  {name: "March", value: 3},
  {name: "April", value: 4},
  {name: "May", value: 5},
  {name: "June", value: 6},
  {name: "July", value:7},
  {name: "August", value:8},
  {name: "September", value:9},
  {name: "October", value:10},
  {name: "November", value:11},
  {name: "December", value:12},

];

export const years = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
export const registeredEventAttendance =[
  {
    header: "Name",
    accessorKey: "name",
    cell:({row}) => row.original.user.user_info.name
  },
  {
    header: "Membership status",
  
    cell:({row}) => row.original.user.user_info.name
  },
  {
    header: "Phone number",
    accessorKey: "user_info.primary_number",
    cell:({row}) => row.original.user.user_info.primary_number
  },
  {
    header: "Arrival time",
  
    cell:({row}) => row.original.user.user_info.name
  },
  {
    header: "Last visited",
    accessorKey: "created_at",
    cell: ({row}) => formatTime(row.original.created_at)
  },
]
export const eventInput = {
  name: "",
  type: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  location: "",
  description: "",
  isRepetitive: false,
  repeatEvery: 1,
  repeatUnit: "months",
  repeatDays: [],
  ends: "end_of_year",
  endsOn: "",
  isMultiDay: false,
  number_days: 1,
  poster: "",
}
export const eventFormValidator = Yup.object({
  name: Yup.string()
  .max(30, 'Must be 15 characters or less')
  .required('Required'),
 type: Yup.string()
  .required('Required'),
start_date: Yup.date().required('Required'),
start_date: Yup.date(),
start_time: Yup.string().required("Required"),
end_time: Yup.string().required("Required"),
location: Yup.string().required("Required"),
})