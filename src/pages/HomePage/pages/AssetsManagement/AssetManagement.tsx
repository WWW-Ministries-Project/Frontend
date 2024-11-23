import GridAsset from "@/assets/GridAsset";
import TableAssets from "@/assets/TableAssets";
import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import api from "@/utils/apiCalls";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useState from "react-usestateref";
import Button from "../../../../components/Button";
import SearchBar from "../../../../components/SearchBar";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";
import TableComponent from "../../Components/reusable/TableComponent";
import AssetCard from "./Components/AssetCard";
import { assetsColumns } from "./utils/utils";
import { showDeleteDialog, showNotification } from "../../utils/helperFunctions";
import { assetType } from "./utils/assetsInterface";
import { useDelete } from "@/CustomHooks/useDelete";

const AssetManagement = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [showOptions, setShowOptions] = useState<string | number | null>(null);
  const [itemToDelete, setItemToDelete] = useState({
    path: "",
    id: "",
    name: "",
    index: "",
  });
  const [tableView, setTableView] = useState(false);
  const { data } = useFetch(api.fetch.fetchAssets);
  const { executeDelete, success,error } = useDelete(api.delete.deleteAsset);
  const assetsStore = useStore();
  const assertsData = assetsStore.assets;

  useEffect(() => {
    if (data) {
      assetsStore.setAssets(data?.data.data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      showNotification(error.message);
    }
  }, [error]);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  const handleShowOptions = (eventId: string | number) => {
    setShowOptions((prevId) => (prevId == eventId ? null : eventId));
  };

  const handleDelete = (id: string | number) => {
    executeDelete(id);
  }
  const showDeleteModal =(val:assetType)=>{
    showDeleteDialog(val, handleDelete)
  }

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
                onClick={() => navigate("add-asset")}
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
      </div>
    </PageOutline>
  );
};

export default AssetManagement;
