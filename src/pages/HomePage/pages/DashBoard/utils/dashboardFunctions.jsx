import { DateTime } from "luxon";
// import ProfilePicture from "../../../../components/ProfilePicture";
import ProfilePicture from "../../../../../components/ProfilePicture";
export const dashboardColumns = [
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
      header: "last visited",
      accessorKey: "last_visited",
      cell: (info) => info.getValue()??"N/A" + " days ago",
    },
    {
      header: "Visits",
      accessorKey: "visits",
      cell: (info) => info.getValue()??0 + " visits",
    },
    
  ]