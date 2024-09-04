import ProfilePicture from "@/components/ProfilePicture";
import { ColumnDef } from "@tanstack/react-table";
import { UserType } from "../../Members/utils/membersInterfaces";

interface User extends UserType {
  is_active: boolean;
}

export const usersColumns: ColumnDef<User>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => <div className="flex items-center gap-2 cursor-pointer" onClick={() => { window.location.href = `/home/members/${row.original.id}/info` }}>
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
    {
      header: "Acount Status",
      cell: (info) => (
        <div
          className={
            info.getValue()
              ? "bg-green text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg text-center text-white "
              : "bg-neutralGray text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg text-center text-lighterBlack"
          }>
          {info.getValue() ? "Active" : "Inactive"}
        </div>
      ),
    },
  ];