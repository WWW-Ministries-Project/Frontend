//TODO STill need cleanup do when time permits
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { api } from "@/utils/api/apiCalls";
// import useState from "react-usestateref";
import { Modal } from "@/components/Modal";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { useUserStore } from "@/store/userStore";
import { DepartmentType } from "@/utils";
import { SearchBar } from "../../../../components/SearchBar";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { showNotification } from "../../utils";
import { FormsComponent } from "./Components/FormsComponent";
import useSettingsStore from "./utils/settingsStore";
import { useSettingsTabs } from "./utils/useSettingsTabs";

function Settings() {
  const {
    filter,
    setFilter,
    handleSearchChange,
    refetchPositions,
    refetchDepartments,
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any = useOutletContext();

  const userId = useUserStore((state) => state.id);

  const [displayForm, setDisplayForm] = useState(false);
  const [inputValue, setInputValue] = useState({
    created_by: userId,
    name: "",
    description: "",
  });
  const [editMode, setEditMode] = useState(false);
  const settingsStore = useSettingsStore();
  const positionData = settingsStore.positions || [];
  const departmentData = settingsStore.departments || [];

  const {
    postData: postDepartment,
    data: department,
    error: departmentError,
    loading: departmentLoading,
  } = usePost(api.post.createDepartment);
  const {
    postData: postPosition,
    data: position,
    error: positionError,
    loading: positionLoading,
  } = usePost(api.post.createPosition);

  const {
    updateData: updateDepartment,
    loading: departmentUpdateLoading,
    error: departmentUpdateError,
    data: departmentUpdate,
  } = usePut(api.put.updateDepartment);
  const {
    updateData: updatePosition,
    loading: positionUpdateLoading,
    error: positionUpdateError,
    data: positionUpdate,
  } = usePut(api.put.updatePosition);

  const {
    executeDelete: deleteDepartment,
    success: departmentDelete,
    error: departmentDeleteError,
  } = useDelete(api.delete.deleteDepartment);
  const {
    executeDelete: deletePosition,
    success: positionDelete,
    error: positionDeleteError,
  } = useDelete(api.delete.deletePosition);

  const handleCloseForm = useCallback(() => {
    setDisplayForm(false);
    setEditMode(false);
  }, []);

  const handleDelete = (itemToDelete: DepartmentType) => {
    if (selectedTab === "Department") {
      deleteDepartment({ id: itemToDelete.id + "" });
    } else {
      deletePosition({ id: itemToDelete.id + "" });
    }
  };

  const {
    tabs,
    selectedTab,
    setSelectedTab,
    columns,
    data,
    selectOptions,
    selectedId,
    selectLabel,
  } = useSettingsTabs({
    departmentData,
    positionData,
    setDisplayForm,
    setEditMode,
    //@ts-expect-error will figure it out later
    setInputValue,
    handleDelete,
  });

  // Created data effect
  useEffect(() => {
    if (department || position) {
      showNotification("Created successfully", "success");
      const refetch = position
        ? () => refetchPositions().then(refetchDepartments)
        : refetchDepartments;

      refetch();
      handleCloseForm();
    }
    if (departmentError || positionError) {
      const errorMessage =
        departmentError?.message ||
        positionError?.message ||
        "Something went wrong";
      showNotification(errorMessage, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, position, departmentError, positionError]);

  // Updated data effect
  useEffect(() => {
    if (departmentUpdate || positionUpdate) {
      showNotification("Updated successfully", "success");

      const refetch = positionUpdate
        ? () => refetchPositions().then(refetchDepartments)
        : refetchDepartments;

      refetch();
      handleCloseForm();
    }
    if (departmentUpdateError || positionUpdateError) {
      const errorMessage =
        departmentUpdateError?.message ||
        positionUpdateError?.message ||
        "Something went wrong";
      showNotification(errorMessage, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    departmentUpdate,
    positionUpdate,
    departmentUpdateError,
    positionUpdateError,
  ]);

  // Deleted data effect
  useEffect(() => {
    if (departmentDelete || positionDelete) {
      showNotification("Deleted successfully", "success");
      if (departmentDelete) refetchDepartments();
      else refetchPositions();
    }
    if (departmentDeleteError || positionDeleteError) {
      const errorMessage =
        departmentDeleteError?.message ||
        positionDeleteError?.message ||
        "Something went wrong";
      showNotification(errorMessage, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    departmentDelete,
    positionDelete,
    departmentDeleteError,
    positionDeleteError,
  ]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
    handleSearchChange(e.target.value);

  const handleFormSubmit = () => {
    if (selectedTab === "Department") {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      editMode ? updateDepartment(inputValue) : postDepartment(inputValue);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      editMode ? updatePosition(inputValue) : postPosition(inputValue);
    }
  };

  return (
    <PageOutline>
      <div>
        <PageHeader title="General configuration" />
        <p className="P200 text-gray">
          Manage your departments and positions here...
        </p>
        <div className="flex mt-2 mb-6 ">
          <div className="border border-lightGray flex gap-2 rounded-lg p-1">
            {tabs.map((tab) => (
              <div
                key={tab}
                className={`rounded-lg text-center p-2 w-40 cursor-pointer ${
                  selectedTab === tab ? "bg-lightGray font-semibold" : ""
                }`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
      </div>

      <PageHeader
        className="font-semibold text-xl"
        title={selectedTab}
        buttonValue={"Create " + selectedTab}
        onClick={() => {
          setDisplayForm(!displayForm);
          setInputValue({ created_by: userId, name: "", description: "" });
        }}
      />

      <section className="bg-white">
        <div className="flex justify-between items-center mb-5">
          <SearchBar
            className="w-[40.9%]"
            placeholder={`Search ${selectedTab} here...`}
            value={filter}
            onChange={handleSearch}
          />
        </div>
        <TableComponent
          columns={columns}
          data={data}
          filter={filter}
          setFilter={setFilter}
          onPageChange={() => {}}
        />
      </section>

      <Modal open={displayForm} persist={false} onClose={handleCloseForm}>
        <FormsComponent
          selectOptions={selectOptions}
          selectId={selectedId}
          inputValue={inputValue}
          inputLabel={selectedTab}
          onChange={(name, value) =>
            setInputValue((prev) => ({ ...prev, [name]: value }))
          }
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
