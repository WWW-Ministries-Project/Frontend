import { Button } from "@/components";
import MultiSelect from "@/components/MultiSelect";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { showNotification } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import { useMemo, useState } from "react";

const approvalSubTabs = ["Requisition"] as const;
type ApprovalSubTab = (typeof approvalSubTabs)[number];

type ApproverType = "head_of_department" | "position" | "specific_person";

type ApproverRule = {
  id: string;
  type: ApproverType;
  targetValue: string;
};

const approverTypeOptions: Array<{ label: string; value: ApproverType }> = [
  { label: "Head of Department", value: "head_of_department" },
  { label: "Position", value: "position" },
  { label: "Specific Person", value: "specific_person" },
];

const createApproverRule = (
  type: ApproverType = "head_of_department"
): ApproverRule => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  type,
  targetValue: "",
});

const parseApproverType = (value: string | number): ApproverType => {
  const normalized = String(value);
  if (
    normalized === "head_of_department" ||
    normalized === "position" ||
    normalized === "specific_person"
  ) {
    return normalized;
  }
  return "head_of_department";
};

const requiresTargetSelection = (type: ApproverType) =>
  type === "position" || type === "specific_person";

const ApprovalSettings = () => {
  const [selectedSubTab, setSelectedSubTab] =
    useState<ApprovalSubTab>("Requisition");
  const [selectedRequesters, setSelectedRequesters] = useState<string[]>([]);
  const [approverRules, setApproverRules] = useState<ApproverRule[]>([
    createApproverRule(),
  ]);

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

  const isSaveDisabled =
    selectedRequesters.length === 0 || isApproverTargetMissing;

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
      if (current.length === 1) return current;
      return current.filter((approver) => approver.id !== approverId);
    });
  };

  const handleSaveChanges = () => {
    if (selectedRequesters.length === 0) {
      showNotification(
        "Select at least one requester for this requisition type.",
        "error"
      );
      return;
    }

    if (isApproverTargetMissing) {
      showNotification(
        "Complete all approver selections before saving the workflow.",
        "error"
      );
      return;
    }

    showNotification("Approval requisition configuration saved.", "success");
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

                    {approver.type === "position" && (
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

                    {approver.type === "specific_person" && (
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

                    {approver.type === "head_of_department" && (
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
              />
            </div>
          </div>
        </section>
      )}
    </PageOutline>
  );
};

export default ApprovalSettings;
