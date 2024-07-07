import { DateTime } from "luxon";
import ProfilePicture from "/src/components/ProfilePicture";

export const sideTabs = [
  { name: 'Dashboard', key: 'Dashboard' },
  { name: 'Members', key: 'Members' },
  { name: 'Attendance', key: 'Attendance' },
  { name: "Events ", key: "Events" },
  { name: "Finance", key: "Finance" }, 
  // { name: 'Reports', key: 'Reports' }, 
  { name: "Assets ", key: "Assets" },
  { name: "Users", key: "Users" }, 
  { name: "Settings", key: "Settings" }];

// const formatTableData = (data) => {
//     switch (data) {
//         case 'last_visited': 
//     }
// }

export const membersColumns = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => <div className="flex items-center gap-2 cursor-pointer" onClick={() => { window.location.href = `/home/members/${row.original.id}/info` }}>
      <ProfilePicture
        src={row.original.user_info?.photo}
        name={row.original.name}
        alt="profile pic"
        className="h-[38px] w-[38px] rounded-full border"
        textClass="font-great-vibes overflow-hidden opacity-60"
      />{" "}
      {row.original.name}
    </div>,
  },
  {
    header: "Phone number",
    cell: ({row})=>(`${row.original.country_code?row.original.country_code:""} ${row.original.primary_number}`),
  },
  {
    header: "last visited",
    accessorKey: "last_visited",
    cell: (info) => info.getValue() ? info.getValue() + " days ago" : "N/A",
  },
  {
    header: "Created",
    accessorKey: "created_at",
    cell: (info) => DateTime.fromISO(info.getValue()).toLocaleString(DateTime.DATE_FULL),
  },
  {
    header: "Visits",
    accessorKey: "visits",
    cell: (info) => info.getValue() ?? "0" + " visits",
    // cell: (info) => info.getValue() ? info.getValue() + " visits" : "N/A",
  },
  {
    header: "Status",
    accessorKey: "is_active",
    cell: (info) => (
      <div
        className={
          info.getValue()
            ? "bg-green text-sm h-6 flex items-center justify-center rounded-lg text-center text-white "
            : "bg-neutralGray text-sm h-6 flex items-center justify-center rounded-lg text-center text-lighterBlack"
        }>
        {info.getValue() ? "Active" : "Inactive"}
      </div>
    ),
  },
];
export const maxMinValueForDate = () => {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const maxDate = currentYear + "-12-31";
  const minDate = today.toISOString().split("T")[0];
  return { minDate, maxDate };
};