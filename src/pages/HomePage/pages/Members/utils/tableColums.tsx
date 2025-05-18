import {ProfilePicture} from "@/components";
import { navigateRef } from "@/pages/HomePage/HomePage";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import { ColumnDef, Row } from "@tanstack/react-table";
import { DateTime } from "luxon";
import { deleteMember } from "./apiCalls";
import { UserType } from "./membersInterfaces";

const booleanFilter = (
  row: Row<UserType>,
  columnId: string,
  filterValue: boolean
): boolean => {
  const rowValue = row.getValue(columnId);
  return Boolean(rowValue) === Boolean(filterValue);
};

export const membersColumns: ColumnDef<UserType>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => {
          if (navigateRef.current)
            navigateRef.current(`/home/members/${row.original.id}/info`);
        }}
      >
        <ProfilePicture
          src={row.original.photo}
          name={row.original.name}
          alt="profile pic"
          className={`h-[38px] w-[38px] rounded-full border ${
            row.original.is_active ? "border-green" : "border-error"
          }`}
          textClass="font-great-vibes overflow-hidden opacity-60"
        />{" "}
        {row.original.name}
      </div>
    ),
  },
  { header: "User", accessorKey: "is_user", filterFn: booleanFilter },
  {
    header: "Phone number",
    cell: ({ row }) =>
      `${row.original.country_code ? row.original.country_code : ""} ${
        row.original.primary_number
      }`,
  },
  // {
  //   header: "last visited",
  //   accessorKey: "last_visited",
  //   cell: (info) => (info.getValue() ? info.getValue() + " days ago" : "N/A"),
  // },
  {
    header: "Date joined",
    accessorKey: "created_at",
    cell: (info) =>
      DateTime.fromISO(info.getValue() as string).toLocaleString(
        DateTime.DATE_FULL
      ),
  },
  // {
  //   header: "Visits",
  //   accessorKey: "visits",
  //   cell: (info) => info.getValue() ?? "0" + " visits",
  // },
  {
    header: "Actions",
    cell: ({ row }) => (
      <div>
        <button
          onClick={() => {
            showDeleteDialog(row.original, deleteMember);
          }}
          className="text-sm h-6 flex items-center justify-center rounded-lg text-center text-error "
        >
          Delete
        </button>
      </div>
    ),
  },
  {
    header: "Membership type",
    accessorKey: "membership_type",
    filterFn: "includesString",
  },
  {
    header: "Department",
    accessorKey: "department_id",
    filterFn: booleanFilter,
  },
];
