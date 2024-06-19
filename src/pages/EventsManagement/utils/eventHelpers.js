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
    header: "Membership status",

    cell: ({ row }) => row.original.user.user_info.user.membership_type,
  },
  {
    header: "Phone number",
    accessorKey: "user_info.primary_number",
    cell: ({ row }) => row.original.user.user_info.primary_number,
  },
  {
    header: "Arrival time",

    cell: ({ row }) => row.original.user.user_info.name,
  },
  {
    header: "Last visited",
    accessorKey: "created_at",
    cell: ({ row }) => formatTime(row.original.created_at),
  },
];
