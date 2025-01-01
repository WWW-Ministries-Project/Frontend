
import { useStore } from "/src/store/useStore.ts";
import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import useState from "react-usestateref";
import deleteIcon from "../../../../assets/delete.svg";
import edit from "../../../../assets/edit.svg";
import SearchBar from "../../../../components/SearchBar";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import LoaderComponent from "../../Components/reusable/LoaderComponent.tsx";
import TableComponent from "../../Components/reusable/TableComponent";
import { showDeleteDialog, showNotification } from "../../utils";
import FormsComponent from "./Components/FormsComponent";
import useSettingsStore from "./utils/settingsStore.ts";
import { useDelete } from "/src/CustomHooks/useDelete.tsx";
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
  const [itemToDelete, setItemToDelete] = useState({ path: "", id: "", name: "", index: "" });
  const membersOptions = useStore((state) => state.membersOptions);
  const settingsStore = useSettingsStore();
  const positionData = settingsStore.positions || [];
  const departmentData = settingsStore.departments || [];
  const { postData: postDepartment, loading: departmentLoading, data: department, error: departmentError } = UsePost(api.post.createDepartment);
  const { postData: postPosition, loading: positionLoading, data: position, error: positionError } = UsePost(api.post.createPosition);
  const { updateData: updateDepartment, loading: departmentUpdateLoading, error: departmentUpdateError, data: departmentUpdate } = usePut(api.put.updateDepartment);
  const { updateData: updatePosition, loading: positionUpdateLoading, error: positionUpdateError, data: positionUpdate } = usePut(api.put.updatePosition);
  const { executeDelete: deleteDepartment, loading: deleteDepartmentLoading, data: departmentDelete, error: departmentDeleteError } = useDelete(api.delete.deleteDepartment);
  const { executeDelete: deletePosition, loading: deletePositionLoading, data: positionDelete, error: positionDeleteError } = useDelete(api.delete.deletePosition);


  // new data
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

  // updated data
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
  // deleted data
  useEffect(() => {
    if (departmentDelete) {
      showNotification(departmentDelete.data.message, "success");
      settingsStore.removeDepartment(departmentDelete.data.data);
    }
    if (positionDelete) {
      showNotification(positionDelete.data.message, "success");
      settingsStore.removePosition(positionDelete.data.data);
    }
    if (departmentDeleteError || positionDeleteError) {
      showNotification("Something went wrong", "error");
    }
  }, [departmentDelete, positionDelete]);
  const handleDelete = () => {
    if (selectedTab === "Department") {
      deleteDepartment(itemToDelete.id)
    }
    if (selectedTab === "Position") {
      deletePosition(itemToDelete.id)
    }
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
              showDeleteDialog(row.original, handleDelete);
              setItemToDelete({ id: row.original?.id })
            }} />
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
      header: "Actions",
      cell: ({ row }) => (
        <div
          className={
            "text-sm h-6 flex items-center justify-start gap-2 rounded-lg text-center text-white  "
          }>
          <img src={edit} alt="edit icon" className="cursor-pointer" onClick={() => {
            setInputValue(() => ({ id: row.original?.id, name: row.original?.name, description: row.original?.description, department_id: row.original?.department?.id }))
            setEditMode(true)
            setDisplayForm(true)
          }} />
          <img src={deleteIcon} alt="delete icon" className="cursor-pointer" onClick={() => {
            showDeleteDialog(row.original, handleDelete);
            setItemToDelete({ id: row.original?.id })
          }} />

        </div>)
    },
  ]



  //Forms Component
  const selectOptions = useMemo(() => {
    switch (selectedTab) {
      case "Department": {
        return membersOptions
      }
      case "Position": {
        return settingsStore.departmentsOptions
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
        <FormsComponent className={`animate-fadeIn transition-all ease-in-out w-[353px] duration-1000 ${displayForm ? "translate-x-0" : "translate-x-full"}`} selectOptions={selectOptions} selectId={selectedId} inputValue={inputValue} inputId={"name"} inputLabel={selectedTab} onChange={handleChange} CloseForm={handleCloseForm} onSubmit={handleFormSubmit} loading={departmentUpdateLoading || positionUpdateLoading} selectLabel={selectLabel} editMode={editMode} />
      </PageOutline>
      {(positionLoading || departmentLoading || deletePositionLoading || deleteDepartmentLoading) && <LoaderComponent />}
    </>
  );
}

export default Settings;
