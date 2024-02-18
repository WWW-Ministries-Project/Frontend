import SearchBar from "../../../../components/SearchBar";
import TableComponent from "../../Components/reusable/TableComponent";
import { useOutletContext } from "react-router-dom";
import Button from "../../../../components/Button";
import { useState } from "react";
import { assetsColumns } from "./utils/utils";
import Filter from "../../Components/reusable/Filter";
import FormsComponent from "../Settings/Components/FormsComponent";
const AssetManagement = () => {
    const columns = assetsColumns;
    const { members } = useOutletContext();
    const [displayForm, setDisplayForm] = useState(false);
    const [filter, setFilter] = useState("");
    const [loading,setLoading] = useState(false);
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

            axios.post(`${baseUrl}/department/create-department`, inputValue).then((res) => {
              setLoading(false);
              setData(res.data.data);
            }).catch((err) => {
              console.log(err);
              setLoading(false);
            });
        }
    const selectOptions = [{name:"department",value:"department"}]
    const [inputValue, setInputValue] = useState({created_by:1,name:""});	

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
                        <select
                            name="filter"
                            id="filter"
                            placeholder="Filter"
                            className="h-10 bg-white rounded-md p-1 opacity-50 border border-[#f2f2f2]">
                            <option value="">Filter by</option>
                            <option value="Name">Name</option>
                            <option value="Department">Department</option>
                            <option value="Date">Date created</option>
                        </select>
                        <Filter />
                        <Filter />
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
            <FormsComponent className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-2000 ${displayForm ? "translate-x-0" : "translate-x-full"}`} selectOptions={selectOptions} selectId={"selectedId"} inputValue={inputValue} inputId={"name"} inputLabel={"Asset"} onChange={handleChange} CloseForm={handleCloseForm} onSubmit={handleFormSubmit} loading={loading} />
        </>
    );
}

export default AssetManagement;
