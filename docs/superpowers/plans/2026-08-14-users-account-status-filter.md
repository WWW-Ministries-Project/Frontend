# Users Account Status Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Active/Inactive account-status filter to the Settings > Users list, matching the existing Members page pattern, with no backend changes.

**Architecture:** `UserManagement.tsx` currently fetches with a single hardcoded query object and does ad-hoc `refetchMembers({...})` calls from the search box and the pagination component — a call site (pagination) already drops the search term, an existing latent bug. This plan replaces that with one derived `usersQuery` (`useMemo`, mirroring the sibling `Members.tsx`'s `membersQuery`), built from `page`/`limit`/`appliedSearch`/`statusFilter` state, passed straight into `useFetch`. `useFetch` re-fetches automatically whenever the query's JSON signature changes (`src/CustomHooks/useFetch.ts:61,97-99`), so no manual `refetchMembers()` calls are needed anywhere — search, pagination, and the new filter all compose instead of clobbering each other. This is a necessary fix, not scope creep: without it, changing page would silently drop the new status filter.

**Tech Stack:** React + TypeScript, Formik-free (plain `<select>` via the shared `Filter` component), Tailwind, no new deps.

Full spec: `docs/superpowers/specs/2026-08-14-users-account-status-filter-design.md`

---

### Task 1: Create the `UsersFilter` component

**Files:**
- Create: `src/pages/HomePage/pages/Users/Components/UsersFilter.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import Filter from "@/pages/HomePage/Components/reusable/Filter";

interface UsersFilterProps {
  value: string;
  onChange: (name: string, value: string) => void;
}

const accountStatusOptions: ISelectOption[] = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const UsersFilter = ({ value, onChange }: UsersFilterProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Filter
        name="is_active"
        className="w-full"
        label="Account Status"
        placeholder="All statuses"
        options={accountStatusOptions}
        onChange={onChange}
        value={value}
      />
    </div>
  );
};

export default UsersFilter;
```

This mirrors `src/pages/HomePage/pages/Members/Components/MembersFilter.tsx:34-37,86-94` exactly (same `activeStateOptions` values, same `Filter` usage), reduced to the one field Users needs. Default export matches that file's convention.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `UsersFilter.tsx` (pre-existing unrelated errors elsewhere, if any, are not this task's concern — confirm none are new).

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage/pages/Users/Components/UsersFilter.tsx
git commit -m "feat: add UsersFilter account-status dropdown component"
```

---

### Task 2: Wire the filter into `UserManagement.tsx`

**Files:**
- Modify: `src/pages/HomePage/pages/Users/UserManagement.tsx` (full-file replacement below — the changes touch imports, state, the derived query, and the JSX in ways that are clearer shown whole than as fragment diffs)

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `src/pages/HomePage/pages/Users/UserManagement.tsx` with:

```tsx
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";

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
  const [searchedUser, setSearchedUser] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>()

  const usersQuery = useMemo(() => {
    const query: QueryType = {
      is_user: "true",
      page: String(page),
      limit: String(limit),
    };
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
    setPage(1);
    setAppliedSearch(searchedUser);
  };

  const handleStatusFilterChange = (_name: string, value: string) => {
    setPage(1);
    setStatusFilter(value);
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
          onPageChange={(newPage, newLimit) => {
            setPage(newPage);
            setLimit(newLimit);
          }}
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
```

Notable diffs from the original, and why each is here:
- `hasFilter={false}` → `true`, plus `showFilter`/`setShowFilter` passed through — turns on the existing `HeaderControls` filter-toggle button (`src/components/HeaderControls.tsx:99-110`).
- New `usersQuery` (`useMemo`) replaces the old inline `{ is_user: "true" }` passed to `useFetch`, and replaces every ad-hoc `refetchMembers({...})` call. `useFetch` refetches on its own whenever this query's JSON signature changes, so `handleSearchSubmit`, `handleStatusFilterChange`, and `onPageChange` only need to update state — no manual refetch calls, and no call site can drop another filter's field anymore (the pagination call previously dropped `name` on every page change: original `onPageChange={(page, limit) => { refetchMembers({ limit: String(limit), page: String(page) }); }}`).
- `displayedCount={12}` → `displayedCount={limit}` so it stays correct if `TableComponent` ever changes the page size.
- Everything else (columns, modal, crumbs, empty state) is untouched.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `UserManagement.tsx`.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: exits 0 (repo lint is `--max-warnings 0` — any warning fails it).

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, log in, navigate to Settings > Users.
Check:
- "Filters" button now appears in the header and toggles the panel open/closed.
- Selecting "Active" shows only active users; "Inactive" shows only inactive; the blank "All statuses" option (auto-added by `Filter.tsx:39-41` since neither option has `value === ""`) clears back to the full list.
- Typing in the search box and submitting still filters by name, and still composes with an active status filter (set a status filter, then search — both apply together).
- Paging through results (if there are enough users to paginate) preserves both the search term and the status filter instead of resetting them.

- [ ] **Step 5: Commit**

```bash
git add src/pages/HomePage/pages/Users/UserManagement.tsx
git commit -m "feat: add account status filter to Settings > Users

Reuses the is_active query param the Members page and backend
already support. Also fixes pagination silently dropping the
active search/filter, since the new filter needs page changes
to preserve it too."
```

---

## Self-Review Notes

- **Spec coverage:** Spec's "Frontend changes" section (both files) → Task 1 + Task 2. "Data flow" steps 1-4 → `handleStatusFilterChange`/`usersQuery`/`useFetch` wiring in Task 2. "Error handling / edge cases" (clear filter, combine with search, no separate loading state) → covered by the `usersQuery` merge and manual-verification checklist. "Testing" (no test runner, manual only) → Task 2 Step 4.
- **No backend task** — intentional per spec; `is_active` already supported server-side.
- **Type consistency:** `UsersFilterProps.onChange` signature `(name: string, value: string) => void` matches `Filter`'s `onChange` prop (`Filter.tsx:6`) and `handleStatusFilterChange`'s signature in `UserManagement.tsx`.
