import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { HeaderControls } from "@/components/HeaderControls";
import EmptyState from "@/components/EmptyState";
import { ProfilePicture } from "@/components/ProfilePicture";
import { SearchBar } from "@/components/SearchBar";
import { useFetch } from "@/CustomHooks/useFetch";
import { MembersType, relativePath } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { QueryType } from "@/utils/interfaces";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { Modal } from "@/components/Modal";
import { ViewUser } from "./pages/ViewUser";
import UsersFilter from "./Components/UsersFilter";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

export const UserManagement = () => {
  // page/take live in the URL because TableComponent's pagination widget
  // (PaginationComponent -> usePaginate -> usePaginationQueryParams) reads
  // and writes them there directly, independent of any local state passed
  // in. Mirroring that here (same param names) keeps a single source of
  // truth instead of two page counters drifting apart - see Members.tsx,
  // which uses the same pattern.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const limit = Math.max(Number(searchParams.get("take")) || 12, 1);

  const [searchedUser, setSearchedUser] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>()

  const resetToFirstPage = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", "1");
    setSearchParams(nextParams, { replace: true });
  };

  const usersQuery = useMemo(() => {
    const query: QueryType = {
      page: String(page),
      limit: String(limit),
    };
    // Default view is accounts-only (is_user=true). Once an Account Status
    // filter is applied, that restriction is dropped so "Inactive"/"Active"
    // matches against all members with that status, not just the ones
    // flagged as accounts — otherwise the filter silently only ever
    // surfaces the tiny is_user=true subset (e.g. 2 of 68 inactive
    // members), which reads as "the filter is broken."
    if (!statusFilter) query.is_user = "true";
    if (appliedSearch) query.name = appliedSearch;
    if (statusFilter) query.is_active = statusFilter;
    return query;
  }, [appliedSearch, statusFilter, page, limit]);

  const { data: registeredMembers } = useFetch(api.fetch.fetchAllMembers, usersQuery);

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    { label: "User Management", link: "" },
  ];
  const total = registeredMembers?.meta?.total || 0;


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchedUser(e.target.value);
  };

  const handleSearchSubmit = () => {
    setAppliedSearch(searchedUser);
    resetToFirstPage();
  };

  const handleStatusFilterChange = (_name: string, value: string) => {
    setStatusFilter(value);
    resetToFirstPage();
  };

  const handleEditing = (id: string) => {
    setSelectedUserId(id)
    setIsModalOpen(true)
  }

  //displayed headers for table
  const usersColumns: ColumnDef<User>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div
          className="flex items-center gap-2 "

        >
          <ProfilePicture
            src={row.original.photo}
            name={row.original.name}
            alt="profile pic"
            className={`h-[38px] w-[38px] rounded-full border ${row.original.is_active ? "border-green" : "border-error"
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
              : "bg-red-500 text-sm h-6 w-20 p-2 flex items-center justify-center rounded-lg text-center text-white"
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
            "text-sm h-6 flex  gap-2 rounded-lg text-center text-white "
          }
          onClick={() => {
            handleEditing(`${row.original.id}`)
          }}
        >

          <PencilSquareIcon height={24} className="text-gray-800" />
        </div>
      ),
    },
  ];

  const users: User[] = useMemo(
    () => registeredMembers?.data || [],
    [registeredMembers]
  );
  return (
    <PageOutline crumbs={crumbs}>
      <HeaderControls
        title={`Users (${users.length})`}
        setShowSearch={setShowSearch}
        hasFilter={true}
        showFilter={showFilter}
        setShowFilter={setShowFilter}
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
          onSubmit={handleSearchSubmit}
        />
      )}
      {showFilter && (
        <div className="mb-4 rounded-2xl border border-lightGray bg-[#fafbfc] p-4">
          <UsersFilter value={statusFilter} onChange={handleStatusFilterChange} />
        </div>
      )}
      { }
      {users.length === 0 ? (
        <EmptyState
          scope="page"
          msg="No users found"
          description="No ministry workers are currently configured as users."
        />
      ) : (
        <TableComponent
          columns={usersColumns}
          data={users}
          columnFilters={[]}
          setColumnFilters={() => { }}
          displayedCount={limit}
          total={total}
          onPageChange={() => { }}
        />
      )}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ViewUser
          id={`${selectedUserId}`}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </PageOutline>
  );
};

interface User extends MembersType {
  is_active: boolean;
  access?: { name: string };
}
