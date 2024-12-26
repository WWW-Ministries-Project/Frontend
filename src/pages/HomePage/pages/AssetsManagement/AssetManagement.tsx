import GridAsset from "@/assets/GridAsset";
import TableAssets from "@/assets/TableAssets";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import api from "@/utils/apiCalls";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useState from "react-usestateref";
import Button from "../../../../components/Button";
import SearchBar from "../../../../components/SearchBar";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";
import LoaderComponent from "../../Components/reusable/LoaderComponent";
import TableComponent from "../../Components/reusable/TableComponent";
import {
  showDeleteDialog,
  showNotification,
} from "../../utils/helperFunctions";
import AssetCard from "./Components/AssetCard";
import { assetType } from "./utils/assetsInterface";
import { assetsColumns } from "./utils/utils";

const AssetManagement = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [showOptions, setShowOptions] = useState<string | number | null>(null);
  const [tableView, setTableView] = useState(false);
  const { data: assertsData, loading } = useFetch(api.fetch.fetchAssets);
  const {
    executeDelete,
    success,
    error,
    loading: deleteLoading,
  } = useDelete(api.delete.deleteAsset);

  useEffect(() => {
    if (success) {
      showNotification("Asset deleted successfully");
    }
    if (error) {
      showNotification(error.message);
    }
  }, [error, success]);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  const handleShowOptions = (eventId: string | number) => {
    setShowOptions((prevId) => (prevId == eventId ? null : eventId));
  };

  const handleDelete = (id: string | number) => {
    executeDelete(id);
  };
  const showDeleteModal = (val: assetType) => {
    showDeleteDialog(val, handleDelete);
  };

  return (
    <PageOutline>
      <div className="">
        <section className="mt-   ">
          <div className="flex justify-between items-center mb-5">
            <div className="flex justify-start gap-2 items-center  w-2/3">
              <div
                className="flex gap-1 bg-lightGray p-1 rounded-md"
                id="switch"
              >
                <div onClick={() => setTableView(true)}>
                  <TableAssets
                    stroke={tableView ? "#8F95B2" : "#8F95B2"}
                    className={tableView ? "bg-white rounded-md" : ""}
                  />
                </div>
                <div onClick={() => setTableView(false)}>
                  <GridAsset
                    stroke={tableView ? "#8F95B2" : "#8F95B2"}
                    className={
                      tableView
                        ? "bg-lightGray rounded-md"
                        : "bg-white  rounded-md"
                    }
                  />
                </div>
              </div>
              <SearchBar
                className="w-[40.9%] h-10"
                placeholder="Search asserts here..."
                value={filter}
                onChange={handleSearchChange}
              />
            </div>
            <div>
              <Button
                value="Add asset"
                className={" text-white h-10 p-2 bg-primaryViolet"}
                onClick={() => navigate("manage-asset")}
              />
            </div>
          </div>
          {/* <TableComponent /> */}
          {tableView ? (
            <div className="bg-white">
              <TableComponent
                columns={assetsColumns}
                data={assertsData}
                filter={filter}
                setFilter={setFilter}
                displayedCount={12}
              />
            </div>
          ) : (
            <GridComponent
              data={assertsData}
              columns={assetsColumns}
              filter={filter}
              setFilter={setFilter}
              displayedCount={12}
              renderRow={(row) => (
                <AssetCard
                  assets={row.original}
                  key={row.id}
                  onShowOptions={handleShowOptions}
                  showOptions={showOptions === row.original.id}
                  onDelete={showDeleteModal}
                />
              )}
            />
          )}
        </section>
        {(loading || deleteLoading) && <LoaderComponent />}
      </div>
    </PageOutline>
  );
};

export default AssetManagement;
