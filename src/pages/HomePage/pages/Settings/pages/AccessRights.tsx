import Button from "@/components/Button";
import SearchBar from "@/components/SearchBar";
import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import api from "@/utils/apiCalls";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActiveAccess from "../Components/ActiveAccess";
import { AccessRight, AccessRightOption } from "../utils/settingsInterfaces";

const AccessRights = () => {
  const { data } = useFetch<{ data: { data: AccessRight[] } }>(
    api.fetch.fetchAccessLevels
  );
  const accessRights = useMemo(() => data?.data.data || [], [data]);
  const [filter, setFilter] = useState("");
  const [selectedAccessRight, setSelectedAccessRight] =
    useState<AccessRight | null>(null);
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };
  return (
    <PageOutline>
      <PageHeader
        title="Access Rights"
        buttonValue="Create Access"
        onClick={() => navigate("/home/settings/create-access")}
      ></PageHeader>
      <section className="grid gap-24 grid-cols-3">
        <section>
          <div>
            <SearchBar
              placeholder="Search"
              className="max-w-[300px] mb-2"
              onChange={handleSearchChange}
              value={filter}
            />
          </div>
          <TableComponent
            columns={accessColumns}
            data={accessRights}
            rowClass="even:bg-white odd:bg-[#F2F4F7]"
            className={" shadow-md"}
            filter={filter}
            setFilter={setFilter}
            onRowClick={(data: AccessRight) => setSelectedAccessRight(data)}
          />
        </section>
        <section className="col-span-2">
          <div className="space-x-2 flex items-center justify-end">
            <Button
              type="button"
              value="Close"
              onClick={() => alert("Close clicked")}
              className="tertiary"
            />
            <Button
              type="button"
              value="Edit"
              onClick={() =>
                navigate(
                  `/home/settings/create-access?access_id=${selectedAccessRight?.id}`
                )
              }
              className="secondary"
            />
          </div>
          <ActiveAccess name={selectedAccessRight?.name || ""} permissions={selectedAccessRight?.permissions || {}} />
        </section>
      </section>
    </PageOutline>
  );
};

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

const accessColumns = [{ header: "All Access Rights", accessorKey: "name" }];

export default AccessRights;
