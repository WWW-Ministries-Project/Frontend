//TODO STill need cleanup do when time permits
import { useUserStore } from "@/store/userStore";
import { PositionType } from "@/utils";
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
  handleDelete: (item: PositionType) => void;
}

export type GeneralSettingsTab =
  | "Position"
  | "Requisition"
  | "Eligibility Rules"
  | "Notifications"
  | "Logs";

export function useSettingsTabs({
  setDisplayForm,
  setEditMode,
  setInputValue,
  handleDelete,
}: UseSettingsTabsProps) {
  const userId = useUserStore((state) => state.id);
  const settingsStore = useSettingsStore();
  const { positions: positionData, positionTotal } = settingsStore;
  const tabs: GeneralSettingsTab[] = [
    "Position",
    "Requisition",
    "Notifications",
    "Logs",
    "Eligibility Rules",
  ];
  const [selectedTab, setSelectedTab] = useState<GeneralSettingsTab>(tabs[0]);
  const [columns, setColumns] = useState<ColumnDef<PositionType>[]>([]);
  const [data, setData] = useState<PositionType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string>("department_id");
  const [selectLabel, setSelectLabel] = useState<string>("Department");

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
    if (selectedTab === "Position") {
      setColumns(positionsColumns);
      setData(positionData);
      setTotal(positionTotal);
      return;
    }

    setColumns([]);
    setData([]);
    setTotal(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, positionData, positionTotal, positionsColumns]);

  const selectOptions = useMemo(() => {
    return selectedTab === "Position" ? settingsStore.departmentsOptions : [];
  }, [selectedTab, settingsStore.departmentsOptions]);

  const handleTabSelect = (tab: GeneralSettingsTab) => {
    setSelectedTab(tab);
    if (tab === "Position") {
      setSelectedId("department_id");
      setSelectLabel("Department");
    } else {
      setSelectedId("");
      setSelectLabel("");
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
