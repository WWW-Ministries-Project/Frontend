import { ColumnDef } from "@tanstack/react-table";
import type { Requisition } from "../types/requestInterface";
import Action from "@/components/Action";
import { useCallback, useEffect, useState } from "react";
import Elipsis from "@/assets/ellipse.svg";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";
import StatusPill from "@/components/StatusPill";
import api from "@/utils/apiCalls";
import { useDelete } from "@/CustomHooks/useDelete";
import {
  showNotification,
  showDeleteDialog,
} from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";

export const tableColumns: ColumnDef<Requisition>[] = [
  {
    header: "Requisition ID",
    cell: ({ row }) => {
      const ItemButton = () => {
        const navigate = useNavigate();

        const handleClick = () => {
          const encodedId = window.btoa(row.original.requisition_id);
          navigate(`/home/requests/${encodedId}`);
        };

        return <button onClick={handleClick}>
          {row.original.generated_id}
        </button>;
      };

      return <ItemButton />;
    },
  },
  {
    header: "Item name",
    accessorKey: "product_names",
    cell: (info) => {
      const ItemCell = () => {
        const [showPopover, setShowPopover] = useState(false);
        const items = info.getValue() as string[];
        const remainingItems = items.length > 1 ? items.slice(1) : [];

        return (
          <div className="flex gap-2 items-center relative">
            <p>{items[0]}</p>
            {remainingItems.length > 0 && (
              <button
                onMouseOver={() => setShowPopover(true)}
                onFocus={() => setShowPopover(true)}
                onMouseLeave={() => setShowPopover(false)}
                onBlur={() => setShowPopover(false)}
                className="cursor-pointer bg-[#EDEFF5] py-1 px-1.5 text-xs font-medium rounded-3xl whitespace-nowrap"
                aria-label={`Show more items (${remainingItems.length})`}
              >
                + {remainingItems.length}
              </button>
            )}
            {showPopover && (
              <div className="absolute bg-white rounded shadow-lg mt-1 z-10 top-8">
                {remainingItems.map((item, index) => (
                  <div key={index + item} className="p-2 ">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      };

      return <ItemCell />;
    },
  },
  {
    header: "Total amount",
    accessorKey: "total_amount",
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
    cell: (info) => <StatusPill text={info.getValue() as string} />,
  },
  {
    header: "Action",
    accessorKey: "action",
    cell: ({ row }) => {
      const ActionCell = () => {
        const [showActions, setShowActions] = useState(false);
        const navigate = useNavigate();
        const encodedId = window.btoa(row.original.requisition_id);
        const { executeDelete, success, error } = useDelete(
          api.delete.deleteRequest
        );
        const {removeRequest} = useStore()
        useEffect(() => {
          if (success) {
            showNotification("Request deleted successfully");
            removeRequest(row.original.requisition_id);
          }
          if (error) {
            showNotification("Something went wrong");
          }
        }, [success, error]);

        const handleDelete = useCallback(async () => {
          setShowActions(false);
          await executeDelete(row.original.requisition_id);
        }, [executeDelete, row]);
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
                    navigate(`/home/requests/${encodedId}`);
                  }}
                  onEdit={() => {
                    navigate(`/home/requests/request/${encodedId}`);
                  }}
                  onDelete={async () => {
                    showDeleteDialog(
                      {
                        id: 1,
                        name: `${row.original.generated_id}`,
                        onConfirm: () => {},
                      },
                      handleDelete
                    );
                  }}
                />
              </div>
            )}
          </div>
        );
      };

      return <ActionCell />;
    },
  },
];
