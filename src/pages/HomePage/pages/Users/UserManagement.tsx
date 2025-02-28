import ProfilePicture from "@/components/ProfilePicture";
import SearchBar from "@/components/SearchBar";
import { useFetch } from "@/CustomHooks/useFetch";
import api from "@/utils/apiCalls";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import ActionButton from "../../Components/reusable/ActionButton";
import TableComponent from "../../Components/reusable/TableComponent";
import { UserType } from "../Members/utils/membersInterfaces";

interface User extends UserType {
  is_active: boolean;
  access?: { name: string };
}
const UserManagement = () => {
  const { data: registeredMembers } = useFetch(api.fetch.fetchAllMembers, {
    is_user: "true",
  });
  const [selectedId, setSelectedId] = useState<number | string>("");
  const [searchedUser, setSearchedUser] = useState("");
  const navigate = useNavigate();

  const handleShowOptions = (id: number | string) => {
    setSelectedId((prevSelectedId) => (prevSelectedId === id ? "" : id));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchedUser(e.target.value);
  };

  //displayed headers for table
  const usersColumns: ColumnDef<User>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            navigate(`${row.original.id}/info`);
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
      header: "Member ID",
      cell: ({ row }) => <span>SC-24</span>,
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Department",
      accessorKey: "department",
      accessorFn: (row) => row.department?.name || "-",
    },
    {
      header: "Role",
      accessorKey: "access.name",
      accessorFn: (row) => row.access?.name || "-",
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
            hideDelete={true}
            onView={() => {
              navigate(`${row.original.id}/info`);
            }}
            onEdit={() => {
              navigate(`${row.original.id}/info`);
            }}
            onDelete={() => {}}
          />
        </div>
      ),
    },
  ];

  const users: User[] = useMemo(
    () => registeredMembers?.data.data || [],
    [registeredMembers]
  );
  return (
    <PageOutline>
      <PageHeader title={`Users(${users.length})`} />
      <SearchBar
        placeholder="Search for a user"
        className="max-w-[300px] mb-2"
        id="searchUsers"
        value={searchedUser}
        onChange={handleSearchChange}
      />
      <TableComponent
        columns={usersColumns}
        data={users}
        filter={searchedUser}
        setFilter={setSearchedUser}
        columnFilters={[]}
        setColumnFilters={() => {}}
      />
    </PageOutline>
  );
};

export default UserManagement;
