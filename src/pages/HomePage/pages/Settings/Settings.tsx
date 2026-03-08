//TODO STill need cleanup do when time permits
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { api } from "@/utils/api/apiCalls";
// import useState from "react-usestateref";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import {
  RequisitionApprovalConfig,
  RequisitionApprovalConfigPayload,
} from "@/pages/HomePage/pages/Requisitions/types/approvalWorkflow";
import { useUserStore } from "@/store/userStore";
import { ApiError } from "@/utils/api/errors/ApiError";
import { ApiResponse } from "@/utils/interfaces";
import { DepartmentType } from "@/utils";
import { SearchBar } from "../../../../components/SearchBar";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { showNotification } from "../../utils";
import { FormsComponent } from "./Components/FormsComponent";
import { useSettingsTabs } from "./utils/useSettingsTabs";

const DEFAULT_SIMILAR_ITEM_LOOKBACK_DAYS = 30;

const getResponseMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const payloadRecord = payload as Record<string, unknown>;
  const nestedData =
    payloadRecord.data && typeof payloadRecord.data === "object"
      ? (payloadRecord.data as Record<string, unknown>)
      : null;

  const candidates = [nestedData?.message, payloadRecord.message];
  const matchedMessage = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0
  );

  return matchedMessage ?? fallback;
};

const normalizeRequisitionConfig = (
  payload: unknown
): RequisitionApprovalConfig | null => {
  const rawConfigs = Array.isArray(payload) ? payload : [payload];

  const config = rawConfigs.find(
    (item) =>
      item &&
      typeof item === "object" &&
      (item as { module?: string }).module === "REQUISITION"
  );

  if (!config || typeof config !== "object") {
    return null;
  }

  return config as RequisitionApprovalConfig;
};

const toPositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

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
  const [similarItemLookbackDays, setSimilarItemLookbackDays] = useState(
    String(DEFAULT_SIMILAR_ITEM_LOOKBACK_DAYS)
  );
  const [initialSimilarItemLookbackDays, setInitialSimilarItemLookbackDays] =
    useState(String(DEFAULT_SIMILAR_ITEM_LOOKBACK_DAYS));
  const [isSavingRequisitionSettings, setIsSavingRequisitionSettings] =
    useState(false);

  const {
    data: approvalConfigData,
    loading: approvalConfigLoading,
    error: approvalConfigError,
    refetch: refetchApprovalConfig,
  } = useFetch<
    ApiResponse<RequisitionApprovalConfig | RequisitionApprovalConfig[] | null>
  >(
    api.fetch.fetchRequisitionApprovalConfig as () => Promise<
      ApiResponse<RequisitionApprovalConfig | RequisitionApprovalConfig[] | null>
    >,
    undefined,
    true
  );

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
      return;
    }

    if (selectedTab === "Position") {
      deletePosition({ id: itemToDelete.id + "" });
    }
  };

  const {
    tabs,
    selectedTab,
    setSelectedTab,
    columns,
    data,
    total,
    selectOptions,
    selectedId,
    selectLabel,
  } = useSettingsTabs({
    setDisplayForm,
    setEditMode,
    //@ts-expect-error will figure it out later
    setInputValue,
    handleDelete,
  });

  const requisitionConfig = useMemo(
    () => normalizeRequisitionConfig(approvalConfigData?.data),
    [approvalConfigData]
  );

  const parsedSimilarItemLookbackDays = toPositiveInteger(similarItemLookbackDays);
  const hasLookbackDaysChanged =
    similarItemLookbackDays.trim() !== initialSimilarItemLookbackDays.trim();

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

  useEffect(() => {
    const configuredLookbackDays = toPositiveInteger(
      requisitionConfig?.similar_item_lookback_days
    );
    const defaultValue = String(
      configuredLookbackDays ?? DEFAULT_SIMILAR_ITEM_LOOKBACK_DAYS
    );

    setSimilarItemLookbackDays(defaultValue);
    setInitialSimilarItemLookbackDays(defaultValue);
  }, [requisitionConfig]);

  useEffect(() => {
    if (selectedTab === "Requisition") {
      handleCloseForm();
      refetchApprovalConfig();
    }
  }, [handleCloseForm, refetchApprovalConfig, selectedTab]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
    handleSearchChange(e.target.value);

  const handleFormSubmit = () => {
    if (selectedTab === "Department") {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      editMode ? updateDepartment(inputValue) : postDepartment(inputValue);
    } else if (selectedTab === "Position") {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      editMode ? updatePosition(inputValue) : postPosition(inputValue);
    }
  };
  const handlePageChange = useCallback(
    (page: number, take: number) => {
      if (selectedTab === "Department") {
        refetchDepartments({limit: take,page});
      } else if (selectedTab === "Position") {
        refetchPositions({page, limit:take});
      }
    },
    [refetchDepartments, refetchPositions, selectedTab]
  );

  const handleSaveRequisitionSettings = async () => {
    if (!parsedSimilarItemLookbackDays) {
      showNotification(
        "Lookback days must be a positive whole number.",
        "error"
      );
      return;
    }

    const payload: RequisitionApprovalConfigPayload = {
      module: "REQUISITION",
      requester_user_ids: requisitionConfig?.requester_user_ids ?? [],
      approvers: requisitionConfig?.approvers ?? [],
      notification_user_ids: requisitionConfig?.notification_user_ids ?? [],
      is_active: requisitionConfig?.is_active ?? true,
      similar_item_lookback_days: parsedSimilarItemLookbackDays,
    };

    setIsSavingRequisitionSettings(true);

    try {
      const response = await api.post.upsertRequisitionApprovalConfig(payload);

      showNotification(
        getResponseMessage(
          response.data,
          "Requisition lookback setting saved successfully."
        ),
        "success"
      );

      setInitialSimilarItemLookbackDays(String(parsedSimilarItemLookbackDays));
      await refetchApprovalConfig();
    } catch (error) {
      if (error instanceof ApiError) {
        return;
      }

      showNotification(
        error instanceof Error
          ? error.message
          : "Unable to save requisition settings.",
        "error"
      );
    } finally {
      setIsSavingRequisitionSettings(false);
    }
  };

  const displayRequisitionConfigError = useMemo(() => {
    if (!approvalConfigError) {
      return null;
    }
    return approvalConfigError.message || "Unable to load requisition settings.";
  }, [approvalConfigError]);

  return (
    <PageOutline>
      <div>
        <PageHeader title="General configuration" />
        <p className="P200 text-gray">
          Manage department, position, and requisition configuration settings.
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

      {selectedTab !== "Requisition" && (
        <>
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
            <div className="mb-5 flex items-center justify-between">
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
              total={total}
              displayedCount={10}
              filter={filter}
              setFilter={setFilter}
              onPageChange={(page, limit) => {
                handlePageChange(page, limit);
              }}
            />
            {data.length === 0 && (
              <EmptyState
                scope="section"
                msg={`No ${selectedTab.toLowerCase()} found`}
                description={`Create ${selectedTab.toLowerCase()} to get started.`}
              />
            )}
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
        </>
      )}

      {selectedTab === "Requisition" && (
        <>
          <PageHeader className="font-semibold text-xl" title="Requisition" />
          <section className="app-card max-w-2xl space-y-4 p-4 md:p-5">
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-primary">
                Similar item lookback (days)
              </h4>
              <p className="text-sm text-primaryGray">
                Before approval, the approver will see items with matching names
                requested during this period.
              </p>
            </div>

            <div className="max-w-[18rem]">
              <label
                htmlFor="requisition-lookback-days"
                className="mb-1 block text-sm font-medium text-primary"
              >
                Number of days
              </label>
              <input
                id="requisition-lookback-days"
                type="number"
                min={1}
                step={1}
                className="app-input w-full"
                value={similarItemLookbackDays}
                onChange={(event) =>
                  setSimilarItemLookbackDays(event.target.value)
                }
                placeholder="e.g. 30"
              />
              {!parsedSimilarItemLookbackDays && (
                <p className="mt-1 text-xs text-error">
                  Enter a positive whole number.
                </p>
              )}
            </div>

            {approvalConfigLoading && (
              <p className="text-xs text-primaryGray">
                Loading requisition settings...
              </p>
            )}

            {displayRequisitionConfigError && (
              <p className="rounded-md border border-error/40 bg-errorBG px-3 py-2 text-xs text-error">
                {displayRequisitionConfigError}
              </p>
            )}

            <div className="flex justify-end">
              <Button
                value="Save Changes"
                onClick={handleSaveRequisitionSettings}
                disabled={
                  isSavingRequisitionSettings ||
                  !parsedSimilarItemLookbackDays ||
                  !hasLookbackDaysChanged
                }
                loading={isSavingRequisitionSettings}
              />
            </div>
          </section>
        </>
      )}
    </PageOutline>
  );
}

export default Settings;
