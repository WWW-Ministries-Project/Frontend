import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { ProfilePicture } from "@/components/ProfilePicture";
import Textarea from "@/pages/HomePage/Components/reusable/TextArea";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { relativePath } from "@/utils";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import RequisitionApprovalTimeline from "../components/RequisitionApprovalTimeline";
import EditableTable from "../components/EditableTable";
import RequestAttachments from "../components/RequestAttachments";
import RequisitionComments from "../components/RequisitionComments";
import RequisitionSignatureSection from "../components/RequisitionSignatureSection";
import RequisitionSummary from "../components/RequisitionSummary";
import { useRequisitionDetail } from "../hooks/useRequisitionDetail";
import { getApproverDisplayName, getEditMeta } from "../utils/requestMetadata";

const RequestDetails = () => {
  const navigate = useNavigate();
  const requestsPath = `${relativePath.home.main}/requests`;

  const {
    loading,
    detailsError,
    requestData,
    actionType,
    openComment,
    openCommentModal,
    closeComment,
    comment,
    setComment,
    commentHeader,
    isUpdating,
    handleComment,
    attachments,
    handleAddAttachment,
    handleRemoveAttachment,
    attachmentId,
    isEditable,
    products,
    isApprovedOrRejected,
    requisitionId,
    approvalInstances,
    currentApprovalStep,
    canCurrentUserApprove,
    displayStatus,
    submitButtonDisabled,
  } = useRequisitionDetail();

  const requester = requestData?.requester;
  const currentApproverName = useMemo(
    () =>
      currentApprovalStep ? getApproverDisplayName(currentApprovalStep) : null,
    [currentApprovalStep]
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

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    { label: "Requests", link: requestsPath },
    { label: "Request Details", link: "" },
  ];

  return (
    <PageOutline crumbs={crumbs}>
      <Modal open={openComment} onClose={closeComment}>
        <div className="space-y-6 p-6 md:p-8">
          <p className="text-center text-xl font-semibold text-primary">{commentHeader}</p>
          <Textarea
            label="Comment"
            value={comment}
            onChange={setComment}
            placeholder="Enter comment..."
          />
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

      <div className="space-y-5">
        <PageHeader title="Requisition Details">
          <div className="flex flex-wrap gap-2">
            {isEditable && encodedRequestId && (
              <Button
                value="Edit"
                variant="ghost"
                onClick={() => navigate(`/home/requests/request/${encodedRequestId}`)}
              />
            )}
            {!isApprovedOrRejected && canCurrentUserApprove && (
              <>
                <Button
                  value="Reject"
                  variant="secondary"
                  onClick={() => openCommentModal("reject")}
                />
                <Button
                  value="Approve"
                  variant="primary"
                  onClick={() => openCommentModal("approve")}
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
                value="Back to requests"
                variant="ghost"
                onClick={() => navigate(requestsPath)}
              />
            </div>
          </div>
        )}

        {!loading && detailsError && !isRequisitionAccessDenied && (
          <div className="rounded-lg border border-error/40 bg-errorBG p-4 text-sm text-error">
            Failed to load request details. Please refresh and try again.
          </div>
        )}

        {!loading && !detailsError && requestData && (
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
                {/* end */}
              </div>

              <div>
                <h3 className="text-base font-semibold text-primary">Requested Items</h3>
                <EditableTable isEditable={false} data={products} />
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
                isEditable={isEditable}
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
