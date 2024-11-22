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

const AssetManagement = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [itemToDelete, setItemToDelete] = useState({
    path: "",
    id: "",
    name: "",
    index: "",
  });
  const [tableView, setTableView] = useState(false);
  const { data } = useFetch(api.fetch.fetchAssets);
  const assetsStore = useStore();
  const assertsData = assetsStore.assets;

  useEffect(() => {
    if (data) {
      assetsStore.setAssets(data?.data.data);
    }
  }, [data]);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  // const handleDelete = () => {
  //   deleteData(itemToDelete.path, itemToDelete.id);
  //   setShowModal(prev => !prev);
  //   let tempData = assertsDataRef.current;
  //   tempData.splice(itemToDelete.index, 1)
  //   setAssertsData([...tempData])
  //   // switch (itemToDelete.path) {

  //   // }
  // }

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
                <AssetCard assets={row.original} key={row.id} />
              )}
            />
          )}
        </section>
      </div>
    </PageOutline>
  );
};

export default AssetManagement;
