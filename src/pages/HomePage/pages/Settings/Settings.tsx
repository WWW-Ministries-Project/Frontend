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
import { ProgramResponse } from "@/utils/api/ministrySchool/interfaces";
import { RoleEligibilityConfig } from "@/utils/api/settings/eligibilityInterfaces";
import { useUserStore } from "@/store/userStore";
import { ApiError } from "@/utils/api/errors/ApiError";
import { ApiResponse } from "@/utils/interfaces";
import { SearchBar } from "../../../../components/SearchBar";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { showNotification } from "../../utils";
import { AttendanceSettings } from "./Components/AttendanceSettings";
import { EligibilityRules } from "./Components/EligibilityRules";
import { FormsComponent } from "./Components/FormsComponent";
import { LogsSettings } from "./Components/LogsSettings";
import { NotificationSettings } from "./Components/NotificationSettings";
import {
  buildEligibilityRulesPayload,
  createEmptyEligibilityRules,
  normalizeEligibilityRules,
} from "./utils/eligibilityRules";
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
  const [isSavingEligibilityRules, setIsSavingEligibilityRules] =
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
    data: programsResponse,
    loading: programsLoading,
    error: programsError,
    refetch: refetchPrograms,
  } = useFetch<ApiResponse<ProgramResponse[]>>(
    api.fetch.fetchAllPrograms as () => Promise<ApiResponse<ProgramResponse[]>>,
    undefined,
    true
  );
  const {
    data: eligibilityConfigResponse,
    loading: eligibilityConfigLoading,
    error: eligibilityConfigError,
    refetch: refetchEligibilityConfig,
  } = useFetch<ApiResponse<RoleEligibilityConfig | null>>(
    api.fetch.fetchRoleEligibilityConfig as () => Promise<
      ApiResponse<RoleEligibilityConfig | null>
    >,
    undefined,
    true
  );

  const {
    postData: postPosition,
    data: position,
    error: positionError,
    loading: positionLoading,
  } = usePost(api.post.createPosition);
  const {
    updateData: updatePosition,
    loading: positionUpdateLoading,
    error: positionUpdateError,
    data: positionUpdate,
  } = usePut(api.put.updatePosition);
  const {
    executeDelete: deletePosition,
    success: positionDelete,
    error: positionDeleteError,
  } = useDelete(api.delete.deletePosition);

  const handleCloseForm = useCallback(() => {
    setDisplayForm(false);
    setEditMode(false);
  }, []);

  const handleDelete = useCallback(
    (itemToDelete: { id: number }) => {
      deletePosition({ id: itemToDelete.id + "" });
    },
    [deletePosition]
  );

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
    if (position) {
      showNotification("Created successfully", "success");
      refetchPositions();
      handleCloseForm();
    }
    if (positionError) {
      const errorMessage = positionError.message || "Something went wrong";
      showNotification(errorMessage, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, positionError]);

  // Updated data effect
  useEffect(() => {
    if (positionUpdate) {
      showNotification("Updated successfully", "success");
      refetchPositions();
      handleCloseForm();
    }
    if (positionUpdateError) {
      const errorMessage = positionUpdateError.message || "Something went wrong";
      showNotification(errorMessage, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionUpdate, positionUpdateError]);

  // Deleted data effect
  useEffect(() => {
    if (positionDelete) {
      showNotification("Deleted successfully", "success");
      refetchPositions();
    }
    if (positionDeleteError) {
      const errorMessage = positionDeleteError.message || "Something went wrong";
      showNotification(errorMessage, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionDelete, positionDeleteError]);

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

  useEffect(() => {
    if (selectedTab !== "Eligibility Rules") {
      return;
    }

    handleCloseForm();
    refetchPrograms();
    refetchEligibilityConfig();
  }, [handleCloseForm, refetchEligibilityConfig, refetchPrograms, selectedTab]);

  useEffect(() => {
    if (selectedTab !== "Notifications") {
      return;
    }

    handleCloseForm();
  }, [handleCloseForm, selectedTab]);

  useEffect(() => {
    if (selectedTab !== "Logs") {
      return;
    }

    handleCloseForm();
  }, [handleCloseForm, selectedTab]);

  useEffect(() => {
    if (selectedTab !== "Attendance") {
      return;
    }

    handleCloseForm();
  }, [handleCloseForm, selectedTab]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
    handleSearchChange(e.target.value);

  const handleFormSubmit = () => {
    if (selectedTab === "Position") {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      editMode ? updatePosition(inputValue) : postPosition(inputValue);
    }
  };
  const handlePageChange = useCallback(
    (page: number, take: number) => {
      if (selectedTab === "Position") {
        refetchPositions({page, limit:take});
      }
    },
    [refetchPositions, selectedTab]
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

  const programOptions = useMemo(
    () =>
      (programsResponse?.data ?? []).map((program) => ({
        label: program.title,
        value: String(program.id),
      })),
    [programsResponse]
  );

  const eligibilityRules = useMemo(
    () =>
      normalizeEligibilityRules(
        eligibilityConfigResponse?.data ?? createEmptyEligibilityRules()
      ),
    [eligibilityConfigResponse]
  );

  const displayEligibilityRulesError = useMemo(() => {
    if (eligibilityConfigError) {
      return (
        eligibilityConfigError.message || "Unable to load eligibility rules."
      );
    }

    if (programsError) {
      return programsError.message || "Unable to load programs.";
    }

    return null;
  }, [eligibilityConfigError, programsError]);

  const handleSaveEligibilityRules = async (
    rules: ReturnType<typeof createEmptyEligibilityRules>
  ) => {
    setIsSavingEligibilityRules(true);

    try {
      const response = await api.post.upsertRoleEligibilityConfig(
        buildEligibilityRulesPayload(rules)
      );

      showNotification(
        getResponseMessage(
          response.data,
          "Eligibility rules saved successfully."
        ),
        "success"
      );

      await refetchEligibilityConfig();
    } catch (error) {
      if (error instanceof ApiError) {
        return;
      }

      showNotification(
        error instanceof Error
          ? error.message
          : "Unable to save eligibility rules.",
        "error"
      );
    } finally {
      setIsSavingEligibilityRules(false);
    }
  };

  return (
    <PageOutline>
      <div>
        <PageHeader title="General configuration" />
        <p className="P200 text-gray">
          Manage position, requisition, attendance, log routing,
          notification, and eligibility rule configuration settings.
        </p>
        <div className="mt-2 mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-lg border border-lightGray p-1">
            {tabs.map((tab) => (
              <div
                key={tab}
                className={`rounded-lg text-center px-4 py-2 min-w-[10rem] cursor-pointer ${
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

      {selectedTab === "Position" && (
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
                positionUpdateLoading ||
                positionLoading
              }
              selectLabel={selectLabel}
              editMode={editMode}
            />
          </Modal>
        </>
      )}

      {selectedTab === "Notifications" && (
        <>
          <PageHeader className="font-semibold text-xl" title="Notifications" />
          <NotificationSettings />
        </>
      )}

      {selectedTab === "Attendance" && (
        <>
          <PageHeader className="font-semibold text-xl" title="Attendance" />
          <AttendanceSettings />
        </>
      )}

      {selectedTab === "Logs" && (
        <>
          <PageHeader className="font-semibold text-xl" title="Logs" />
          <LogsSettings />
        </>
      )}

      {selectedTab === "Eligibility Rules" && (
        <>
          <PageHeader
            className="font-semibold text-xl"
            title="Eligibility Rules"
          />
          <EligibilityRules
            initialRules={eligibilityRules}
            programOptions={programOptions}
            loading={programsLoading || eligibilityConfigLoading}
            saving={isSavingEligibilityRules}
            error={displayEligibilityRulesError}
            onRetry={() => {
              refetchPrograms();
              refetchEligibilityConfig();
            }}
            onSave={handleSaveEligibilityRules}
          />
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
