import { DateTime } from "luxon";
import ProfilePicture from "/src/components/ProfilePicture";
// const formatTableData = (data) => {
//     switch (data) {
//         case 'last_visited': 
//     }
// }

export const membersColumns = [
  {
    header: "Name",
    accessorKey:"name",
    cell: ({row}) => <div className="flex items-center gap-2">
        <ProfilePicture
          src={row.original.user_info?.photo}
          name={row.original.name}
          alt="profile pic"
          className="h-[38px] w-[38px] rounded-full"
        />{" "}
        {row.original.name}
      </div>,
  },
    {
      header: "Phone number",
      accessorKey: "user_info.primary_number",
    },
    {
      header: "last visited",
      accessorKey: "last_visited",
      cell: (info) => info.getValue()? info.getValue() + " days ago" :"N/A",
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