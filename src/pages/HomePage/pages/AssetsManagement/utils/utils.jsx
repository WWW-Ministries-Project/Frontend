import { DateTime } from "luxon";
import edit from "/src/assets/edit.svg";
import deleteIcon from "/src/assets/delete.svg";
import ProfilePicture from "/src/components/ProfilePicture";




export const assetsColumns = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
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
    cell: (info) =>
      DateTime.fromISO(info.getValue()).toLocaleString(DateTime.DATE_FULL),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: (info) => (
      <div
        className={`text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center ${info.getValue() === "ASSIGNED"
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
    // accessorKey: "status",
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
          onClick={() => {
            setInputValue(() => ({
              id: row.original?.id,
              name: row.original?.name,
              description: row.original?.description,
              date_purchased: row.original?.date_purchased,
              status: row.original?.status,
              price: row.original?.price,
              photo: row.original.photo
            }));
            setEditMode(true);
            setDisplayForm(true);
          }}
        />
        <img src={deleteIcon} alt="delete icon" className="cursor-pointer" onClick={() => {
          handleShowModal()
          setItemToDelete({ path: "assets/delete-asset", id: row.original?.id, name: row.original?.name, index: row.index })
        }} />
      </div>
    ),
  },
];
