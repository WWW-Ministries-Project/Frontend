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
// import { assetsColumns } from "./utils/utils";
import { DateTime } from "luxon";
import deleteIcon from "/src/assets/delete.svg";
import edit from "/src/assets/edit.svg";
import axios, { pictureInstance as axiosFile } from "/src/axiosInstance.js";
// import axios from "axios";
import ProfilePicture from "/src/components/ProfilePicture";
import { deleteData } from "/src/pages/HomePage/pages/Settings/utils/helperFunctions";
import GridWrapper from "/src/Wrappers/GridWrapper";
import AssetCard from "./AssetCard";
import TableAssets from "/src/assets/TableAssets";
import GridAsset from "/src/assets/GridAsset";

const AssetManagement = () => {
  // const columns = assetsColumns;
  // const { members } = useOutletContext();
  const [displayForm, setDisplayForm] = useState(false);
  const [assertsData, setAssertsData, assertsDataRef] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ path: "", id: "", name: "", index: "" });
  const selectOptions = [{ name: "department", value: "department" }];
  const [tableView, setTableView] = useState(false);
  // const [inputValue, setInputValue] = useState({userId:decodeToken().id,name:""});
  const [inputValue, setInputValue, inputValueRef] = useState({ name: "" });
  const [profilePic, setProfilePic] = useState({});
  function changePic(pic) {
    setProfilePic(() => pic);
  }
  const [showModal, setShowModal] = useState(false);
  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ProfilePicture
            src={row.original.photo}
            name={row.original.name}
            alt="profile pic"
            className="h-[38px] w-[38px] rounded-full"
          />{" "}
          {row.original.name}
        </div>
      ),
    },
    // {
    //   header: "Name",
    //   accessorKey: "name",
    // },
    // {
    //   header: "Category",
    //   accessorKey: "department",
    //   cell: (info) => info.getValue()?.name ?? "N/A",
    // },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Date Purchased",
      accessorKey: "date_purchased",
      cell: (info) =>
        DateTime.fromISO(info.getValue()).toLocaleString(DateTime.DATE_FULL),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info) => (
        <div
          className={`text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center ${info.getValue() === "ASSIGNED"
            ? "bg-green text-white"
            : "bg-neutralGray text-lighterBlack"
            }  `}
        >
          {info.getValue() === "ASSIGNED" ? "Assigned" : "Unassigned"}
        </div>
      ),
    },
    {
      header: "Actions",
      // accessorKey: "status",
      cell: ({ row }) => (
        <div
          className={
            "text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center text-white "
          }
        >
          <img
            src={edit}
            alt="edit icon"
            className="cursor-pointer"
            onClick={() => {
              setInputValue(() => ({
                id: row.original?.id,
                name: row.original?.name,
                description: row.original?.description,
                date_purchased: row.original?.date_purchased,
                status: row.original?.status,
                price: row.original?.price,
                photo: row.original.photo
              }));
              setEditMode(true);
              setDisplayForm(true);
            }}
          />
          <img src={deleteIcon} alt="delete icon" className="cursor-pointer" onClick={() => {
            handleShowModal()
            setItemToDelete({ path: "assets/delete-asset", id: row.original?.id, name: row.original?.name, index: row.index })
          }} />
        </div>
      ),
    },
  ];

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

  const handleFormSubmit = async () => {
    setLoading(true);
    const data = new FormData();
    data.append("file", profilePic.picture);
    const endpoint = "/upload";
    const path = `${baseUrl}${endpoint}`;
    try {
      const response = profilePic.picture && await axiosFile.post(path, data);
      if (profilePic.picture && response.status === 200) {
        const link = response.data.result.link;
        setInputValue(prev => ({ ...prev, photo: link }))
        setProfilePic({});
      }

      if (editMode) {
        axios
          .put(`${baseUrl}/assets/update-asset`, inputValueRef.current)
          .then((res) => {
            setLoading(false);
            // setData(res.data.data);
            setAssertsData(prev => prev.map(data => {
              if (data.id !== res.data.updatedAsset) return data
              else return res.data.updatedAsset
            }))
            setDisplayForm(false);
            setEditMode(false);
            setInputValue({ name: "", description: "", date_purchased: "", status: "", price: "" });
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
          });
      }
      else {
        axios
          .post(`${baseUrl}/assets/create-asset`, inputValueRef.current)
          .then((res) => {
            setLoading(false);
            // setData(res.data.data);
            setAssertsData(prev => [res.data.asset, ...prev]);
            setDisplayForm(false);
            setInputValue({ name: "", description: "", date_purchased: "", status: "", price: "" });
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
          });
      }

    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  return (
    <>
      <section className="mt-6   ">
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
            {/* <select
                            name="filter"
                            id="filter"
                            placeholder="Filter"
                            className="h-10 bg-white rounded-md p-1 opacity-50 border border-[#f2f2f2]">
                            <option value="">Filter by</option>
                            <option value="Name">Name</option>
                            <option value="Department">Department</option>
                            <option value="Date">Date created</option>
                        </select>
                        <Filter /> */}
            {/* <Filter /> */}
            {/* <select name="filter" id="filter" placeholder="Filter" className="h-10 bg-white rounded-md p-1 opacity-50 border border-[#f2f2f2]">
                <option value="">Filter by</option>
                <option value="Name">Name</option>
                <option value="Department">Department</option>
                <option value="Date">Date created</option>
             </select> */}
          </div>
          <div>
            <Button
              value="Add asset"
              className={
                " text-white h-10 p-2 gradientBtn"
              }
              onClick={handleClick}
            />
          </div>
        </div>
        {/* <TableComponent /> */}
        {tableView?<div className="bg-white">
          <TableComponent
            columns={columns}
            data={assertsData}
            filter={filter}
            setFilter={setFilter}
          />
        </div>:
        <div>
        <GridWrapper>
          {assertsData.map((assets) => <AssetCard assets={assets} key={Math.random()} />)}
          {console.log("Props", assertsData)}
          {/* {events.map((event) => <EventsCard event={event} key={Math.random()} onNavigate={handleNavigation} />)} */}
        </GridWrapper>
        </div>}
      </section>
      <FormsComponent
        className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-2000 ${displayForm ? "translate-x-0" : "translate-x-full"
          }`}
        selectOptions={selectOptions}
        selectId={"selectedId"}
        // inputValue={inputValue}
        inputId={"name"}
        inputLabel={"Asset"}
        onChange={handleChange}
        CloseForm={handleCloseForm}
        onSubmit={handleFormSubmit}
        loading={loading}
      >
        <form className="mt-5">
          <div className=" border-2 border-[#F5F5F5] rounded-md p-2 py-10">
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-1 items-center pb-5 border-b border-[#F5F5F5]">
                {/* <ProfilePicture
                  className="w-20 h-20 col-span-1"
                  alt="picture of asset"
                  editable={true}
                /> */}
                <ProfilePicture
                  src={profilePic.src || inputValue.photo}

                  editable={true}
                  text={""}
                  alt="profile pic"

                  name={"firstname"}
                  alternative="edit button"
                  className="w-20 h-20 profilePic transition-all duration-1000 mx-auto"
                  textClass={"text-[32px] leading-[36px] mx-8 "}
                  onChange={changePic}
                  id={"pic"}
                />
                <div className="col-span-2 flex flex-col gap-2">
                  <InputDiv
                    id={"name"}
                    placeholder={"Enter asset name"}
                    onChange={handleChange}
                    inputClass="!border-2"
                    value={inputValue.name}
                  />
                  {/* <InputDiv id={"asset_code"} placeholder={"Enter asset code"} onChange={handleChange} inputClass="!border-2" /> */}
                </div>
              </div>
              <div className="w-3/4 gap-4 flex flex-col ">
                {/* <InputDiv id={"category"} label={"Categories"} placeholder={"Enter categories"} onChange={handleChange} inputClass="!border-2"  /> */}
                <InputDiv
                  id={"date_purchased"}
                  label={"Date Purchased"}
                  placeholder={"Enter date purchased"}
                  onChange={handleChange}
                  type={"date"}
                  inputClass="!border-2"
                  value={inputValue.date_purchased}
                />
                <InputDiv
                  id={"price"}
                  label={"Price"}
                  placeholder={"Enter amount here"}
                  onChange={handleChange}
                  inputClass="!border-2"
                  type="number"
                  value={inputValue.price}
                />
              </div>
              <TextField
                label={"Description/Specification"}
                placeholder={"Enter asset’s description or specifications..."}
                onChange={handleChange}
                value={inputValue.description}
              />
              <SelectField
                label={"Status"}
                options={[
                  { name: "Assigned", value: "ASSIGNED" },
                  { name: "Unassigned", value: "UNASSIGNED" },
                ]}
                id="status"
                value={inputValue.status}
                onChange={handleChange}
                placeholder={"Select status"}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-10">
            <Button
              value="Close"
              className={" p-3 bg-white border border-[#F5F5F5] text-dark900"}
              onClick={handleCloseForm}
            />
            <Button
              value={"Submit"}
              className={" p-3 text-white"}
              onClick={handleFormSubmit}
              loading={loading}
              disabled={!inputValue.name}
            />
          </div>
        </form>
      </FormsComponent>
      <Dialog
        showModal={showModal}
        onClick={handleShowModal}
        data={itemToDelete}
        onDelete={handleDelete}
      />
    </>
  );
};

export default AssetManagement;
