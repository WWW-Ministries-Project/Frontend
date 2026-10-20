//TODO STill need cleanup do when time permits
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { api } from "@/utils/api/apiCalls";
import { useBranchStore, ALL_BRANCHES } from "@/store/useBranchStore";
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
import { PositionType } from "@/utils/api/settings/positionInterfaces";
import { RoleEligibilityConfig } from "@/utils/api/settings/eligibilityInterfaces";
import { useUserStore } from "@/store/userStore";
import { ApiError } from "@/utils/api/errors/ApiError";
import { ApiResponse } from "@/utils/interfaces";
import { SearchBar } from "../../../../components/SearchBar";
import PageHeader from "../../Components/PageHeader";
import PageOutline from "../../Components/PageOutline";
import TableComponent from "../../Components/reusable/TableComponent";
import { confirmAction, showLoader, showNotification } from "../../utils";
import { notify } from "@/components/feedback";
import type { BranchDeleteImpact } from "@/utils/api/settings/branchInterfaces";
import { AttendanceSettings } from "./Components/AttendanceSettings";
import { EligibilityRules } from "./Components/EligibilityRules";
import { FormsComponent } from "./Components/FormsComponent";
import { LogsSettings } from "./Components/LogsSettings";
import { NotificationSettings } from "./Components/NotificationSettings";
import { ReportsSettings } from "./Components/ReportsSettings";
import {
  buildEligibilityRulesPayload,
  createEmptyEligibilityRules,
  normalizeEligibilityRules,
} from "./utils/eligibilityRules";
import { useSettingsTabs } from "./utils/useSettingsTabs";

