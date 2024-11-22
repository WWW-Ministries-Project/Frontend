import { ColumnDef } from "@tanstack/react-table";
import type { Requisition } from "../types/requestInterface";
import Action from "@/components/Action";
import { useState } from "react";
import Elipsis from "@/assets/ellipse.svg";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";
import StatusPill from "@/components/StatusPill";
export const tableColumns: ColumnDef<Requisition>[] = [
  {
    header: "Requisition ID",
    accessorKey: "generated_id",
  },
  {
    header: "Item name",
    accessorKey: "product_names",
    cell: (info) => {
      const [showPopover, setShowPopover] = useState(false);
      const items = info.getValue() as string[];
      const remainingItems = items.length > 1 ? items.slice(1) : [];

      return (
        <div className="flex gap-2 items-center relative">
          <p>{items[0]}</p>
          {remainingItems.length > 0 && (
            <div
              onMouseOver={() => setShowPopover(true)}
              onMouseLeave={() => setShowPopover(false)}
              className="cursor-pointer bg-[#EDEFF5] py-1 px-1.5 text-xs font-medium
               rounded-3xl whitespace-nowrap"
            >
              + {remainingItems.length}
            </div>
          )}
          {showPopover && (
            <div className="absolute bg-white rounded shadow-lg mt-1 z-10 top-8">
              {remainingItems.map((item, index) => (
                <div key={index} className="p-2 ">
                  {item}
                </div>
              ))}

            </div>
          )}
        </div>
      );
    },
  },
  {
    header:"Total amount",
    accessorKey:"total_amount"
  },
  {
    header: "Date created",
    accessorKey: "date_created",
    cell: (info) =>
      DateTime.fromISO(info.getValue() as string).toFormat("yyyy-MM-dd"),
  },
  {
    header: "Status",
    accessorKey: "approval_status",
    cell: (info) => (
      <StatusPill text={info.getValue() as string}/>
    ),
  },
  {
    header: "Action",
    accessorKey: "action",
    cell: ({ row }) => {
      const [showActions, setShowActions] = useState(false);
      const navigate = useNavigate();
      const encodedId= window.btoa(row.original.requisition_id)
      return (
        <div className="relative -mt-3">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <img src={Elipsis} alt="elipsis" />
          </button>

          {showActions && (
            <div className="absolute right-0 z-10 ">
              <Action
                onView={() => {
                  navigate(
                    `/home/requests/my_requests/${encodedId}`
                  );
                }}
                onEdit={() => {
                 navigate(`/home/requests/my_requests/request/${encodedId}`)
                }}
                onDelete={() => {
                  console.log("delete");
                  setShowActions(false);
                }}
              />
            </div>
          )}
        </div>
      );
    },
  },
];
