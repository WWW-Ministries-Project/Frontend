import { Button } from "@/components";
import MultiSelect from "@/components/MultiSelect";
import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import {
  ApprovalStep,
  ApproverType,
  RequisitionApprovalConfig,
  RequisitionApprovalConfigPayload,
} from "@/pages/HomePage/pages/Requisitions/types/approvalWorkflow";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { showNotification } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { ApiError } from "@/utils/api/errors/ApiError";
import { ApiResponse } from "@/utils/interfaces";
import { useCallback, useEffect, useMemo, useState } from "react";

const approvalSubTabs = ["Requisition"] as const;
type ApprovalSubTab = (typeof approvalSubTabs)[number];

type ApproverRule = {
  id: string;
  type: ApproverType;
  targetValue: string;
};

const approverTypeOptions: Array<{ label: string; value: ApproverType }> = [
  { label: "Head of Department", value: "HEAD_OF_DEPARTMENT" },
  { label: "Position", value: "POSITION" },
  { label: "Specific Person", value: "SPECIFIC_PERSON" },
];

const createApproverRule = (
  type: ApproverType = "HEAD_OF_DEPARTMENT"
): ApproverRule => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  type,
  targetValue: "",
});

const parseApproverType = (value: string | number): ApproverType => {
  const normalized = String(value);
  if (
    normalized === "HEAD_OF_DEPARTMENT" ||
    normalized === "POSITION" ||
    normalized === "SPECIFIC_PERSON"
  ) {
    return normalized;
  }

  return "HEAD_OF_DEPARTMENT";
};

const requiresTargetSelection = (type: ApproverType) =>
  type === "POSITION" || type === "SPECIFIC_PERSON";

const isPositiveInteger = (value: number) =>
  Number.isInteger(value) && value > 0;

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