const DEFAULT_SIMILAR_ITEM_LOOKBACK_DAYS = 30;
const DEFAULT_APPROVAL_REPLY_DAYS = 3;
const MAX_APPROVAL_REPLY_DAYS = 30;

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
    refetchBranches,
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any = useOutletContext();

  const userId = useUserStore((state) => state.id);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);

  const [displayForm, setDisplayForm] = useState(false);
  const [inputValue, setInputValue] = useState<Record<string, string | number | undefined>>({
    created_by: userId,
    name: "",
    description: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [branchError, setBranchError] = useState<string | undefined>();
  const [deletedPositionName, setDeletedPositionName] = useState("");
  const [similarItemLookbackDays, setSimilarItemLookbackDays] = useState(
    String(DEFAULT_SIMILAR_ITEM_LOOKBACK_DAYS)
  );
  const [initialSimilarItemLookbackDays, setInitialSimilarItemLookbackDays] =
    useState(String(DEFAULT_SIMILAR_ITEM_LOOKBACK_DAYS));
  const [approvalReplyDays, setApprovalReplyDays] = useState(
    String(DEFAULT_APPROVAL_REPLY_DAYS)
  );
  const [initialApprovalReplyDays, setInitialApprovalReplyDays] = useState(
    String(DEFAULT_APPROVAL_REPLY_DAYS)
  );
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
    data: positionsResponse,
    loading: positionsLoading,
    error: positionsError,
    refetch: refetchEligibilityPositions,
  } = useFetch<ApiResponse<PositionType[]>>(
    api.fetch.fetchPositions as () => Promise<ApiResponse<PositionType[]>>,
    undefined,
    true
  );
  // No branch filter — fetch all members across branches for the pastor-in-charge dropdown
  const { data: branchPastorMembersResponse } = useFetch(
    api.fetch.fetchMembersForOptions
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
  const {
    postData: postBranch,
    data: branchCreateResponse,
    error: branchCreateError,
    loading: branchCreateLoading,
  } = usePost(api.post.createBranch);
  const {
    updateData: updateBranch,
    data: branchUpdateResponse,
    error: branchUpdateError,
    loading: branchUpdateLoading,
  } = usePut(api.put.updateBranch);

  const handleCloseForm = useCallback(() => {
    setDisplayForm(false);
    setEditMode(false);
    setBranchError(undefined);
  }, []);

  const confirmBranchDelete = useCallback(
    async (branch: { id: number; name?: string }) => {
      const name = branch.name ?? "this branch";
      showLoader(true);
      let impact: BranchDeleteImpact | undefined;
      try {
        impact = (await api.fetch.fetchBranchDeleteImpact({ id: String(branch.id) }))
          ?.data;
      } catch {
        return;
      } finally {
        showLoader(false);
      }
      if (!impact) return;

      if (!impact.deletable) {
        confirmAction({
          title: impact.is_default
            ? `${name} is the default branch`
            : `${name} branch can't be deleted yet`,
          points: impact.is_default
            ? ["New members and records land here. Make another branch the default first."]
            : [
                ...impact.blockers.map((blocker) => `Still has ${blocker.label}.`),
                "Move them to another branch, then delete it.",
              ],
          confirmLabel: "Delete branch",
          cancelLabel: "Close",
          blocked: true,
          onConfirm: () => undefined,
        });
        return;
      }

      confirmAction({
        title: `Delete ${name} branch?`,
        points: [
          "It has no members or records left.",
          "It disappears from every branch picker.",
          "This can't be undone.",
        ],
        confirmLabel: "Delete branch",
        cancelLabel: "Keep branch",
        tone: "danger",
        typeToConfirm: name,
        onConfirm: async () => {
          await api.delete.deleteBranch({ id: String(branch.id) });
          notify.success({ title: `${name} branch deleted` });
          refetchBranches?.();
        },
      });
    },
    [refetchBranches]
  );

  const handleDelete = useCallback(
    (itemToDelete: { id: number; name?: string; is_default?: boolean }) => {
      if ("is_default" in itemToDelete) {
        void confirmBranchDelete(itemToDelete);
        return;
      }

      setDeletedPositionName(itemToDelete.name?.trim() ?? "");
      deletePosition({ id: itemToDelete.id + "" });
    },
    [confirmBranchDelete, deletePosition]
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
    setInputValue,
    handleDelete,
    branchPastorOptions:
      branchPastorMembersResponse?.data?.map((member) => ({
        label: member.name,
        value: String(member.id),
      })) ?? [],
  });

  const requisitionConfig = useMemo(
    () => normalizeRequisitionConfig(approvalConfigData?.data),
    [approvalConfigData]
  );

  const parsedSimilarItemLookbackDays = toPositiveInteger(similarItemLookbackDays);
  const hasLookbackDaysChanged =
    similarItemLookbackDays.trim() !== initialSimilarItemLookbackDays.trim();
  const parsedReplyDays = toPositiveInteger(approvalReplyDays);
  const isReplyDaysValid =
    parsedReplyDays !== null && parsedReplyDays <= MAX_APPROVAL_REPLY_DAYS;
  const hasReplyDaysChanged =
    approvalReplyDays.trim() !== initialApprovalReplyDays.trim();

  // Created data effect
  useEffect(() => {
    if (position) {
      const positionName = String(inputValue.name ?? "").trim();
      notify.success({
        title: "Position created",
        message: positionName || undefined,
      });
      refetchPositions();
      handleCloseForm();
    }
    if (positionError) {
      notify.fromError(positionError, {
        title: "Couldn't save the position",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, positionError]);

  // Updated data effect
  useEffect(() => {
    if (positionUpdate) {
      const positionName = String(inputValue.name ?? "").trim();
      notify.success({
        title: "Position updated",
        message: positionName || undefined,
      });
      refetchPositions();
      handleCloseForm();
    }
    if (positionUpdateError) {
      notify.fromError(positionUpdateError, {
        title: "Couldn't save the position",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionUpdate, positionUpdateError]);

  // Deleted data effect
  useEffect(() => {
    if (positionDelete) {
      notify.success({
        title: "Position deleted",
        message: deletedPositionName || undefined,
      });
      refetchPositions();
    }
    if (positionDeleteError) {
      notify.fromError(positionDeleteError, {
        title: deletedPositionName
          ? `Couldn't delete ${deletedPositionName}`
          : "Couldn't delete the position",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionDelete, positionDeleteError]);

  useEffect(() => {
    if (branchCreateResponse) {
      showNotification("Branch created successfully", "success");
      refetchBranches?.();
      handleCloseForm();
    }
    if (branchCreateError) {
      showNotification(branchCreateError.message || "Unable to create branch", "error");
    }
  }, [branchCreateError, branchCreateResponse, handleCloseForm, refetchBranches]);

  useEffect(() => {
    if (branchUpdateResponse) {
      showNotification("Branch updated successfully", "success");
      refetchBranches?.();
      handleCloseForm();
    }
    if (branchUpdateError) {
      showNotification(branchUpdateError.message || "Unable to update branch", "error");
    }
  }, [branchUpdateError, branchUpdateResponse, handleCloseForm, refetchBranches]);


  useEffect(() => {
    const configuredLookbackDays = toPositiveInteger(
      requisitionConfig?.similar_item_lookback_days
    );
    const defaultValue = String(
      configuredLookbackDays ?? DEFAULT_SIMILAR_ITEM_LOOKBACK_DAYS
    );

    setSimilarItemLookbackDays(defaultValue);
    setInitialSimilarItemLookbackDays(defaultValue);

    const replyValue = String(
      toPositiveInteger(requisitionConfig?.approval_reply_days) ??
        DEFAULT_APPROVAL_REPLY_DAYS
    );
    setApprovalReplyDays(replyValue);
    setInitialApprovalReplyDays(replyValue);
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
    refetchEligibilityPositions();
    refetchPositions();
    refetchPrograms();
    refetchEligibilityConfig();
  }, [
    handleCloseForm,
    refetchEligibilityConfig,
    refetchEligibilityPositions,
    refetchPositions,
    refetchPrograms,
    selectedTab,
  ]);

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
    if (selectedTab === "Branches") {
      const payload = {
        ...(editMode && { id: Number(inputValue.id) }),
        name: String(inputValue.name || ""),
        description: inputValue.description
          ? String(inputValue.description)
          : undefined,
        location: inputValue.location ? String(inputValue.location) : undefined,
        pastor_in_charge_id: inputValue.pastor_in_charge_id
          ? Number(inputValue.pastor_in_charge_id)
          : null,
      };
      if (editMode) {
        updateBranch(payload);
      } else {
        postBranch(payload);
      }
    }

    if (selectedTab === "Position") {
      if (activeBranchId === ALL_BRANCHES && !inputValue.branch_id) {
        setBranchError("Choose the branch this position belongs to.");
        return;
      }
      const positionPayload = {
        ...inputValue,
        ...(inputValue.branch_id ? { branch_id: Number(inputValue.branch_id) } : {}),
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      editMode ? updatePosition(positionPayload) : postPosition(positionPayload);
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

    if (!isReplyDaysValid || parsedReplyDays === null) {
      showNotification(
        `Reply time must be a whole number from 1 to ${MAX_APPROVAL_REPLY_DAYS} days.`,
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
      approval_reply_days: parsedReplyDays,
    };

    setIsSavingRequisitionSettings(true);

    try {
      const response = await api.post.upsertRequisitionApprovalConfig(payload);

      showNotification(
        getResponseMessage(
          response.data,
          "Requisition settings saved."
        ),
        "success"
      );

      setInitialSimilarItemLookbackDays(String(parsedSimilarItemLookbackDays));
      setInitialApprovalReplyDays(String(parsedReplyDays));
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
  const positionOptions = useMemo(
    () =>
      (positionsResponse?.data ?? []).map((position) => ({
        label: position.name,
        value: String(position.id),
      })),
    [positionsResponse]
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

    if (positionsError) {
      return positionsError.message || "Unable to load positions.";
    }

    return null;
  }, [eligibilityConfigError, positionsError, programsError]);

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
          Manage branches, position, requisition, attendance, reports, log
          routing, notification, and eligibility rule configuration settings.
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

      {(selectedTab === "Position" || selectedTab === "Branches") && (
        <>
          <PageHeader
            className="font-semibold text-xl"
            title={selectedTab}
            buttonValue={"Create " + selectedTab}
            onClick={() => {
              setDisplayForm(!displayForm);
              setInputValue({
                created_by: userId,
                name: "",
                description: "",
                location: "",
                pastor_in_charge_id: undefined,
              });
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
              inputValue={
                inputValue as {
                  name: string;
                  [key: string]: string | number | undefined;
                }
              }
              inputLabel={selectedTab}
              onChange={(name, value) => {
                if (name === "branch_id" && value) setBranchError(undefined);
                setInputValue((prev) => ({ ...prev, [name]: value }));
              }}
              branchError={branchError}
              CloseForm={handleCloseForm}
              onSubmit={handleFormSubmit}
              loading={
                positionUpdateLoading ||
                positionLoading ||
                branchCreateLoading ||
                branchUpdateLoading
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

      {selectedTab === "Reports" && (
        <>
          <PageHeader className="font-semibold text-xl" title="Reports" />
          <ReportsSettings />
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
            positionOptions={positionOptions}
            loading={
              programsLoading || positionsLoading || eligibilityConfigLoading
            }
            saving={isSavingEligibilityRules}
            error={displayEligibilityRulesError}
            onRetry={() => {
              refetchEligibilityPositions();
              refetchPositions();
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

            <div className="space-y-1 border-t border-lightGray pt-4">
              <h4 className="text-base font-semibold text-primary">
                Approval reply time (days)
              </h4>
              <p className="text-sm text-primaryGray">
                How long an approver has before a requisition is marked
                overdue. Overdue approvers get an automatic reminder each
                morning, and admins can chase them from the list.
              </p>
            </div>

            <div className="max-w-[18rem]">
              <label
                htmlFor="requisition-reply-days"
                className="mb-1 block text-sm font-medium text-primary"
              >
                Number of days
              </label>
              <input
                id="requisition-reply-days"
                type="number"
                min={1}
                max={MAX_APPROVAL_REPLY_DAYS}
                step={1}
                className="app-input w-full"
                value={approvalReplyDays}
                onChange={(event) => setApprovalReplyDays(event.target.value)}
                placeholder="e.g. 3"
              />
              {!isReplyDaysValid && (
                <p className="mt-1 text-xs text-error">
                  Enter a whole number from 1 to {MAX_APPROVAL_REPLY_DAYS}.
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
                  !isReplyDaysValid ||
                  (!hasLookbackDaysChanged && !hasReplyDaysChanged)
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
