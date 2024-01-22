
import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import useState from "react-usestateref";
import axios from "../../../../axiosInstance.js";
import Button from "../../../../components/Button";
import SearchBar from "../../../../components/SearchBar";
import { baseUrl } from "../../../Authentication/utils/helpers";
import Filter from "../../Components/reusable/Filter";
import TableComponent from "../../Components/reusable/TableComponent";
import AccessForm from "./Components/AccessForm.jsx";
import FormsComponent from "./Components/FormsComponent";
import { accessColumns, departmentColumns, positionsColumns } from "./utils/helperFunctions";
function Settings() {
  const { filter, setFilter, handleSearchChange, members, departmentData } = useOutletContext();
  const tabs = ["Department", "Position", "Access Rights"];
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const [data, setData] = useState([]);
  // const [departmentData, setDepartmentData] = useState([]);
  const [positionData, setPositionData] = useState([]);
  const [accessData, setAccessData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [displayForm, setDisplayForm] = useState(false);
  const [inputValue, setInputValue] = useState({created_by:1,name:""});
  const [selectedId, setSelectedId] = useState("department_head");
  const [loading, setLoading] = useState(false);

  // const departmentData = departmentDataRef.current;



//Forms Component
  const selectOptions = useMemo(() => {
    switch (selectedTab) {
      case "Department": {
        return members.map((member) => {
          return {name:member.name, value:member.id}
        })
      }
      case "Position": {
        return departmentData.map((department) => {
          return { name: department.name, value: department.id };
        })
      }
      case "Access Rights": {
        return ["view", "edit", "create"];
      }
    }
  }, [members, selectedTab])

  const handleChange = (name, value) =>{
    setInputValue((prev) => ({ ...prev, [name]: value }));
    console.log(inputValue,"changed");
}

const handleCloseForm =()=> {
  setDisplayForm(false);
}

const handleFormSubmit = () => {
  setLoading(true);
  switch (selectedTab) {
    case "Department": {
      axios.post(`${baseUrl}/department/create-department`, inputValue).then((res) => {
        setLoading(false);
        setData(res.data.data);
      }).catch((err) => {
        console.log(err);
        setLoading(false);
      });
      break;
    }
    case "Position": {
      axios.post(`${baseUrl}/position/create-position`, inputValue).then((res) => {
        setData(res.data.data);
        setLoading(false);
      }).catch((err) => {
        console.log(err);
        setLoading(false);
      });
      break;
    }
    case "Access Rights": {
      axios.post(`${baseUrl}/access/create-access`, inputValue).then((res) => {
        console.log(res);
        setLoading(false);
      }).catch((err) => {
        console.log(err);
        setLoading(false);
      });
      break;
    }
    default: break
  }
  // axios.post(`${baseUrl}/department/create-department`, inputValue).then((res) => {
  //   console.log(res);
  // })
  setDisplayForm(false);
}



  const handleDataFetching = () => {
    switch (selectedTab) {
      case "Department":
        {
          setColumns(departmentColumns);
          setData(departmentData);
          break;
        }
      case "Position": {
        setColumns(positionsColumns);
        setData(positionData);
        break;
      }
      case "Access Rights": {
        setColumns(accessColumns);
        // return axios.get(`${baseUrl}/access/list-access`).then((res) => {
          setData([]);
        // });
        break;
      }
      default: break
    }

  }

  useEffect(() => {
    axios.get(`${baseUrl}/position/list-positions`).then((res) => {
      setPositionData(res.data.data);
    });
    // axios.get(`${baseUrl}/access/list-access`).then((res) => {
    //   setAccessData(res.data.data);
    // });
    // axios.get(`${baseUrl}/department/list-departments`).then((res) => {
      // setData(departmentDataRef.current);
      // console.log(departmentData);
    //   setDepartmentData(res.data.data);

    // })
  },[])

  useEffect(() => {
    handleDataFetching();
  }, [selectedTab, departmentData]);


  const handleSearch = (e) => {
    handleSearchChange(e.target.value);
  }

  const handleTabSelect = (tab) => {
    setSelectedTab(tab);
    switch (tab) {
      case "Department": {
        setSelectedId("department_head");
        break;
      }
      case "Position": {
        setSelectedId("department_id");
        break;
      }
      case "Access Rights": {
        break;
      }
      default: break
    }
    setInputValue({created_by:1,name:""});
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
                  style={{
                    color: selectedTab === tab ? "#786D8F" : "#C7C2D3",
                    backgroundColor: selectedTab === tab ? "#F4F6FA" : "#fff",
                  }}
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
              <Filter />
              <SearchBar className="w-[40.9%] h-10" placeholder={`Search ${selectedTab} here...`} value={filter} onChange={handleSearch} />
            </div>
            <div>
              <Button value={"Create " + selectedTab} className={"  text-white h-10 p-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 transition duration-300 hover:bg-gradient-to-l hover:scale-105"} onClick={() => { setDisplayForm(!displayForm) }} />
            </div>
          </div>
          <TableComponent
            columns={columns}
            data={data}
            filter={filter}
            setFilter={setFilter}
          />
        </section>

        {selectedTab !=="Access Rights" ? (
          <FormsComponent className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-2000 ${displayForm ? "translate-x-0" : "translate-x-full"}`} selectOptions={selectOptions} selectId={selectedId} inputValue={inputValue} inputId={"name"} inputLabel={selectedTab} onChange={handleChange} CloseForm={handleCloseForm} onSubmit={handleFormSubmit} loading={loading} />
        ) : <FormsComponent className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-2000 ${displayForm ? "translate-x-0" : "translate-x-full"}`} inputLabel={selectedTab} >
              <AccessForm selectedTab={selectedTab} inputValue={inputValue} handleChange={handleChange} CloseForm={handleCloseForm} onSubmit={handleFormSubmit} loading={loading}/>
          </FormsComponent>}
      </section>
    </>
  );
}

export default Settings;
