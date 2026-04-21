import AddSignature from "@/components/AddSignature";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { ProfilePicture } from "@/components/ProfilePicture";
import Textarea from "@/pages/HomePage/Components/reusable/TextArea";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { useStore } from "@/store/useStore";
import { relativePath } from "@/utils";
import { Formik } from "formik";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RequisitionApprovalTimeline from "../components/RequisitionApprovalTimeline";
import RequisitionComments from "../components/RequisitionComments";
import RequisitionEditorFields from "../components/RequisitionEditorFields";
import RequisitionSummary from "../components/RequisitionSummary";
import RequestAttachments from "../components/RequestAttachments";
import EditableTable from "../components/EditableTable";
import { useRequisitionDetail } from "../hooks/useRequisitionDetail";
import { useRequisitionFormOptions } from "../hooks/useRequisitionFormOptions";
import { SimilarRequisitionItem } from "../types/approvalWorkflow";
import {
  buildRequisitionInitialValues,
  mapRequisitionAttachmentsToImages,
  mapRequisitionProductsToTableRows,
  type RequisitionFormValues,
} from "../types/requisitionForm";
import { getApproverDisplayName, getEditMeta } from "../utils/requestMetadata";
import { addRequisitionSchema } from "../utils/requisitionSchema";

const RequestDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rows } = useStore((state) => ({
    rows: state.rows,
  }));
  const [isEditMode, setIsEditMode] = useState(false);
  const [editorImages, setEditorImages] = useState(
    mapRequisitionAttachmentsToImages(null),
  );
  const [openJustificationModal, setOpenJustificationModal] = useState(false);
  const [editJustification, setEditJustification] = useState("");
  const [pendingEditValues, setPendingEditValues] =
    useState<RequisitionFormValues | null>(null);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const requisitionSource = searchParams.get("source");
  const isFromStaffRequisitions = requisitionSource === "staff";
  const requisitionListPath = isFromStaffRequisitions
    ? `${relativePath.home.main}/requests/staff_requests`
    : `${relativePath.home.main}/requests`;
  const requisitionListLabel = isFromStaffRequisitions
    ? "Requisitions"
    : "My Requisition";

  const {
    loading,
    detailsError,
    requestData,
    actionType,
    openComment,
    openCommentModal,
    openApproveWithSimilarItemsCheck,
    closeComment,
    openSimilarItemsModal,
    closeSimilarItemsModal,
    continueApproveAfterSimilarItemsCheck,
    similarItemGroups,
    similarItemsLookbackDays,
    isLoadingSimilarItems,
    comment,
    setComment,
    approvalSignature,
    setApprovalSignature,
    commentHeader,
    isUpdating,
    handleComment,
    attachments,
    handleAddAttachment,
    handleRemoveAttachment,
    attachmentId,
    isEditable,
    isDraft,
    products,
    isApprovedOrRejected,
    requesterCanEdit,
    currentPendingApproverCanEdit,
    requisitionId,
    openSubmitRequestSignature,
    openSubmitRequestModal,
    closeSubmitRequestModal,
    requestSignature,
    handleRequestSignature,
    handleSubmitRequest,
    isSubmittingRequest,
    approvalInstances,
    currentApprovalStep,
    canCurrentUserApprove,
    handleItemImageUpload,
    saveRequisitionEdits,
    displayStatus,
    submitButtonDisabled,
  } = useRequisitionDetail();

  const {
    departmentOptions,
    eventOptions,
    currencies,
    departmentsLoading,
    eventsLoading,
  } = useRequisitionFormOptions(requestData);

  const requester = requestData?.requester;
  const currentApproverName = useMemo(
    () =>
      currentApprovalStep ? getApproverDisplayName(currentApprovalStep) : null,
    [currentApprovalStep],
  );
  const isRequisitionAccessDenied = useMemo(() => {
    const message =
      detailsError instanceof Error ? detailsError.message : String(detailsError);
    return message
      .toLowerCase()
      .includes("you do not have permission to access this requisition");
  }, [detailsError]);
  const editMeta = useMemo(() => getEditMeta(requestData), [requestData]);

  const encodedRequestId = useMemo(() => {
    try {
      return window.btoa(String(requisitionId));
    } catch {
      return "";
    }
  }, [requisitionId]);

  const trimmedApprovalSignature = approvalSignature.trim();
  const similarItemsHeading = useMemo(() => {
    if (similarItemsLookbackDays && similarItemsLookbackDays > 0) {
      return `Requested in the last ${similarItemsLookbackDays} days`;
    }

    return "Requested in the configured lookback period";
  }, [similarItemsLookbackDays]);

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    { label: requisitionListLabel, link: requisitionListPath },
    { label: "Requisition Details", link: "" },
  ];

  const initialEditValues = useMemo(
    () =>
      buildRequisitionInitialValues({
        requestData,
        requesterName: requester?.name,
      }),
    [requestData, requester?.name],
  );
  const editTableData = useMemo(
    () => mapRequisitionProductsToTableRows(requestData),
    [requestData],
  );
  const initialEditorImages = useMemo(
    () => mapRequisitionAttachmentsToImages(requestData),
    [requestData],
  );

  useEffect(() => {
    if (isEditMode) {
      setEditorImages(initialEditorImages);
    }
  }, [initialEditorImages, isEditMode]);

  useEffect(() => {
    if (!currentPendingApproverCanEdit && isEditMode) {
      setIsEditMode(false);
      setOpenJustificationModal(false);
      setEditJustification("");
      setPendingEditValues(null);
    }
  }, [currentPendingApproverCanEdit, isEditMode]);

  const formatSimilarItemDate = (value?: string | null) => {
    if (!value) {
      return "Unknown date";
    }

    const parsedDate = DateTime.fromISO(value);
    return parsedDate.isValid ? parsedDate.toFormat("dd LLL yyyy") : "Unknown date";
  };

  const renderSimilarItemCard = (
    item: SimilarRequisitionItem,
    label: "Requested item" | "Match",
  ) => (
    <div className="rounded-xl border border-lightGray p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primaryGray">
        {label}
      </p>
      <div className="flex items-start gap-3">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.item_name}
            className="h-14 w-14 rounded-lg border border-lightGray object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-lightGray text-[10px] text-primaryGray">
            No image
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-primary">{item.item_name}</p>
          <p className="text-xs text-primaryGray">
            Requisition: {item.generated_id || `#${item.requisition_id}`}
          </p>
          <p className="text-xs text-primaryGray">
            Requester: {item.requester_name || "Unknown requester"}
          </p>
          <p className="text-xs text-primaryGray">
            Date: {formatSimilarItemDate(item.request_date)}
          </p>
          <p className="text-xs text-primaryGray">
            Quantity: {item.quantity ?? "N/A"} | Status: {item.status || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );

  const closeJustificationModal = () => {
    if (isUpdating) return;

    setOpenJustificationModal(false);
    setEditJustification("");
    setPendingEditValues(null);
  };

  const resolveAttachmentLists = async () => {
    const uploadedAttachments: { URL: string; id?: number }[] = [];

    for (const attachment of editorImages) {
      if (attachment.file) {
        const uploadedUrl = await handleItemImageUpload(attachment.file);
        if (uploadedUrl) {
          uploadedAttachments.push({ URL: uploadedUrl });
        }
      } else {
        uploadedAttachments.push({ URL: attachment.image, id: attachment.id });
      }
    }

    return uploadedAttachments;
  };

  const handleApproverEditSubmit = async () => {
    if (!pendingEditValues || !editJustification.trim()) {
      return;
    }

    const attachmentLists = await resolveAttachmentLists();
    const payload = {
      ...pendingEditValues,
      attachmentLists,
      products: rows.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.amount,
        image_url: item.image_url || undefined,
        image: item.image_url || undefined,
        id: item.id,
      })),
    };

    const saved = await saveRequisitionEdits(payload, editJustification);

    if (saved) {
      setIsEditMode(false);
      setOpenJustificationModal(false);
      setEditJustification("");
      setPendingEditValues(null);
    }
  };

  return (
    <PageOutline crumbs={crumbs}>
      <Modal open={openSimilarItemsModal} onClose={closeSimilarItemsModal}>
        <div className="space-y-5 p-6 md:p-8">
          <p className="text-center text-xl font-semibold text-primary">
            Similar item requests
          </p>
          <p className="text-sm text-primaryGray">{similarItemsHeading}</p>

          {isLoadingSimilarItems ? (
            <div className="rounded-xl border border-lightGray bg-inputBackground/60 p-4 text-sm text-primaryGray">
              Loading similar requests...
            </div>
          ) : similarItemGroups.length === 0 ? (
            <div className="rounded-xl border border-lightGray bg-inputBackground/60 p-4 text-sm text-primaryGray">
              No matching item requests were found in this period.
            </div>
          ) : (
            <div className="app-scrollbar max-h-[22rem] space-y-3 overflow-y-auto pr-1">
              {similarItemGroups.map((group, index) => (
                <div
                  key={`${group.requestedItem.item_name}-${group.requestedItem.requisition_id}-${index}`}
                  className="space-y-3 rounded-xl border border-lightGray p-3"
                >
                  {renderSimilarItemCard(group.requestedItem, "Requested item")}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primaryGray">
                      Matches ({group.matchItems.length})
                    </p>
                    {group.matchItems.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-lightGray bg-inputBackground/40 p-3 text-xs text-primaryGray">
                        No previous matching requisitions found for this item.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {group.matchItems.map((match, matchIndex) => (
                          <div
                            key={`${match.requisition_id}-${match.item_name}-${matchIndex}`}
                          >
                            {renderSimilarItemCard(match, "Match")}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button value="Cancel" variant="ghost" onClick={closeSimilarItemsModal} />
            <Button
              value="Continue to approval"
              variant="primary"
              onClick={continueApproveAfterSimilarItemsCheck}
              disabled={isLoadingSimilarItems}
            />
          </div>
        </div>
      </Modal>
      <Modal open={openComment} onClose={closeComment}>
        <div className="space-y-6 p-6 md:p-8">
          <p className="text-center text-xl font-semibold text-primary">{commentHeader}</p>
          <Textarea
            label={actionType === "approve" ? "Comment (optional)" : "Comment"}
            value={comment}
            onChange={setComment}
            placeholder="Enter comment..."
          />

          {actionType === "approve" && (
            <div className="space-y-2">
              <label
                htmlFor="approval-signature"
                className="text-sm font-semibold text-primary"
              >
                Signature
              </label>
              <input
                id="approval-signature"
                className="app-input w-full"
                placeholder="Type your full name"
                value={approvalSignature}
                onChange={(event) => setApprovalSignature(event.target.value)}
              />
              <p className="text-xs text-primaryGray">
                Signature is required before final approval submission.
              </p>

              <div className="rounded-xl border border-lightGray bg-inputBackground/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primaryGray">
                  Signature Preview
                </p>
                <div className="mt-3 min-h-[78px] rounded-lg border border-lightGray bg-white px-4 py-3">
                  {trimmedApprovalSignature ? (
                    <p className="app-signature-text break-words text-[2rem] text-primary md:text-[2.25rem]">
                      {trimmedApprovalSignature}
                    </p>
                  ) : (
                    <p className="text-sm text-primaryGray">
                      Signature preview will appear here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {actionType === "reject" && (
            <p className="text-sm text-primaryGray">
              Provide a clear reason for disapproval before submitting.
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button value="Cancel" variant="ghost" onClick={closeComment} />
            <Button
              value="Submit"
              variant="primary"
              onClick={handleComment}
              disabled={submitButtonDisabled}
              loading={isUpdating}
            />
          </div>
        </div>
      </Modal>
      <Modal
        open={openJustificationModal}
        onClose={closeJustificationModal}
      >
        <div className="space-y-6 p-6 md:p-8">
          <p className="text-center text-xl font-semibold text-primary">
            Justify requisition update
          </p>
          <Textarea
            label="Justification"
            value={editJustification}
            onChange={setEditJustification}
            placeholder="Explain why you are updating this requisition..."
          />
          <p className="text-sm text-primaryGray">
            This justification will be saved as a comment and included in the
            notification sent to the requester and prior approvers.
          </p>
          <div className="flex justify-end gap-3">
            <Button value="Cancel" variant="ghost" onClick={closeJustificationModal} />
            <Button
              value="Save changes"
              variant="primary"
              onClick={handleApproverEditSubmit}
              disabled={!editJustification.trim()}
              loading={isUpdating}
            />
          </div>
        </div>
      </Modal>
      <Modal open={openSubmitRequestSignature} onClose={closeSubmitRequestModal}>
        <AddSignature
          cancel={closeSubmitRequestModal}
          text="Send requisition"
          header="Requisition Signing"
          handleSignature={handleRequestSignature}
          onSubmit={handleSubmitRequest}
          loading={isSubmittingRequest}
          defaultSignature={requestSignature}
        />
      </Modal>

      <div className="space-y-5">
        <PageHeader title="Requisition Details">
          <div className="flex flex-wrap gap-2">
            {!isEditMode && requesterCanEdit && encodedRequestId && (
              <Button
                value="Edit"
                variant="ghost"
                onClick={() => navigate(`/home/requests/request/${encodedRequestId}`)}
              />
            )}
            {!loading && requestData && isDraft && requesterCanEdit && (
              <Button
                value="Send requisition"
                variant="primary"
                onClick={openSubmitRequestModal}
                loading={isSubmittingRequest}
                disabled={isSubmittingRequest || isUpdating}
              />
            )}
            {!isEditMode && currentPendingApproverCanEdit && (
              <Button
                value="Edit requisition"
                variant="secondary"
                onClick={() => setIsEditMode(true)}
              />
            )}
            {!isEditMode && !isApprovedOrRejected && canCurrentUserApprove && (
              <>
                <Button
                  value="Reject"
                  variant="secondary"
                  onClick={() => openCommentModal("reject")}
                />
                <Button
                  value="Approve"
                  variant="primary"
                  onClick={openApproveWithSimilarItemsCheck}
                  disabled={isLoadingSimilarItems}
                />
              </>
            )}
          </div>
        </PageHeader>

        {!isApprovedOrRejected && !canCurrentUserApprove && currentApprovalStep && (
          <p className="text-sm text-primaryGray">
            Awaiting action from approver {currentApproverName}.
          </p>
        )}

        {loading && (
          <div className="app-card p-4 text-sm text-primaryGray">
            Loading requisition details...
          </div>
        )}

        {!loading && isRequisitionAccessDenied && (
          <div className="rounded-lg border border-error/40 bg-errorBG p-4 text-sm text-error">
            You do not have permission to access this requisition.
            <div className="mt-3">
              <Button
                value={
                  isFromStaffRequisitions
                    ? "Back to requisitions"
                    : "Back to my requisition"
                }
                variant="ghost"
                onClick={() => navigate(requisitionListPath)}
              />
            </div>
          </div>
        )}

        {!loading && detailsError && !isRequisitionAccessDenied && (
          <div className="rounded-lg border border-error/40 bg-errorBG p-4 text-sm text-error">
            Failed to load requisition details. Please refresh and try again.
          </div>
        )}

        {!loading && !detailsError && requestData && isEditMode && (
          <Formik
            initialValues={initialEditValues}
            onSubmit={(values) => {
              setPendingEditValues(values);
              setOpenJustificationModal(true);
            }}
            validationSchema={addRequisitionSchema}
            enableReinitialize
          >
            {({ submitForm, validateForm, setTouched }) => (
              <section className="app-card space-y-4 p-4 md:p-5">
                <div className="rounded-lg border border-lightGray bg-inputBackground/60 p-4 text-sm text-primaryGray">
                  Saving changes here keeps the requisition on the current approval
                  step. A justification is required before the update is submitted.
                </div>

                <RequisitionEditorFields
                  departmentOptions={departmentOptions}
                  eventOptions={eventOptions}
                  currencies={currencies}
                  departmentsLoading={departmentsLoading}
                  eventsLoading={eventsLoading}
                  initialImages={editorImages}
                  imageChange={setEditorImages}
                  onItemImageUpload={handleItemImageUpload}
                  imageUploadLoading={isUpdating}
                  tableData={editTableData}
                  attachmentFiles={attachments}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    value="Cancel edit"
                    variant="ghost"
                    onClick={() => {
                      setIsEditMode(false);
                      setEditorImages(initialEditorImages);
                    }}
                  />
                  <Button
                    value="Save changes"
                    variant="primary"
                    onClick={async () => {
                      const errors = await validateForm();

                      if (Object.keys(errors).length) {
                        setTouched(
                          Object.keys(errors).reduce(
                            (acc, field) => ({
                              ...acc,
                              [field]: true,
                            }),
                            {} as Record<string, boolean>,
                          ),
                        );
                        return;
                      }

                      await submitForm();
                    }}
                    loading={isUpdating}
                  />
                </div>
              </section>
            )}
          </Formik>
        )}

        {!loading && !detailsError && requestData && !isEditMode && (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className="app-card space-y-5 p-4 md:p-5">
              <h3 className="text-base font-semibold text-primary">Requester information</h3>
              <div className="flex flex-wrap items-center gap-4 justify-between rounded-lg border border-lightGray p-4">
                <div className="flex items-start gap-4">
                  <ProfilePicture
                    alt="requester profile"
                    className="h-[4.5rem] w-[4.5rem] border shadow-sm"
                    name={requester?.name}
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="text-lg font-semibold text-primary">
                      {requester?.name || "Unknown requester"}
                    </p>
                    <p className="text-sm text-primaryGray">
                      {requestData?.summary?.department || "No department"}
                    </p>
                    <p className="text-sm text-primaryGray">
                      {requester?.position ?? "No position"}
                    </p>
                    <p className="text-sm text-primaryGray">{requester?.email || "N/A"}</p>
                    {editMeta.hasEditMeta && (
                      <p className="text-xs text-primaryGray">
                        Last edited by {editMeta.editorName || "Unknown editor"} on{" "}
                        {editMeta.formattedEditedAt || "Unknown date"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <span className="app-signature-text break-words text-3xl text-primary">
                    {requestData?.request_approvals?.requester_sign ??
                      requestData?.summary?.user_sign ??
                      requestData?.requester?.user_sign ??
                      null}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-primary">Requested Items</h3>
                <EditableTable
                  isEditable={false}
                  data={products}
                  currency={requestData?.currency}
                />
              </div>

              <RequisitionApprovalTimeline
                approvalInstances={approvalInstances}
                currentApprovalStep={currentApprovalStep}
              />
            </section>

            <section className="space-y-4">
              <RequisitionSummary
                summary={requestData?.summary}
                currency={requestData?.currency}
                status={displayStatus}
              />
              <RequisitionComments
                isEditable={isEditable || currentPendingApproverCanEdit}
                openCommentModal={openCommentModal}
                comments={requestData?.request_comments ?? []}
              />
              <RequestAttachments
                attachments={attachments}
                isEditable={isEditable}
                addAttachement={handleAddAttachment}
                removAttachment={handleRemoveAttachment}
                isLoading={isUpdating}
                action={actionType}
                fileId={attachmentId}
              />
            </section>
          </section>
        )}
      </div>
    </PageOutline>
  );
};

export default RequestDetails;
