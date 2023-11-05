
import { useEffect, useState } from "react";
import TableComponent from "../../Components/reusable/TableComponent";
import SearchBar from "../../../../components/SearchBar";
import { useOutletContext } from "react-router-dom";
import Button from "../../../../components/Button";
import Filter from "../../Components/reusable/Filter";
import axios from "axios";
import { baseUrl } from "../../../Authentication/utils/helpers";
function Settings() {
    const {filter,setFilter, handleSearchChange} = useOutletContext();
    const tabs = ["Department", "Position", "Access Rights"];
    const [selectedTab, setSelectedTab] = useState(tabs[0]);
    const [data, setData] = useState([]);

    const columns = [
        {
          header: "Name",
          accessorKey: "name",
        },
        {
          header: "Department Head",
          accessorKey: "department_head",
        },
        {
          header: "Description",
          accessorKey: "description",
        },
        {
          header: "Status",
          accessorKey: "status",
          cell: (info) => (
            <div
              className={
                info.getValue()
                  ? "bg-green text-sm h-6 flex items-center justify-center rounded-lg text-center text-white "
                  : "bg-neutralGray text-sm h-6 flex items-center justify-center rounded-lg text-center text-lighterBlack"
              }>
              {info.getValue() ? "Active" : "Inactive"}
            </div>)
        },
      ]

    useEffect(() => {
        axios.get(`${baseUrl}/department/list-departments`).then((res) => {
            setData(res.data);
          });
    },[])

    const handleSearch = (e) => {
        handleSearchChange(e.target.value);
    }

    const handleTabSelect = (tab) => {
        setSelectedTab(tab);
    }

  return (
    <>
      <section className={" h-full flex flex-col  "}>
        <div className="H600 text-dark900">Settings</div>
        <p className="P200 text-gray">
          Manage your departments, positions and access rights here...
        </p>
        <div className="flex mt-2 mb-6">
            {
                tabs.map((tab) => {
                    return (
                        <div
                            className="bg-white rounded shadow text-center h-10 px-2 flex items-center justify-center  border border-[#EEF2F4] cursor-pointer w-40"
                            onClick={() => handleTabSelect(tab)}
                            key={tab}
                        >
                            {tab}
                        </div>
                    );
                })
            }
        </div>
        <div className="H600 text-dark900"> {selectedTab}</div>
        <section className="mt-6 bg-white p-7">
        <div className="flex justify-between items-center mb-5">
            <div className="flex justify-start gap-2 items-center  w-2/3">
             <SearchBar className="w-[40.9%] h-10" placeholder='Search members here...' value={filter} onChange={handleSearch} /> 
             <Filter/>
            </div>
            <div>
              <Button value={"Create " + selectedTab} className={" text-white h-10 p-2"} onClick={()=>{}}/>
            </div>
        </div>
        <TableComponent
              columns={columns}
              data={ [
                {
                    "id": 1,
                    "name": "Choir",
                    "department_head": 1,
                    "description": "This is a test Data",
                    "created_by": 1,
                    "created_at": "2023-11-01T14:56:39.142Z",
                    "updated_by": null,
                    "updated_at": null
                }
            ]}
              filter={filter}
              setFilter={setFilter}
            />
        </section>
      </section>
    </>
  );
}

export default Settings;
