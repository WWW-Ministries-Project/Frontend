//TODO STill need cleanup do when time permits
import { useUserStore } from "@/store/userStore";
import { useStore } from "@/store/useStore";
import { DepartmentType, PositionType } from "@/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import deleteIcon from "../../../../../assets/delete.svg";
import edit from "../../../../../assets/edit.svg";
import { showDeleteDialog } from "../../../utils";
import useSettingsStore from "./settingsStore";

interface UseSettingsTabsProps {
  setDisplayForm: (value: boolean) => void;
  setEditMode: (value: boolean) => void;
  setInputValue: (value: Record<string, string | number | undefined>) => void;
  handleDelete: (item: DepartmentType | PositionType) => void;
}

export function useSettingsTabs({
  setDisplayForm,
  setEditMode,
  setInputValue,
  handleDelete,
}: UseSettingsTabsProps) {
  const userId = useUserStore((state) => state.id);
  const settingsStore = useSettingsStore();
  const membersOptions = useStore((state) => state.membersOptions);
  const {positions: positionData, total: positionTotal} = settingsStore;
  const {departments: departmentData, total: departmentTotal} = settingsStore;
  const tabs = ["Department", "Position"];
  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);
  const [columns, setColumns] = useState<
    ColumnDef<DepartmentType | PositionType>[]
  >([]);
  const [data, setData] = useState<(DepartmentType | PositionType)[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string>("department_head");
  const [selectLabel, setSelectLabel] = useState<string>("Department Head");

  const departmentColumns: ColumnDef<DepartmentType>[] = useMemo(
    () => [
      {
        header: "Department",
        accessorKey: "name",
      },
      {
        header: "Department Head",
        accessorKey: "department_head_info",
        cell: (info) => {
          const value = info.getValue();
          return value && typeof value === "object" && "name" in value
            ? value.name
            : "N/A";
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        cell: (info) => info.getValue() ?? "N/A",
      },
      {
        header: "Actions",
        accessorKey: "status",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <img
              src={edit}
              alt="edit icon"
              className="cursor-pointer"
              onClick={() => {
                setInputValue({
                  id: row.original?.id,
                  name: row.original?.name,
                  description: row.original?.description,
                  department_head: row.original?.department_head_info?.id,
                });
                setEditMode(true);
                setDisplayForm(true);
              }}
            />
            <img
              src={deleteIcon}
              alt="delete icon"
              className="cursor-pointer"
              onClick={() =>
                showDeleteDialog(row.original, () => handleDelete(row.original))
              }
            />
          </div>
        ),
      },
    ],
    [setInputValue, setEditMode, setDisplayForm, handleDelete]
  );

  const positionsColumns: ColumnDef<PositionType>[] = useMemo(
    () => [
      {
        header: "Position Name",
        accessorKey: "name",
      },
      {
        header: "Department",
        accessorKey: "department",
        cell: ({ row }) => row.original.department?.name ?? "N/A",
      },
      {
        header: "Description",
        accessorKey: "description",
        cell: ({ row }) => row.original.description ?? "N/A",
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <img
              src={edit}
              alt="edit icon"
              className="cursor-pointer"
              onClick={() => {
                setInputValue({
                  id: row.original?.id,
                  name: row.original?.name,
                  description: row.original?.description,
                  department_id: row.original?.department?.id,
                });
                setEditMode(true);
                setDisplayForm(true);
              }}
            />
            <img
              src={deleteIcon}
              alt="delete icon"
              className="cursor-pointer"
              onClick={() =>
                showDeleteDialog(row.original, () => handleDelete(row.original))
              }
            />
          </div>
        ),
      },
    ],
    [setInputValue, setEditMode, setDisplayForm, handleDelete]
  );

  useEffect(() => {
    if (selectedTab === "Department") {
      setColumns(departmentColumns);
      setData(departmentData);
      setTotal(departmentTotal);
    } else {
      setColumns(positionsColumns);
      setData(positionData);
      setTotal(positionTotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, departmentData, positionData]);

  const selectOptions = useMemo(() => {
    return selectedTab === "Department"
      ? membersOptions
      : settingsStore.departmentsOptions;
  }, [selectedTab, membersOptions, settingsStore]);

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);
    if (tab === "Department") {
      setSelectedId("department_head");
      setSelectLabel("Department Head");
    } else {
      setSelectedId("department_id");
      setSelectLabel("Department");
    }
    setInputValue({ created_by: userId, name: "" });
  };

  return {
    tabs,
    selectedTab,
    setSelectedTab: handleTabSelect,
    total,
    columns,
    data,
    selectOptions,
    selectedId,
    selectLabel,
  };
}
