import { DateTime } from "luxon";

export const assetsColumns = [
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Category",
    accessorKey: "department",
    cell: (info) => info.getValue()?.name ?? "N/A",
  },
  {
    header: "Assigned to",
    accessorKey: "description",
  },
  {
    header: "Date Assigned",
    accessorKey: "created_at",
    cell: (info) => DateTime.fromISO(info.getValue()).toLocaleString(DateTime.DATE_FULL),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: (info) => (
      <div
        className={
          "text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center text-white "
        }
      >
        <img src={edit} alt="edit icon" className="cursor-pointer" />
        <img src={deleteIcon} alt="delete icon" className="cursor-pointer" />
      </div>
    ),
  },
  {
    header: "Actions",
    accessorKey: "status",
    cell: () => (
      <div
        className={
           "text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center text-white "
        }>
        <img src={edit} alt="edit icon" className="cursor-pointer"  />
        <img src={deleteIcon} alt="delete icon"  className="cursor-pointer" />

      </div>
      )
  },
];
