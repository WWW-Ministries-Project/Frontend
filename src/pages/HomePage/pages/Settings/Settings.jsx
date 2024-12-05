
import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import useState from "react-usestateref";
import SearchBar from "../../../../components/SearchBar";
import TableComponent from "../../Components/reusable/TableComponent";
import FormsComponent from "./Components/FormsComponent";
// import { accessColumns, departmentColumns, positionsColumns, deleteData } from "./utils/helperFunctions";
import deleteIcon from "../../../../assets/delete.svg";
import edit from "../../../../assets/edit.svg";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import { showNotification } from "../../utils/helperFunctions.ts";
import { deleteData } from "./utils/helperFunctions";
import useSettingsStore from "./utils/settingsStore.ts";
import Dialog from "/src/components/Dialog";
import UsePost from "/src/CustomHooks/usePost.tsx";
import usePut from "/src/CustomHooks/usePut.tsx";
import api from "/src/utils/apiCalls.ts";
import { decodeToken } from "/src/utils/helperFunctions.ts";
function Settings() {
  const { filter, setFilter, handleSearchChange, members, } = useOutletContext();
  const tabs = ["Department", "Position"];
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const [data, setData, dataRef] = useState([]);
  const [columns, setColumns] = useState([]);
  const [displayForm, setDisplayForm] = useState(false);
  const [inputValue, setInputValue] = useState({ created_by: decodeToken().id, name: "", description: "" });
  const [selectedId, setSelectedId] = useState("department_head");
  const [selectLabel, setSelectLabel] = useState("Department Head");
  const [editMode, setEditMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ path: "", id: "", name: "", index: "" });
  const settingsStore = useSettingsStore();
  const departmentData = settingsStore.departments || [];
  const { postData: postDepartment, loading: departmentLoading, data: department, error: departmentError } = UsePost(api.post.createDepartment);
  const { postData: postPosition, loading: positionLoading, data: position, error: positionError } = UsePost(api.post.createPosition);
  const { updateData: updateDepartment, loading: departmentUpdateLoading, error: departmentUpdateError, data: departmentUpdate } = usePut(api.put.updateDepartment);
  const { updateData: updatePosition, loading: positionUpdateLoading, error: positionUpdateError, data: positionUpdate } = usePut(api.put.updatePosition);
  const positionData = settingsStore.positions || [];


  useEffect(() => {
    if (department) {
      showNotification(department.data.message, "success");
      settingsStore.setDepartments(department.data.data);
      handleCloseForm();
    }
    if (position) {
      showNotification(position.data.message, "success");
      settingsStore.setPositions(position.data.data);
      handleCloseForm();
    }
    if (departmentError || positionError) {
      showNotification("Something went wrong", "error");
    }
  }, [department, position, positionError, departmentError]);

  useEffect(() => {
    if (departmentUpdate) {
      showNotification(departmentUpdate.data.message, "success");
      settingsStore.updateDepartment(departmentUpdate.data.data);
      handleCloseForm();
    }
    if (positionUpdate) {
      showNotification(positionUpdate.data.message, "success");
      settingsStore.updatePosition(positionUpdate.data.data);
      handleCloseForm();
    }
    if (departmentUpdateError || positionUpdateError) {
      showNotification("Something went wrong", "error");
    }
  }, [departmentUpdate, positionUpdate, positionUpdateError, departmentUpdateError]);

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
          <img src={deleteIcon} alt="delete icon" className="cursor-pointer" onClick={() => {
            handleShowModal()
            setItemToDelete({ path: "position/delete-position", id: row.original?.id, name: row.original?.name, index: row.index })
          }} />

        </div>)
    },
  ]



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
    }
  }, [members, selectedTab])

  const handleChange = (name, value) => {
    setInputValue((prev) => ({ ...prev, [name]: value }));
  }

  const handleCloseForm = () => {
    setDisplayForm(false);
    setEditMode(false);
  }

  const handleFormSubmit = async () => {
    switch (selectedTab) {
      case "Department": {
        if (editMode) {
          updateDepartment(inputValue)
          break;
        }
        postDepartment(inputValue)
        break;
      }
      case "Position": {
        if (editMode) {
          updatePosition(inputValue)
          break;
        }
        postPosition(inputValue)
        break;
      }
      default: break
    }

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
      default: break
    }

  }

  useEffect(() => {
    handleDataFetching();
  }, [selectedTab, departmentData, positionData]);


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
      default: break
    }
    setInputValue({ created_by: decodeToken().id, name: "" });
  }

  return (
    <>
      <PageOutline>

        <PageHeader title="Settings" buttonValue={"Create " + selectedTab} onClick={() => { setDisplayForm(!displayForm); setInputValue({ created_by: decodeToken().id, name: "" }) }} />
        <p className="P200 text-gray">
          Manage your departments and positions here...
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
          </div>
          <TableComponent
            columns={columns}
            data={data}
            filter={filter}
            setFilter={setFilter}
          />
        </section>
        <FormsComponent className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-1000 ${displayForm ? "translate-x-0" : "translate-x-full"}`} selectOptions={selectOptions} selectId={selectedId} inputValue={inputValue} inputId={"name"} inputLabel={selectedTab} onChange={handleChange} CloseForm={handleCloseForm} onSubmit={handleFormSubmit} loading={positionLoading || departmentLoading} selectLabel={selectLabel} editMode={editMode} />
      </PageOutline>

      <Dialog showModal={showModal} onClick={handleShowModal} data={itemToDelete} onDelete={handleDelete} />
    </>
  );
}

export default Settings;