const normalizeConfig = (
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

const validateConfigPayload = (
  payload: RequisitionApprovalConfigPayload
): string | null => {
  if (payload.module !== "REQUISITION") {
    return "Module must be REQUISITION.";
  }

  if (payload.requester_user_ids.length === 0) {
    return "Select at least one requester for this requisition type.";
  }

  const uniqueRequesterIds = new Set(payload.requester_user_ids);
  if (uniqueRequesterIds.size !== payload.requester_user_ids.length) {
    return "Requester list contains duplicate users.";
  }

  if (payload.requester_user_ids.some((id) => !isPositiveInteger(id))) {
    return "Requester IDs must be positive numbers.";
  }

  if (payload.approvers.length === 0) {
    return "Add at least one approver step.";
  }

  const orders = payload.approvers.map((approver) => approver.order);

  if (new Set(orders).size !== orders.length) {
    return "Each approver step must have a unique order.";
  }

  const sortedOrders = [...orders].sort((a, b) => a - b);
  const isSequential = sortedOrders.every((order, index) => order === index + 1);

  if (!isSequential) {
    return "Approver order must be sequential (1..N).";
  }

  for (const approver of payload.approvers) {
    if (!isPositiveInteger(approver.order)) {
      return "Approver order values must be positive integers.";
    }

    if (approver.type === "HEAD_OF_DEPARTMENT") {
      if (approver.position_id !== undefined || approver.user_id !== undefined) {
        return "Head of Department step must not include position or user.";
      }
    }

    if (approver.type === "POSITION") {
      if (
        !isPositiveInteger(Number(approver.position_id)) ||
        approver.user_id !== undefined
      ) {
        return "Position step must include only a valid position.";
      }
    }

    if (approver.type === "SPECIFIC_PERSON") {
      if (
        !isPositiveInteger(Number(approver.user_id)) ||
        approver.position_id !== undefined
      ) {
        return "Specific Person step must include only a valid user.";
      }
    }
  }

  return null;
};

const ApprovalSettings = () => {
  const [selectedSubTab, setSelectedSubTab] =
    useState<ApprovalSubTab>("Requisition");
  const [selectedRequesters, setSelectedRequesters] = useState<string[]>([]);
  const [approverRules, setApproverRules] = useState<ApproverRule[]>([
    createApproverRule(),
  ]);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: approvalConfigData,
    loading: isLoadingConfig,
    error: approvalConfigError,
    refetch: refetchApprovalConfig,
  } = useFetch<
    ApiResponse<RequisitionApprovalConfig | RequisitionApprovalConfig[] | null>
  >(
    api.fetch.fetchRequisitionApprovalConfig as () => Promise<
      ApiResponse<RequisitionApprovalConfig | RequisitionApprovalConfig[] | null>
    >
  );

  const membersOptions = useStore((state) => state.membersOptions);
  const positions = useSettingsStore((state) => state.positions);

  const userOptions = useMemo(
    () =>
      membersOptions.map((member) => ({
        label: member.label,
        value: String(member.value),
      })),
    [membersOptions]
  );

  const positionOptions = useMemo(
    () =>
      positions.map((position) => ({
        label: position.name,
        value: String(position.id),
      })),
    [positions]
  );

  const isApproverTargetMissing = useMemo(
    () =>
      approverRules.some(
        (approver) =>
          requiresTargetSelection(approver.type) &&
          !String(approver.targetValue || "").trim()
      ),
    [approverRules]
  );

  const hasInvalidRequesterSelection = useMemo(
    () =>
      selectedRequesters.some(
        (requesterId) => !isPositiveInteger(Number(requesterId))
      ),
    [selectedRequesters]
  );

  const hasInvalidApproverSelection = useMemo(
    () =>
      approverRules.some(
        (approver) =>
          requiresTargetSelection(approver.type) &&
          !isPositiveInteger(Number(approver.targetValue))
      ),
    [approverRules]
  );

  const isSaveDisabled = useMemo(
    () =>
      isSaving ||
      selectedRequesters.length === 0 ||
      isApproverTargetMissing ||
      hasInvalidRequesterSelection ||
      hasInvalidApproverSelection,
    [
      hasInvalidApproverSelection,
      hasInvalidRequesterSelection,
      isApproverTargetMissing,
      isSaving,
      selectedRequesters.length,
    ]
  );

  useEffect(() => {
    const config = normalizeConfig(approvalConfigData?.data);

    if (!config) {
      return;
    }

    const requesterIds = Array.isArray(config.requester_user_ids)
      ? config.requester_user_ids
      : [];

    const configuredApprovers = Array.isArray(config.approvers)
      ? [...config.approvers].sort((a, b) => a.order - b.order)
      : [];

    setSelectedRequesters(requesterIds.map((id) => String(id)));
    setApproverRules(
      configuredApprovers.length > 0
        ? configuredApprovers.map((approver) => {
            const normalizedType = parseApproverType(
              String(approver.type).toUpperCase()
            );

            return {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: normalizedType,
              targetValue:
                normalizedType === "POSITION"
                  ? String(approver.position_id ?? "")
                  : normalizedType === "SPECIFIC_PERSON"
                    ? String(approver.user_id ?? "")
                    : "",
            };
          })
        : [createApproverRule()]
    );

    setIsActive(Boolean(config.is_active ?? true));
  }, [approvalConfigData]);

  const handleApproverTypeChange = (
    approverId: string,
    value: string | number
  ) => {
    const nextType = parseApproverType(value);

    setApproverRules((current) =>
      current.map((approver) =>
        approver.id === approverId
          ? { ...approver, type: nextType, targetValue: "" }
          : approver
      )
    );
  };

  const handleApproverTargetChange = (
    approverId: string,
    value: string | number
  ) => {
    setApproverRules((current) =>
      current.map((approver) =>
        approver.id === approverId
          ? { ...approver, targetValue: String(value) }
          : approver
      )
    );
  };

  const handleAddApprover = () => {
    setApproverRules((current) => [...current, createApproverRule()]);
  };

  const handleRemoveApprover = (approverId: string) => {
    setApproverRules((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((approver) => approver.id !== approverId);
    });
  };

  const buildPayload = useCallback((): RequisitionApprovalConfigPayload => {
    const approvers: ApprovalStep[] = approverRules.map((approver, index) => {
      const normalizedStep: ApprovalStep = {
        order: index + 1,
        type: approver.type,
      };

      if (approver.type === "POSITION") {
        normalizedStep.position_id = Number(approver.targetValue);
      }

      if (approver.type === "SPECIFIC_PERSON") {
        normalizedStep.user_id = Number(approver.targetValue);
      }

      return normalizedStep;
    });

    return {
      module: "REQUISITION",
      requester_user_ids: selectedRequesters.map((id) => Number(id)),
      approvers,
      is_active: isActive,
    };
  }, [approverRules, isActive, selectedRequesters]);

  const handleSaveChanges = async () => {
    const payload = buildPayload();
    const validationError = validateConfigPayload(payload);

    if (validationError) {
      showNotification(validationError, "error");
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.post.upsertRequisitionApprovalConfig(payload);

      showNotification(
        getResponseMessage(
          response.data,
          "Approval requisition configuration saved."
        ),
        "success"
      );

      await refetchApprovalConfig();
    } catch (error) {
      if (error instanceof ApiError) {
        return;
      }

      showNotification(
        error instanceof Error
          ? error.message
          : "Unable to save approval configuration.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const displayConfigError = useMemo(() => {
    if (!approvalConfigError) {
      return null;
    }

    return approvalConfigError.message || "Unable to load approval configuration.";
  }, [approvalConfigError]);

  const renderValidationHints = () => {
    if (selectedRequesters.length === 0) {
      return (
        <p className="text-xs text-error">
          Select at least one requester for this requisition type.
        </p>
      );
    }

    if (hasInvalidRequesterSelection) {
      return (
        <p className="text-xs text-error">
          All selected requester IDs must be numeric.
        </p>
      );
    }

    if (isApproverTargetMissing) {
      return (
        <p className="text-xs text-error">
          Complete all approver selections before saving the workflow.
        </p>
      );
    }

    if (hasInvalidApproverSelection) {
      return (
        <p className="text-xs text-error">
          Approver selections must be valid numeric IDs.
        </p>
      );
    }

    return null;
  };

  return (
    <PageOutline>
      <PageHeader title="Approval Configuration" />
      <p className="mb-4 text-sm text-primaryGray">
        Manage requisition requester and approver workflow settings.
      </p>

      <div className="mb-2 w-full max-w-sm">
        <TabSelection
          tabs={[...approvalSubTabs]}
          selectedTab={selectedSubTab}
          onTabSelect={setSelectedSubTab}
        />
      </div>

      {selectedSubTab === "Requisition" && (
        <section className="app-card space-y-8 p-4 md:p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-primary">Requisition</h3>
            <p className="text-sm text-primaryGray">
              Configure who can create requests and who can approve each step.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-base font-semibold text-primary">
              Who can make this type of request?
            </h4>
            <div className="max-w-xl">
              <MultiSelect
                options={userOptions}
                selectedValues={selectedRequesters}
                onChange={setSelectedRequesters}
                placeholder="Select users"
                emptyMsg="No requester selected"
              />
            </div>
            {renderValidationHints()}
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-semibold text-primary">
              Configuration state
            </h4>
            <label className="inline-flex items-center gap-2 text-sm text-primaryGray">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-lightGray text-primary"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Active (only active configuration is used during submit)
            </label>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-primary">
                Who can approve these requests?
              </h4>
              <p className="text-sm text-primaryGray">
                Add approvers in the order a requisition should be approved.
              </p>
            </div>

            <div className="space-y-4">
              {approverRules.map((approver, index) => (
                <div
                  key={approver.id}
                  className="rounded-xl border border-lightGray p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium text-primaryGray">
                      Approval Step {index + 1}
                    </p>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
                    <SelectField
                      id={`approver-type-${approver.id}`}
                      label="Approver Type"
                      value={approver.type}
                      options={approverTypeOptions}
                      onChange={(_, value) =>
                        handleApproverTypeChange(approver.id, value)
                      }
                    />

                    {approver.type === "POSITION" && (
                      <SelectField
                        id={`approver-target-${approver.id}`}
                        label="Select Position"
                        value={approver.targetValue}
                        options={positionOptions}
                        placeholder="Select position"
                        helperText={
                          positionOptions.length === 0
                            ? "No positions available."
                            : undefined
                        }
                        searchable
                        onChange={(_, value) =>
                          handleApproverTargetChange(approver.id, value)
                        }
                      />
                    )}

                    {approver.type === "SPECIFIC_PERSON" && (
                      <SelectField
                        id={`approver-target-${approver.id}`}
                        label="Select User"
                        value={approver.targetValue}
                        options={userOptions}
                        placeholder="Select user"
                        helperText={
                          userOptions.length === 0
                            ? "No users available in the pool."
                            : undefined
                        }
                        searchable
                        onChange={(_, value) =>
                          handleApproverTargetChange(approver.id, value)
                        }
                      />
                    )}

                    {approver.type === "HEAD_OF_DEPARTMENT" && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-primary">
                          Approver Target
                        </span>
                        <div className="app-input text-primaryGray">
                          Requester&#39;s Head of Department
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:text-gray-400"
                      onClick={() => handleRemoveApprover(approver.id)}
                      disabled={approverRules.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              value="+ Add approver"
              type="button"
              variant="ghost"
              onClick={handleAddApprover}
            />
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 border-t border-lightGray bg-white px-4 py-4 md:-mx-6 md:px-6">
            <div className="flex justify-end">
              <Button
                value="Save Changes"
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaveDisabled}
                loading={isSaving}
              />
            </div>
          </div>

          {isLoadingConfig && (
            <p className="text-xs text-primaryGray">
              Loading existing approval configuration...
            </p>
          )}

          {displayConfigError && (
            <p className="rounded-md border border-error/40 bg-errorBG px-3 py-2 text-xs text-error">
              {displayConfigError}
            </p>
          )}
        </section>
      )}
    </PageOutline>
  );
};

export default ApprovalSettings;
