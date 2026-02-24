import Elipsis from "@/assets/ellipse.svg";
import Action from "@/components/Action";
import StatusPill from "@/components/StatusPill";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  Requisition,
  RequisitionStatusType,
} from "../types/requestInterface";

const amountFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

        return (
          <button
            type="button"
            onClick={handleClick}
            className="font-semibold text-primary hover:underline"
          >
            {row.original.generated_id || row.original.requisition_id}
          </button>
        );
      };

      return <ItemButton />;
    },
  },
  {
    header: "Items",
    accessorKey: "product_names",
    cell: (info) => {
      const ItemCell = () => {
        const [showPopover, setShowPopover] = useState(false);
        const items = info.getValue() as string[];
        const normalizedItems = Array.isArray(items) ? items : [];
        const remainingItems =
          normalizedItems.length > 1 ? normalizedItems.slice(1) : [];

        return (
          <div className="relative flex max-w-[280px] items-center gap-2">
            <p className="truncate text-sm font-medium text-primary">
              {normalizedItems?.[0] || "N/A"}
            </p>
            {remainingItems?.length > 0 && (
              <button
                type="button"
                onMouseOver={() => setShowPopover(true)}
                onFocus={() => setShowPopover(true)}
                onMouseLeave={() => setShowPopover(false)}
                onBlur={() => setShowPopover(false)}
                className="whitespace-nowrap rounded-full bg-lightGray px-2 py-1 text-xs font-medium text-primary"
                aria-label={`Show more items (${remainingItems.length})`}
              >
                +{remainingItems.length}
              </button>
            )}
            {showPopover && (
              <div className="absolute top-8 z-20 min-w-[180px] rounded-lg border border-lightGray bg-white p-2 shadow-lg">
                {remainingItems.map((item, index) => (
                  <div key={index + item} className="py-1 text-xs text-primary">
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
    cell: ({ row }) => {
      const total = Number(row.original.total_amount ?? 0);
      return (
        <span className="font-medium text-primary">
          {row.original.currency || "GHS"} {amountFormatter.format(total)}
        </span>
      );
    },
  },
  {
    header: "Date created",
    accessorKey: "date_created",
    cell: (info) => {
      const raw = info.getValue() as string;
      const parsed = DateTime.fromISO(raw);
      return parsed.isValid ? parsed.toFormat("dd LLL yyyy") : "N/A";
    },
  },
  {
    header: "Status",
    accessorKey: "approval_status",
    cell: (info) => (
      <StatusPill text={info.getValue() as RequisitionStatusType} />
    ),
  },
  {
    header: "Action",
    accessorKey: "action",
    cell: ({ row }) => {
      const ActionCell = () => {
        const [showActions, setShowActions] = useState(false);
        const actionRef = useRef<HTMLDivElement>(null);
        const navigate = useNavigate();
        const requisitionId = row.original.requisition_id;
        const encodedId = window.btoa(requisitionId);
        const { executeDelete, success, error } = useDelete(
          api.delete.deleteRequest
        );
        const { removeRequest } = useStore();

        const isEditable =
          row.original.approval_status === "Awaiting_HOD_Approval" ||
          row.original.approval_status === "Draft";

        useEffect(() => {
          const handleOutsideClick = (event: MouseEvent) => {
            if (
              actionRef.current &&
              !actionRef.current.contains(event.target as Node)
            ) {
              setShowActions(false);
            }
          };

          document.addEventListener("mousedown", handleOutsideClick);
          return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
          };
        }, []);

        useEffect(() => {
          if (success) {
            showNotification("Request deleted successfully");
            removeRequest(requisitionId);
          }
          if (error) {
            showNotification("Something went wrong");
          }
        }, [success, error, removeRequest, requisitionId]);

        const handleDelete = async () => {
          setShowActions(false);
          await executeDelete({ id: requisitionId });
        };

        return (
          <div ref={actionRef} className="relative">
            <button
              type="button"
              onClick={() => setShowActions(!showActions)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-lightGray hover:bg-lightGray/50"
              aria-label="Open actions"
            >
              <img src={Elipsis} alt="elipsis" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-9 z-20">
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
                        id: Number(row.original.id),
                        name: `${row.original.generated_id}`,
                        onConfirm: () => {},
                      },
                      handleDelete
                    );
                  }}
                  isEditable={isEditable}
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
