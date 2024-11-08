import ProfilePicture from "@/components/ProfilePicture";
import { ColumnDef } from "@tanstack/react-table";
import { UserType } from "../../Members/utils/membersInterfaces";

interface User extends UserType {
  is_active: boolean;
}

export const tableColumns: ColumnDef<User>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => <div className="flex items-center gap-2 cursor-pointer" onClick={() => { window.location.href = `/home/requests/my_requests/${row.original.id}` }}>
        <ProfilePicture
          src={row.original.photo}
          name={row.original.name}
          alt="profile pic"
          className={`h-[38px] w-[38px] rounded-full border ${row.original.is_active ? "border-green" : "border-error"}`}
          textClass="font-great-vibes overflow-hidden opacity-60"
        />{" "}
        {row.original.name}
      </div>,
    },
    {
      header: "Acount Status",
      accessorKey: "status",
      cell: ({row}) => (
        <div
          className={
           row.original.name![0]==="A"
              ? "bg-[#FFEFD2] text-sm w-fit p-2 flex items-center justify-center rounded-lg text-center text-[#996A13] "
              : "bg-neutralGray text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg text-center text-lighterBlack"
          }> <span className="bg-error h-2 w-2 rounded-full"></span>
          {row.original.name![0]==="A"?"Awaiting Approval":"Pending"}
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Phone number",
      cell: ({row})=>(`${row.original.country_code?row.original.country_code:""} ${row.original.primary_number}`),
    },
    {
      header: "Permission",
      accessorKey: "permission",
    },
  ];