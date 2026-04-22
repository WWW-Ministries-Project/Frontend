//TODO STill need cleanup do when time permits
import { useUserStore } from "@/store/userStore";
import { useBranchStore } from "@/store/useBranchStore";
import { Branch, PositionType } from "@/utils";
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
  handleDelete: (item: PositionType | Branch) => void;
  branchPastorOptions: { label: string; value: string | number }[];
}

export type GeneralSettingsTab =
  | "Branches"
  | "Position"
  | "Requisition"
  | "Attendance"
  | "Eligibility Rules"
  | "Notifications"
  | "Logs";

export function useSettingsTabs({
  setDisplayForm,
  setEditMode,
  setInputValue,
  handleDelete,
  branchPastorOptions,
}: UseSettingsTabsProps) {
  const userId = useUserStore((state) => state.id);
  const settingsStore = useSettingsStore();
  const branches = useBranchStore((state) => state.branches);
  const { positions: positionData, positionTotal } = settingsStore;
  const tabs: GeneralSettingsTab[] = [
    "Branches",
    "Position",
    "Requisition",
    "Attendance",
    "Notifications",
    "Logs",
    "Eligibility Rules",
  ];
  const [selectedTab, setSelectedTab] = useState<GeneralSettingsTab>(tabs[0]);
  const [columns, setColumns] = useState<ColumnDef<any>[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string>("pastor_in_charge_id");
  const [selectLabel, setSelectLabel] = useState<string>("Pastor in-charge");

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

  const branchColumns: ColumnDef<Branch>[] = useMemo(
    () => [
      {
        header: "Branch Name",
        accessorKey: "name",
      },
      {
        header: "Description",
        accessorKey: "description",
        cell: ({ row }) => row.original.description || "N/A",
      },
      {
        header: "Location",
        accessorKey: "location",
        cell: ({ row }) => row.original.location || "N/A",
      },
      {
        header: "Pastor in-charge",
        accessorKey: "pastor_in_charge",
        cell: ({ row }) => row.original.pastor_in_charge?.name || "N/A",
      },
      {
        header: "Default",
        accessorKey: "is_default",
        cell: ({ row }) => (row.original.is_default ? "Yes" : "No"),
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
                  id: row.original.id,
                  name: row.original.name,
                  description: row.original.description ?? "",
                  location: row.original.location ?? "",
                  pastor_in_charge_id:
                    row.original.pastor_in_charge_id ?? undefined,
                });
                setEditMode(true);
                setDisplayForm(true);
              }}
            />
            {!row.original.is_default && (
              <img
                src={deleteIcon}
                alt="delete icon"
                className="cursor-pointer"
                onClick={() =>
                  showDeleteDialog(row.original, () =>
                    handleDelete(row.original)
                  )
                }
              />
            )}
          </div>
        ),
      },
    ],
    [setInputValue, setEditMode, setDisplayForm, handleDelete]
  );

  useEffect(() => {
    if (selectedTab === "Branches") {
      setColumns(branchColumns);
      setData(branches);
      setTotal(branches.length);
      return;
    }

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
  }, [selectedTab, positionData, positionTotal, positionsColumns, branchColumns, branches]);

  const selectOptions = useMemo(() => {
    if (selectedTab === "Branches") {
      return branchPastorOptions;
    }

    return selectedTab === "Position" ? settingsStore.departmentsOptions : [];
  }, [selectedTab, settingsStore.departmentsOptions, branchPastorOptions]);

  const handleTabSelect = (tab: GeneralSettingsTab) => {
    setSelectedTab(tab);
    if (tab === "Branches") {
      setSelectedId("pastor_in_charge_id");
      setSelectLabel("Pastor in-charge");
    } else if (tab === "Position") {
      setSelectedId("department_id");
      setSelectLabel("Department");
    } else {
      setSelectedId("");
      setSelectLabel("");
    }
    setInputValue({
      created_by: userId,
      name: "",
      description: "",
      location: "",
      pastor_in_charge_id: undefined,
    });
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
