import { ColumnDef } from "@tanstack/react-table";
import { UserType } from "../../Members/utils/membersInterfaces";
import { Requisition } from "../types/requestInterface";
import Action from "@/components/Action";
import { useState } from "react";
import Elipsis from "@/assets/ellipse.svg";
import { DateTime } from "luxon";
import { getStatusColor } from "@/pages/HomePage/utils/stringOperations";
import { useNavigate } from "react-router-dom";
export const tableColumns: ColumnDef<Requisition>[] = [
  {
    header: "Requisition ID",
    accessorKey: "request_id",
  },
  {
    header: "Item name",
    accessorKey: "comment",
  },
  {
    header: "Date created",
    accessorKey: "requisition_date",
    cell: (info) =>
      DateTime.fromISO(info.getValue() as string).toFormat("yyyy-MM-dd"),
  },
  {
    header: "Status",
    accessorKey: "request_approval_status",
    cell: (info) => (
      <div className={getStatusColor(info.getValue() as string) + " flex items-center gap-2"}>
        <svg
          width="6"
          height="7"
          viewBox="0 0 6 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3" cy="3.64453" r="3" fill="#474D66" />
        </svg>
        {info.getValue() as string}
      </div>
    ),
  },
  {
    header: "Action",
    accessorKey: "action",
    cell: ({ row }) => {
      const [showActions, setShowActions] = useState(false);
      const navigate = useNavigate()
      return (
        <div className="absolute -mt-3">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <img src={Elipsis} alt="elipsis" />
          </button>

          {showActions && (
            <div className="absolute right-0 z-10 ">
              <Action onView={() => {navigate(`/home/requests/my_requests/${row.original.request_id}`); setShowActions(false)}} onEdit={() => {console.log("edit"); setShowActions(false)}} onDelete={() => {console.log("delete"); setShowActions(false)}} />
            </div>
          )}
        </div>
      );
    },
  },
];
