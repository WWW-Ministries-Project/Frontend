import ProfilePicture from "@/components/ProfilePicture";
import { useStore } from "@/store/useStore";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";
import { assetType } from "./assetsInterface";
import deleteIcon from "/src/assets/delete.svg";
import edit from "/src/assets/edit.svg";
import { useAuth } from "@/auth/AuthWrapper";

export const handleAction = (path: string, mode = "edit") => {
  // navigate(path,{state:{mode}});
  // window.location.href = path;
  window.history.pushState({ mode }, '', path);
  const { user } = useAuth()
  console.log(user,"user");

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
            `/home/Assets/manage-asset?asset_id/${row.original.id}`,
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
            ? "bg-green text-white"
            : "bg-neutralGray text-lighterBlack"
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
              `/home/Assets/manage-asset?asset_id=${row.original.id}`,"view"
            )}
        />
        <img
          src={deleteIcon}
          alt="delete icon"
          className="cursor-pointer"
          onClick={() => {}}
        />
      </div>
    ),
  },
];
