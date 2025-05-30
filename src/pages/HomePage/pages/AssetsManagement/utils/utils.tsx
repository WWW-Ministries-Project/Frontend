import { ProfilePicture } from "@/components";
import { navigateRef } from "@/pages/HomePage/HomePage";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";
import { assetType } from "./assetsInterface";
import deleteIcon from "/src/assets/delete.svg";
import edit from "/src/assets/edit.svg";
import { showDeleteDialog } from "@/pages/HomePage/utils";

export const handleAction = (path: string, mode = "edit") => {
  if (navigateRef.current) navigateRef.current(path, { state: { mode } });
};

export const assetsColumns: ColumnDef<assetType>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() =>
          handleAction(
            `/home/Assets/manage-asset?asset_id=${row.original.id}`,
            "view"
          )
        }
      >
        <ProfilePicture
          src={row.original.photo}
          name={row.original.name}
          alt="profile pic"
          className="h-[38px] w-[38px] rounded-full"
        />{" "}
        {row.original.name}
      </div>
    ),
  },
  {
    header: "Description",
    accessorKey: "description",
  },
  {
    header: "Date Purchased",
    accessorKey: "date_purchased",
    cell: ({ row }) =>
      DateTime.fromISO(row.original.date_purchased).toLocaleString(
        DateTime.DATE_FULL
      ),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: (info) => (
      <div
        className={`text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center ${
          info.getValue() === "ASSIGNED"
            ? "bg-green-500 text-white"
            : "bg-gray-400 text-lighterBlack"
        }  `}
      >
        {info.getValue() === "ASSIGNED" ? "Assigned" : "Unassigned"}
      </div>
    ),
  },
  {
    header: "Actions",
    cell: ({ row }) => (
      <div
        className={
          "text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center text-white "
        }
      >
        <img
          src={edit}
          alt="edit icon"
          className="cursor-pointer"
          onClick={() =>
            handleAction(
              `/home/Assets/manage-asset?asset_id=${row.original.id}`,
              "edit"
            )
          }
        />
        <img
          src={deleteIcon}
          alt="delete icon"
          className="cursor-pointer"
          onClick={() => {showDeleteDialog(row.original, ()=>{alert("yet to be completed use grid mode")})}}
        />
      </div>
    ),
  },
];
