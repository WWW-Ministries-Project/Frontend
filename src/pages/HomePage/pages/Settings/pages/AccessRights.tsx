import Button from "@/components/Button";
import SearchBar from "@/components/SearchBar";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { AccessRight, AccessRightOption } from "../utils/settingsInterfaces";
import { useNavigate } from "react-router-dom";
import ActiveAccess from "../Components/ActiveAccess";

const modules: AccessRightOption[] = [
  { id: 1, name: "Members", accessLevel: "Can View" },
  { id: 2, name: "Events", accessLevel: "Can View" },
  { id: 3, name: "My requests", accessLevel: "Can View" },
  { id: 4, name: "Staff request", accessLevel: "Can Manage" },
  { id: 5, name: "Suppliers", accessLevel: "Can Manage" },
  { id: 6, name: "Asset", accessLevel: "Can Manage" },
  { id: 7, name: "Users", accessLevel: "Can Manage" },
  { id: 8, name: "Department", accessLevel: "Can Manage" },
  { id: 9, name: "Positions", accessLevel: "Can Manage" },
  { id: 10, name: "Access rights", accessLevel: "Can Manage" },
];

const accessRights: AccessRight[] = [
  { id: 1, name: "Super Admin" },
  { id: 2, name: "Cashier" },
  { id: 3, name: "Accountant" },
  { id: 4, name: "Product Designer" },
  { id: 5, name: "HR Manager" },
  { id: 6, name: "Overseer" },
  { id: 7, name: "Product Owner" },
  { id: 8, name: "Secretary" },
];
const accessColumns = [{ header: "All Access Rights", accessorKey: "name" }];
const accessColumns2: ColumnDef<AccessRightOption>[] = [
  { header: "Modules / Sub-modules", accessorKey: "name" },
  {
    header: "Access Level Management",
    accessorKey: "accessLevel",
    cell: ({ row }) => TableData(row.original.accessLevel),
  },
];

const AccessRights = () => {
  const [filter, setFilter] = useState("");
  const [selectedAccessRight, setSelectedAccessRight] = useState<AccessRight | null>(null);
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };
  return (
    <PageOutline>
      <PageHeader title="Access Rights" buttonValue="Create Access" onClick={() => navigate("/home/settings/create-access")}></PageHeader>
      <section className="grid gap-24 grid-cols-3">
        <section>
          <div>
            <SearchBar placeholder="Search" className="max-w-[300px] mb-2" onChange={handleSearchChange} value={filter} />
          </div>
          <TableComponent
            columns={accessColumns}
            data={accessRights}
            rowClass="even:bg-white odd:bg-[#F2F4F7]"
            className={" shadow-md"}
            filter={filter}
            setFilter={setFilter}
          />
        </section>

        <ActiveAccess/>
      </section>
    </PageOutline>
  );
};
const TableData = (accessLevel: "Can View" | "Can Manage" | "Super Admin") => {
  return (
    <td className="px-4 py-2">
      <span
        className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-md ${
          accessLevel === "Can Manage" && "bg-yellow-100 text-yellow-600"
        } ${accessLevel === "Can View" && "bg-blue-100 text-blue-600"} ${
          accessLevel === "Super Admin" && "bg-primaryViolet text-primaryViolet"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full mr-2 ${
            accessLevel === "Can Manage" && "bg-yellow-600"
          } ${accessLevel === "Can View" && "bg-blue-600"} ${
            accessLevel === "Super Admin" && "bg-primaryViolet"
          }`}
        ></span>
        {accessLevel}
      </span>
    </td>
  );
};

export default AccessRights;
