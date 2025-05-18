import { DateTime } from "luxon";
// import ProfilePicture from "../../../../components/ProfilePicture";
import {ProfilePicture} from "@/components";
export const dashboardColumns = [
    {
      header: "Name",
      accessorKey:"name",
      cell: ({row}) => 
          <ProfilePicture
            src={row.original.photo}
            name={row.original.name}
            alt="profile pic"
            className="h-[38px] w-[38px] rounded-full"
            textClass={" font-great-vibes border border-primary overflow-hidden"}
          />
        
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