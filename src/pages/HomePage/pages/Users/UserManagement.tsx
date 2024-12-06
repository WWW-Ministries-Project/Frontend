//@ts-nocheck
import ProfilePicture from "@/components/ProfilePicture";
import { useFetch } from "@/CustomHooks/useFetch";
import api from "@/utils/apiCalls";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import ActionButton from "../../Components/reusable/ActionButton";
import TableComponent from "../../Components/reusable/TableComponent";
import { UserType } from "../Members/utils/membersInterfaces";

interface User extends UserType {
  is_active: boolean;
  permission: string;
}
const UserManagement = () => {
  const { data } = useFetch(api.fetch.fetchAllMembers, { is_user: "true" });

  const [selectedId, setSelectedId] = useState<number | string>("");

  const handleShowOptions = (id: number | string) => {
    setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
  };

  const usersColumns: ColumnDef<User>[] = [
    {
      header: "Member ID",
      cell: ({ row }) => <span>SC-24</span>,
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            window.location.href = `/home/members/${row.original.id}/info`;
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
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Department",
      accessorKey: "department",
      accessorFn: (row) => row.department?.name || "N/A",
    },
    {
      header: "Role",
      accessorKey: "permission",
    },
    {
      header: "Acount Status",
      accessorKey: "is_active",
      cell: (info) => (
        <div
          className={
            info.getValue()
              ? "bg-green text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg text-center text-white "
              : "bg-neutralGray text-sm h-6 w-fit p-2 flex items-center justify-center rounded-lg text-center text-lighterBlack"
          }
        >
          {info.getValue() ? "Active" : "Inactive"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div onClick={() => handleShowOptions(row.original.id)}>
          <ActionButton 
            showOptions={row.original.id == selectedId}
            onView={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </div>
      ),
    },
  ];

//   const users = data?.data?.data || [];
  const users: User[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      department: { name: "Engineering", id: "1" },
      permission: "Admin",
      is_active: true,
      photo: "https://via.placeholder.com/150",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      department: { name: "Marketing" },
      permission: "Editor",
      is_active: false,
      photo: "https://via.placeholder.com/150",
    },
    {
      id: "3",
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      department: { name: "Finance" },
      permission: "Viewer",
      is_active: true,
      photo: "https://via.placeholder.com/150",
    },
    {
      id: "4",
      name: "Bob Brown",
      email: "bob.brown@example.com",
      department: { name: "Human Resources" },
      permission: "Admin",
      is_active: false,
      photo: "https://via.placeholder.com/150",
    },
  ];
  ;

  return (
    <PageOutline>
      <PageHeader title={`Users(${users.length})`} />
      <TableComponent columns={usersColumns} data={users} />
    </PageOutline>
  );
};

export default UserManagement;
