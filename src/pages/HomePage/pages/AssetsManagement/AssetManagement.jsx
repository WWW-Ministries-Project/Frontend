import { useEffect } from "react";
import useState from "react-usestateref";
import Button from "../../../../components/Button";
import SearchBar from "../../../../components/SearchBar";
import { baseUrl } from "../../../Authentication/utils/helpers";
import InputDiv from "../../Components/reusable/InputDiv";
import SelectField from "../../Components/reusable/SelectField";
import TableComponent from "../../Components/reusable/TableComponent";
import TextField from "../../Components/reusable/TextField";
import FormsComponent from "../Settings/Components/FormsComponent";
import Dialog from "/src/components/Dialog";
import { DateTime } from "luxon";
import deleteIcon from "/src/assets/delete.svg";
import edit from "/src/assets/edit.svg";
import axios, { pictureInstance as axiosFile } from "/src/axiosInstance.js";
import { useNavigate } from "react-router-dom";
import PageOutline from "../../Components/PageOutline";
import useSettingsStore from "../Settings/utils/settingsStore";
import AssetCard from "./Components/AssetCard";
import GridAsset from "/src/assets/GridAsset";
import TableAssets from "/src/assets/TableAssets";
import ProfilePicture from "/src/components/ProfilePicture";
import { deleteData } from "/src/pages/HomePage/pages/Settings/utils/helperFunctions";
import GridWrapper from "/src/Wrappers/GridWrapper";
import { assetsColumns } from "./utils/utils";

const AssetManagement = () => {
  const navigate = useNavigate();
  const [displayForm, setDisplayForm] = useState(false);
  const [assertsData, setAssertsData, assertsDataRef] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ path: "", id: "", name: "", index: "" });
  const selectOptions = [{ name: "department", value: "department" }];
  const [tableView, setTableView] = useState(false);
  const [inputValue, setInputValue, inputValueRef] = useState({ name: "" });
  const [profilePic, setProfilePic] = useState({});
  const { departmentsOptions } = useSettingsStore();
  function changePic(pic) {
    setProfilePic(() => pic);
  }
  const [showModal, setShowModal] = useState(false);
 

  useEffect(() => {
    axios.get(`${baseUrl}/assets/list-assets`).then((res) => {
      setAssertsData(res.data.data);
    });
  }, []);
  const handleSearchChange = (e) => {
    setFilter(e.target.value);
  };
  const handleShowModal = () => {
    setShowModal(prev => !prev)
  }
  const handleDelete = () => {
    deleteData(itemToDelete.path, itemToDelete.id);
    setShowModal(prev => !prev);
    let tempData = assertsDataRef.current;
    tempData.splice(itemToDelete.index, 1)
    setAssertsData([...tempData])
    // switch (itemToDelete.path) {

    // }
  }

  const handleClick = () => {
    setInputValue({ name: "", description: "", date_purchased: "", status: "", price: "", photo: '' });
    setProfilePic({})
    setDisplayForm(true);
    setEditMode(false);
  };

  const handleChange = (name, value) => {
    setInputValue((prev) => ({ ...prev, [name]: value }));
  };
  const handleCloseForm = () => {
    setDisplayForm(false);
  };

  return (
    <PageOutline>
      <div className="">
        <section className="mt-   ">
          <div className="flex justify-between items-center mb-5">
            <div className="flex justify-start gap-2 items-center  w-2/3">
              <div className="flex gap-1 bg-lightGray p-1 rounded-md" id="switch">
                <div onClick={() => setTableView(true)}><TableAssets stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-white rounded-md' : ''} /></div><div onClick={() => setTableView(false)}><GridAsset stroke={tableView ? "#8F95B2" : "#8F95B2"} className={tableView ? 'bg-lightGray rounded-md' : 'bg-white  rounded-md'} /></div>
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
                value="Old Add asset"
                className={
                  " text-white h-10 p-2 gradientBtn"
                }
                onClick={handleClick}
              />
              <Button
                value="Add asset"
                className={
                  " text-white h-10 p-2 bg-primaryViolet hover:gradientBtn"
                }
                onClick={() => navigate('add-asset')}
              />
            </div>
          </div>
          {/* <TableComponent /> */}
          {tableView ? <div className="bg-white">
            <TableComponent
              columns={assetsColumns}
              data={assertsData}
              filter={filter}
              setFilter={setFilter}
            />
          </div> :
            <div>
              <GridWrapper className="2xl:h-[85vh] lg:h-[80vh] md:h-[78vh]  xs:h-[72vh]">
                {assertsData.map((assets) => <AssetCard assets={assets} key={Math.random()} />)}
              </GridWrapper>
            </div>}
        </section>
        <Dialog
          showModal={showModal}
          onClick={handleShowModal}
          data={itemToDelete}
          onDelete={handleDelete}
        />
      </div>
    </PageOutline>
  );
};

export default AssetManagement;
