import { HeaderControls } from "@/components/HeaderControls";
import { ProfilePicture } from "@/components/ProfilePicture";
import { SearchBar } from "@/components/SearchBar";
import { useFetch } from "@/CustomHooks/useFetch";
import { MembersType } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import edit from "/src/assets/edit.svg";

export const UserManagement = () => {
  const { data: registeredMembers } = useFetch(api.fetch.fetchAllMembers, {
    is_user: "true",
  });
  const [searchedUser, setSearchedUser] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const navigate = useNavigate();


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
      accessorKey: "member_id",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    // {
    //   header: "Department",
    //   accessorKey: "department",
    //   accessorFn: (row) => row.department?.name || "-",
    // },
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
              ? "bg-green-500 text-sm h-6 w-20 p-2 flex items-center justify-center rounded-lg text-center text-white "
              : "bg-red-500 text-sm h-6 w-20 p-2 flex items-center justify-center rounded-lg text-center text-lighterBlack"
          }
        >
          {info.getValue() ? "Active" : "Inactive"}
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
            onClick={() => {
              navigate(`${row.original.id}/info`);
            }}
          />
        </div>
      ),
    },
  ];

  const users: User[] = useMemo(
    () => registeredMembers?.data || [],
    [registeredMembers]
  );
  return (
    <PageOutline>
      <HeaderControls
        title="Users"
        totalMembers={users.length}
        setShowSearch={setShowSearch}
        hasFilter={false}
        screenWidth={window.innerWidth}
      />
      {/* <PageHeader title={`Users(${users.length})`} /> */}
      {showSearch && (
        <SearchBar
          placeholder="Search for a user"
          className="max-w-[300px] mb-2"
          id="searchUsers"
          value={searchedUser}
          onChange={handleSearchChange}
        />
      )}
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

interface User extends MembersType {
  is_active: boolean;
  access?: { name: string };
}
