
import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import useState from "react-usestateref";
import axios from "../../../../axiosInstance.js";
import Button from "../../../../components/Button";
import SearchBar from "../../../../components/SearchBar";
import { baseUrl } from "../../../Authentication/utils/helpers";
import TableComponent from "../../Components/reusable/TableComponent";
import AccessForm from "./Components/AccessForm.jsx";
import FormsComponent from "./Components/FormsComponent";
// import { accessColumns, departmentColumns, positionsColumns, deleteData } from "./utils/helperFunctions";
import deleteIcon from "../../../../assets/delete.svg";
import edit from "../../../../assets/edit.svg";
import { deleteData, updateData } from "./utils/helperFunctions";
import Dialog from "/src/components/Dialog.jsx";
import { decodeToken } from "/src/utils/helperFunctions.js";
function Settings() {
  const { filter, setFilter, handleSearchChange, members, departmentData, } = useOutletContext();
  const tabs = ["Department", "Position", "Access Rights"];
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const [data, setData, dataRef] = useState([]);
  const [positionData, setPositionData] = useState([]);
  const [accessData, setAccessData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [displayForm, setDisplayForm] = useState(false);
  const [inputValue, setInputValue, inputValueRef] = useState({ created_by: decodeToken().id, name: "", description: "" });
  const [selectedId, setSelectedId] = useState("department_head");
  const [selectLabel, setSelectLabel] = useState("Department Head");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [permissionsValues, setPermissionsValues, permissionsValuesRef] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ path: "", id: "", name: "", index: "" });
  const [selectedUsers, setSelectedUsers] = useState([]); //for access levels

  //dialog logic
  const handleShowModal = () => {
    setShowModal(prev => !prev)
  }

  const handleDelete = () => {
    deleteData(itemToDelete.path, itemToDelete.id);
    setShowModal(prev => !prev);
    let tempData = dataRef.current;
    tempData.splice(itemToDelete.index, 1)
    setData([...tempData])
    // switch (itemToDelete.path) {

    // }
  }


  // find way to import data from another function makes it cleaner
  const departmentColumns =
    [
      {
        header: "Department",
        accessorKey: "name",
      },
      {
        header: "Department Head",
        accessorKey: "department_head_info",
        cell: (info) => info.getValue()?.name ?? "N/A"
      },
      {
        header: "Description",
        accessorKey: "description",
        cell: (info) => info.getValue() ?? "N/A"
      },
      {
        header: "Actions",
        accessorKey: "status",
        cell: ({ row }) => (
          <div
            className={
              "text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center text-white "
            }>
            <img src={edit} alt="edit icon" className="cursor-pointer" onClick={() => {
              setInputValue(() => ({ id: row.original?.id, name: row.original?.name, description: row.original?.description, department_head: row.original?.department_head_info?.id }))
              setEditMode(true)
              setDisplayForm(true)
            }} />

            <img src={deleteIcon} alt="delete icon" className="cursor-pointer" onClick={() => {
              handleShowModal()
              setItemToDelete({ path: "department/delete-department", id: row.original?.id, name: row.original?.name, index: row.index })
            }} />
            {/* 
            <img src={deleteIcon} alt="delete icon" className="cursor-pointer" onClick={() => { 
              deleteData("department/delete-department",row.original.id)
              let tempData = dataRef.current;
              tempData.splice(row.index, 1)
              setData([...tempData])
             }} /> */}

          </div>
        )
      },
    ]

  const positionsColumns = [
    {
      header: "Position Name",
      accessorKey: "name",
    },
    {
      header: "Department",
      accessorKey: "department",
      cell: (info) => info.getValue()?.name ?? "N/A"
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <div
          className={
            "text-sm h-6 flex items-center justify-center gap-2 rounded-lg text-center text-white "
          }>
          <img src={edit} alt="edit icon" className="cursor-pointer" onClick={() => {
            setInputValue(() => ({ id: row.original?.id, name: row.original?.name, description: row.original?.description, department_id: row.original?.department?.id }))
            setEditMode(true)
            setDisplayForm(true)
          }} />

          {/* <img src={deleteIcon} alt="delete icon" className="cursor-pointer" onClick={() => { 
              deleteData("position/delete-position",row.original.id)
              let tempData = dataRef.current;
              tempData.splice(row.index, 1)
              setData([...tempData])
              setPositionData([...tempData])
             }} /> */}
          <img src={deleteIcon} alt="delete icon" className="cursor-pointer" onClick={() => {
            handleShowModal()
            setItemToDelete({ path: "position/delete-position", id: row.original?.id, name: row.original?.name, index: row.index })
          }} />

        </div>)
    },
  ]

  const accessColumns = [
    {
      header: "Acess Name",
      accessorKey: "name",
    },
    // {
    //   header: "Department",

    // },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Edit",
      accessorKey: "status",
      cell: ({ row }) => (
        <div
          className={
            "text-sm h-6 flex items-center justify-start gap-2 rounded-lg text-center text-white "
          }>
          <img src={edit} alt="edit icon" className="cursor-pointer" onClick={() => {
            setInputValue(() => ({ id: row.original?.id, name: row.original?.name, description: row.original?.description }))
            setPermissionsValues(() => (row.original?.permissions))
            setEditMode(true)
            setDisplayForm(true)
          }} />
          <img src={deleteIcon} alt="delete icon" className="cursor-pointer" />

        </div>
      )
    },
  ]
  // }, [data,selectedTab,columns])

  //AccessLevels
  function selectUser(itemId) {
    const index = members.findIndex(item => item.id === itemId);
    if (index !== -1) {
      const selectedItem = members.slice(index)[0];
      setSelectedUsers(prev => {
        if (prev.some(user => user.id == itemId)) {
          return prev.filter(users => users.id != itemId)
        } else {
          return [...prev, selectedItem]
        }
      });
    }
  }

  // const departmentData = departmentDataRef.current;



  //Forms Component
  const selectOptions = useMemo(() => {
    switch (selectedTab) {
      case "Department": {
        return members.map((member) => {
          return { name: member.name, value: member.id }
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

  const handleChange = (name, value) => {
    setInputValue((prev) => ({ ...prev, [name]: value }));
  }
  const handleAccessChange = (name, value) => {
    if (
      !permissionsValuesRef.current['view_Positions'] &&
      !permissionsValuesRef.current['view_Departments'] &&
      !permissionsValuesRef.current['view_Access']
    ) {
      setPermissionsValues((prev) => ({ ...prev, "view_Settings": false }));
    } else if (
      permissionsValuesRef.current['view_Positions'] ||
      permissionsValuesRef.current['view_Departments'] ||
      permissionsValuesRef.current['view_Access']
    ) {
      setPermissionsValues((prev) => ({ ...prev, "view_Settings": true }));
    }
    setPermissionsValues((prev) => ({ ...prev, [name]: value }));
  }

  const handleCloseForm = () => {
    setDisplayForm(false);
    setEditMode(false);
  }

  const handleFormSubmit = async () => {
    setLoading(true);
    switch (selectedTab) {
      case "Department": {
        if (editMode) {
          const res = await updateData("department/update-department", inputValue)
          res && window.location.reload();
          break;
        }
        axios.post(`${baseUrl}/department/create-department`, inputValue).then((res) => {
          setLoading(false);
          setData(res.data.data);
          setDisplayForm(false);
          setInputValue({});
        }).catch((err) => {
          console.log(err);
          setLoading(false);
          setDisplayForm(false);
          setInputValue({});
        });
        break;
      }
      case "Position": {
        if (editMode) {
          const res = await updateData("position/update-position", inputValue)
          res && window.location.reload();
          break;
        }
        axios.post(`${baseUrl}/position/create-position`, inputValue).then((res) => {
          setData(res.data.data);
          setLoading(false);
          setDisplayForm(false);
          setInputValue({});
        }).catch((err) => {
          console.log(err);
          setLoading(false);
          setDisplayForm(false);
          setInputValue({});
        });
        break;
      }
      case "Access Rights": {
        const permissions = permissionsValuesRef.current;
        setInputValue(prev => ({
          permissions: permissions,
          assigned_users: selectedUsers.map(user => user.id), ...prev
        }))
        if (editMode) {
          const res = await updateData("access/update-access-level", inputValueRef.current)
          res && window.location.reload();
          break;
        }
        axios.post(`${baseUrl}/access/create-access-level`, inputValueRef.current).then(() => {
          setLoading(false);
          setDisplayForm(false);
          setInputValue({});
        }).catch((err) => {
          console.log(err);
          setLoading(false);
          setDisplayForm(false);
          setInputValue({});
        });
        break;
      }
      default: break
    }
    // axios.post(`${baseUrl}/department/create-department`, inputValue).then((res) => {
    //   console.log(res);
    // })

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
        setData(accessData);
        break;
      }
      default: break
    }

  }

  useEffect(() => {
    axios.get(`${baseUrl}/position/list-positions`).then((res) => {
      setPositionData(res.data.data);
    });
    axios.get(`${baseUrl}/access/list-access-levels`).then((res) => {
      setAccessData(res.data.data);
    });
    // axios.get(`${baseUrl}/department/list-departments`).then((res) => {
    // setData(departmentDataRef.current);
    // console.log(departmentData);
    //   setDepartmentData(res.data.data);

    // })
  }, [])

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
        setSelectLabel("Department Head");
        break;
      }
      case "Position": {
        setSelectedId("department_id");
        setSelectLabel("Department");
        break;
      }
      case "Access Rights": {
        break;
      }
      default: break
    }
    setInputValue({ created_by: decodeToken().id, name: "" });
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
              {/* <Filter /> */}
              <SearchBar className="w-[40.9%] h-10" placeholder={`Search ${selectedTab} here...`} value={filter} onChange={handleSearch} />
            </div>
            <div>
              <Button value={"Create " + selectedTab} className={"  text-white h-10 p-2 gradientBtn"} onClick={() => { setDisplayForm(!displayForm); setInputValue({ created_by: decodeToken().id, name: "" }) }} />
            </div>
          </div>
          <TableComponent
            columns={columns}
            data={data}
            filter={filter}
            setFilter={setFilter}
          />
        </section>

        {selectedTab !== "Access Rights" ? (
          <FormsComponent className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-1000 ${displayForm ? "translate-x-0" : "translate-x-full"}`} selectOptions={selectOptions} selectId={selectedId} inputValue={inputValue} inputId={"name"} inputLabel={selectedTab} onChange={handleChange} CloseForm={handleCloseForm} onSubmit={handleFormSubmit} loading={loading} selectLabel={selectLabel} editMode={editMode} />

        ) : <FormsComponent className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-1000 ${displayForm ? "translate-x-0" : "translate-x-full"}`} inputLabel={selectedTab} editMode={editMode}  >
          <AccessForm selectedTab={selectedTab} inputValue={inputValue} permissionsValues={permissionsValues} handleChange={handleAccessChange} handleNameChange={handleChange} CloseForm={handleCloseForm} onSubmit={handleFormSubmit} loading={loading} buttonText={editMode ? 'Update' : 'Create'} members={members} selectedUsers={selectedUsers} onMembersSelect={selectUser} />
        </FormsComponent>}
      </section>

      <Dialog showModal={showModal} onClick={handleShowModal} data={itemToDelete} onDelete={handleDelete} />
    </>
  );
}

export default Settings;
