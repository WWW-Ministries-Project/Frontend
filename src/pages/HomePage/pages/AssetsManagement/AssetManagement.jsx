import SearchBar from "../../../../components/SearchBar";
import TableComponent from "../../Components/reusable/TableComponent";
import { useOutletContext } from "react-router-dom";
import Button from "../../../../components/Button";
import { useEffect, useState } from "react";
import { assetsColumns } from "./utils/utils";
import Filter from "../../Components/reusable/Filter";
import FormsComponent from "../Settings/Components/FormsComponent";
import { baseUrl } from "../../../Authentication/utils/helpers";
import InputDiv from "../../Components/reusable/InputDiv";
import ProfilePicture from "/src/components/ProfilePicture";
import TextField from "../../Components/reusable/TextField";
import SelectField from "../../Components/reusable/SelectField";
import axios from "/src/axiosInstance.js";
import { decodeToken } from "/src/utils/helperFunctions";
const AssetManagement = () => {
    const columns = assetsColumns;
    const { members } = useOutletContext();
    const [displayForm, setDisplayForm] = useState(false);
    const [filter, setFilter] = useState("");
    const [loading,setLoading] = useState(false);
    const selectOptions = [{name:"department",value:"department"}]
    const [inputValue, setInputValue] = useState({userId:decodeToken().id,name:""});	

    useEffect(() => {
        axios.get(`${baseUrl}/assets/list-assets`).then((res) => {
        //   setDepartmentData(res.data.data);
        });
    },[]);
    const handleSearchChange = (e) => {
        setFilter(e.target.value);
    };

    const handleClick = () => {
        setDisplayForm(true);
    };

    const handleChange = (name, value) =>{
        setInputValue((prev) => ({ ...prev, [name]: value }));
        console.log(inputValue,"changed");
    }
    const handleCloseForm =()=> {
        setDisplayForm(false);
      }

    const handleFormSubmit = () => {
        setLoading(true);

        axios.post(`${baseUrl}/assets/create-asset`, inputValue).then((res) => {
            setLoading(false);
            // setData(res.data.data);
        }).catch((err) => {
            console.log(err);
            setLoading(false);
        });
    }
    

    return (
        <>
            <section className="mt-6 bg-white p-7 ">
                <div className="flex justify-between items-center mb-5">
                    <div className="flex justify-start gap-2 items-center  w-2/3">
                        <SearchBar
                            className="w-[40.9%] h-10"
                            placeholder="Search members here..."
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
                            className={" text-white h-10 p-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 transition duration-300 hover:bg-gradient-to-l hover:scale-105"}
                            onClick={handleClick}
                        />
                    </div>
                </div>
                {/* <TableComponent /> */}
                <div>
                    <TableComponent
                        columns={columns}
                        data={members}
                        filter={filter}
                        setFilter={setFilter}
                    />
                </div>
            </section>
            <FormsComponent className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-2000 ${displayForm ? "translate-x-0" : "translate-x-full"}`} selectOptions={selectOptions} selectId={"selectedId"} inputValue={inputValue} inputId={"name"} inputLabel={"Asset"} onChange={handleChange} CloseForm={handleCloseForm} onSubmit={handleFormSubmit} loading={loading} >
            <form className="mt-5">
                <div className=" border-2 border-[#F5F5F5] rounded-md p-2 py-10">
                    <div className="flex flex-col gap-5">
                        <div className="grid grid-cols-3 gap-1 items-center pb-5 border-b border-[#F5F5F5]">
                            <ProfilePicture className="w-20 h-20 col-span-1" alt="picture of asset"/>
                            <div className="col-span-2 flex flex-col gap-2">
                                <InputDiv id={"name"} placeholder={"Enter asset name"} onChange={handleChange} inputClass="!border-2" />
                                <InputDiv id={"asset_code"} placeholder={"Enter asset code"} onChange={handleChange} inputClass="!border-2" />
                            </div>
                        </div>
                        <div className="w-3/4 gap-4 flex flex-col ">
                            <InputDiv id={"category"} label={"Categories"} placeholder={"Enter categories"} onChange={handleChange} inputClass="!border-2"  />
                            <InputDiv id={"date_purchased"} label={"Date Purchased"} placeholder={"Enter date purchased"} onChange={handleChange} type={"date"} inputClass="!border-2" />
                            <InputDiv id={"price"} label={"Price"} placeholder={"Enter amount here"} onChange={handleChange} inputClass="!border-2" />
                        </div>
                        <TextField  label={"Description/Specification"} placeholder={"Enter asset’s description or specifications..."} onChange={handleChange} />
                        <SelectField label={"Status"} options={[{name:"Assigned",value:1},{name:"Unassigned",value:0}]} id="status" value={inputValue.status} onChange={handleChange}
                        placeholder={"Select status"} />
                    </div>
                </div>
                <div className="flex gap-2 justify-end mt-10">
                        <Button
                            value="Close"
                            className={" p-3 bg-white border border-[#F5F5F5] text-dark900"}
                            onClick={handleCloseForm}
                        />
                        <Button value={'Submit'} className={" p-3 text-white"} onClick={handleFormSubmit} loading={loading} />
                    </div>
            </form>
            </FormsComponent>
        </>
    );
}

export default AssetManagement;
