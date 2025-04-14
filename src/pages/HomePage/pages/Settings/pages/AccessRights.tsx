import Button from "@/components/Button";
import SearchBar from "@/components/SearchBar";
import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { api } from "@/utils/api/apiCalls";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActiveAccess from "../Components/ActiveAccess";
import { AccessRight } from "../utils/settingsInterfaces";

const AccessRights = () => {
  const { data, loading } = useFetch(
    api.fetch.fetchAccessLevels
  );
  const accessRights = useMemo(() => data?.data || [], [data]);
  const [filter, setFilter] = useState("");
  const [selectedAccessRight, setSelectedAccessRight] =
    useState<AccessRight | null>(null);
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };
  return (
    <div className="p-4">
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
            {selectedAccessRight && (
              <ActiveAccess
                name={selectedAccessRight?.name || ""}
                permissions={selectedAccessRight?.permissions || {}}
              />
            )}
          </section>
        </section>
        {loading && <LoaderComponent />}
      </PageOutline>
    </div>
  );
};

const accessColumns = [{ header: "All Access Rights", accessorKey: "name" }];

export default AccessRights;
