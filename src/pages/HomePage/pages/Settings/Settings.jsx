
import { api } from "@/utils/api/apiCalls";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
// import useState from "react-usestateref";
import { Modal } from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete.tsx";
import { usePost } from "@/CustomHooks/usePost.tsx";
import { usePut } from "@/CustomHooks/usePut.tsx";
import { useStore } from "@/store/useStore.ts";
import { decodeToken } from "@/utils/helperFunctions.ts";
import deleteIcon from "../../../../assets/delete.svg";
import edit from "../../../../assets/edit.svg";
import { SearchBar } from "../../../../components/SearchBar";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { showDeleteDialog, showNotification } from "../../utils";
import { FormsComponent } from "./Components/FormsComponent";
import useSettingsStore from "./utils/settingsStore.ts";
function Settings() {
  const { filter, setFilter, handleSearchChange, members, refetchPositions, refetchDepartments } = useOutletContext();
  const tabs = ["Department", "Position"];
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [displayForm, setDisplayForm] = useState(false);
  const [inputValue, setInputValue] = useState({ created_by: decodeToken().id, name: "", description: "" });
  const [selectedId, setSelectedId] = useState("department_head");
  const [selectLabel, setSelectLabel] = useState("Department Head");
  const [editMode, setEditMode] = useState(false);
  const membersOptions = useStore((state) => state.membersOptions);
  const settingsStore = useSettingsStore();
  const positionData = settingsStore.positions || [];
  const departmentData = settingsStore.departments || [];
  const { postData: postDepartment, data: department, error: departmentError, loading: departmentLoading } = usePost(api.post.createDepartment);
  const { postData: postPosition, data: position, error: positionError, loading: positionLoading } = usePost(api.post.createPosition);
  const { updateData: updateDepartment, loading: departmentUpdateLoading, error: departmentUpdateError, data: departmentUpdate } = usePut(api.put.updateDepartment);
  const { updateData: updatePosition, loading: positionUpdateLoading, error: positionUpdateError, data: positionUpdate } = usePut(api.put.updatePosition);
  const { executeDelete: deleteDepartment, success: departmentDelete, error: departmentDeleteError } = useDelete(api.delete.deleteDepartment);
  const { executeDelete: deletePosition, success: positionDelete, error: positionDeleteError } = useDelete(api.delete.deletePosition);


  // new data
  useEffect(() => {
    if (department) {
      showNotification("Department added successfully", "success");
      settingsStore.setDepartments(department.data);
      handleCloseForm();
    }
    if (position) {
      showNotification("Position added successfully", "success");
      settingsStore.setPositions(position.data);
      refetchDepartments();// this is intentional to update the position options of departments
      handleCloseForm();
    }
    if (departmentError || positionError) {
      showNotification("Something went wrong", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, position, positionError, departmentError]);

  // updated data
  useEffect(() => {
    if (departmentUpdate) {
      showNotification("Department updated successfully", "success");
      settingsStore.updateDepartment(departmentUpdate.data);

      handleCloseForm();
    }
    if (positionUpdate) {
      showNotification("Position updated successfully", "success");
      // settingsStore.updatePosition(positionUpdate.data);
      refetchPositions();
      refetchDepartments();// this is intentional to update the position options of departments
      handleCloseForm();
    }
    if (departmentUpdateError || positionUpdateError) {
      showNotification("Something went wrong", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentUpdate, positionUpdate, positionUpdateError, departmentUpdateError]);
  // deleted data
  useEffect(() => {

    if (departmentDelete) {
      showNotification("Department deleted successfully", "success");
      refetchDepartments();
      // settingsStore.removeDepartment(departmentDelete.data);
    }
    if (positionDelete) {
      showNotification("Position deleted successfully", "success");
      refetchPositions();
      // settingsStore.removePosition(positionDelete.data);
    }
    if (departmentDeleteError || positionDeleteError) {
      showNotification("Something went wrong", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentDelete, positionDelete]);
  const handleDelete = (itemToDelete) => {
    if (selectedTab === "Department") {
      deleteDepartment({ id: itemToDelete.id })
    }
    if (selectedTab === "Position") {
      deletePosition({ id: itemToDelete.id })
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
              "text-sm h-6 flex items-center justify-left gap-2 rounded-lg text-center text-white "
            }>
            <img src={edit} alt="edit icon" className="cursor-pointer" onClick={() => {
              setInputValue(() => ({ id: row.original?.id, name: row.original?.name, description: row.original?.description, department_head: row.original?.department_head_info?.id }))
              setEditMode(true)
              setDisplayForm(true)
            }} />

            <img src={deleteIcon} alt="delete icon" className="cursor-pointer" onClick={() => {
              showDeleteDialog(row.original, () => handleDelete(row.original));
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
            showDeleteDialog(row.original, () => handleDelete(row.original));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <PageOutline>

      <div>
        <PageHeader title="General configuration" />
        <p className="P200 text-gray">
          Manage your departments and positions here...
        </p>
        <div className="flex mt-2 mb-6 ">
          <div className="border border-lightGray flex gap-2 rounded-lg p-1">
            {
              tabs.map((tab) => {
                return (
                  <div
                    className={` rounded-lg  text-center text-dark900 p-2 flex items-center justify-center ${selectedTab === tab ? " bg-lightGray font-semibold" : ""} cursor-pointer w-40`}

                    onClick={() => handleTabSelect(tab)}
                    key={tab}
                  >
                    {tab}
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
      <PageHeader className="font-semibold text-xl" title={selectedTab} buttonValue={"Create " + selectedTab} onClick={() => { setDisplayForm(!displayForm); setInputValue({ created_by: decodeToken().id, name: "" }) }} />

      <section className=" bg-white">
        <div className="flex justify-between items-center mb-5">
          <div className="flex justify-start gap-2 items-center  w-2/3">
            <SearchBar className="w-[40.9%] " placeholder={`Search ${selectedTab} here...`} value={filter} onChange={handleSearch} />
          </div>
        </div>
        <TableComponent
          columns={columns}
          data={data}
          filter={filter}
          setFilter={setFilter}
        />
      </section>
      <Modal open={displayForm} persist={false} onClose={handleCloseForm}>
        <FormsComponent
          selectOptions={selectOptions}
          selectId={selectedId}
          inputValue={inputValue}
          inputLabel={selectedTab}
          onChange={handleChange}
          CloseForm={handleCloseForm}
          onSubmit={handleFormSubmit}
          loading={
            departmentUpdateLoading ||
            positionUpdateLoading ||
            departmentLoading ||
            positionLoading
          }
          selectLabel={selectLabel}
          editMode={editMode}
        />
      </Modal>
    </PageOutline>
  );
}

export default Settings;
