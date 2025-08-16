import { Button } from "@/components/Button";
import { SearchBar } from "@/components/SearchBar";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { encodeQuery, showDeleteDialog } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActiveAccess } from "../Components/ActiveAccess";
import { AccessRight } from "../utils/settingsInterfaces";

export function AccessRights() {
  const { data, refetch } = useFetch(api.fetch.fetchAccessLevels);
  const { executeDelete: deleteAccess, success: deleteSuccess } = useDelete(
    api.delete.deleteAccess
  );
  const accessRights = useMemo(() => data?.data || [], [data]);
  const [filter, setFilter] = useState("");
  const [selectedAccessRight, setSelectedAccessRight] =
    useState<AccessRight | null>(null);
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };
  const handleDelete = () => {
    if (!selectedAccessRight) return;
    showDeleteDialog(selectedAccessRight!, () => {
      deleteAccess({ id: String(selectedAccessRight.id) });
    });
  };
  useEffect(() => {
    if (deleteSuccess) {
      refetch();
      setSelectedAccessRight(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteSuccess]);
  return (
    <PageOutline className="p-6">
      <PageHeader
        title="Access Rights"
        buttonValue="Create Access"
        onClick={() => navigate("manage-access")}
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
        {selectedAccessRight && (
          <section className="col-span-2">
            <div className="space-x-2 flex items-center justify-end">
              <Button
                type="button"
                value="Delete"
                onClick={() => handleDelete()}
                variant="ghost"
              />
              <Button
                type="button"
                value="Edit"
                onClick={() =>
                  navigate(
                    `manage-access?access_id=${encodeQuery(
                      selectedAccessRight?.id
                    )}`
                  )
                }
                variant="secondary"
              />
            </div>

            <ActiveAccess
              name={selectedAccessRight?.name || ""}
              permissions={selectedAccessRight?.permissions || {}}
            />
          </section>
        )}
      </section>
    </PageOutline>
  );
}

const accessColumns = [{ header: "All Access Rights", accessorKey: "name" }];
