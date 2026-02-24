import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { ProfilePicture } from "@/components/ProfilePicture";
import AddSignature from "@/components/AddSignature";
import Textarea from "@/pages/HomePage/Components/reusable/TextArea";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import EditableTable from "../components/EditableTable";
import RequestAttachments from "../components/RequestAttachments";
import RequisitionComments from "../components/RequisitionComments";
import RequisitionSignatureSection from "../components/RequisitionSignatureSection";
import RequisitionSummary from "../components/RequisitionSummary";
import { useRequisitionDetail } from "../hooks/useRequisitionDetail";

const RequestDetails = () => {
  const navigate = useNavigate();

  const {
    loading,
    detailsError,
    requestData,
    actionType,
    openComment,
    openSignature,
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
    handleOpenSignature,
    addingImage,
    handleSignature,
    handleAddSignature,
    requisitionId,
  } = useRequisitionDetail();

  const requester = requestData?.requester;

  const encodedRequestId = useMemo(() => {
    try {
      return window.btoa(String(requisitionId));
    } catch {
      return "";
    }
  }, [requisitionId]);

  return (
    <PageOutline>
      <Modal open={openSignature} onClose={handleOpenSignature}>
        <AddSignature
          cancel={handleOpenSignature}
          handleSignature={handleSignature}
          onSubmit={handleAddSignature}
          loading={addingImage || isUpdating}
        />
      </Modal>

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
              disabled={!comment.trim()}
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
            {!isApprovedOrRejected && (
              <>
                <Button
                  value="Disapprove"
                  variant="secondary"
                  onClick={() => openCommentModal("reject")}
                />
                <Button
                  value="Approve"
                  variant="primary"
                  onClick={handleOpenSignature}
                />
              </>
            )}
          </div>
        </PageHeader>

        {loading && (
          <div className="app-card p-4 text-sm text-primaryGray">
            Loading requisition details...
          </div>
        )}

        {!loading && detailsError && (
          <div className="rounded-lg border border-error/40 bg-errorBG p-4 text-sm text-error">
            Failed to load request details. Please refresh and try again.
          </div>
        )}

        {!loading && !detailsError && requestData && (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className="app-card space-y-5 p-4 md:p-5">
              <div className="flex flex-wrap items-start gap-4 rounded-lg border border-lightGray p-4">
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
                    {requester?.position ?? "No position"}
                  </p>
                  <p className="text-sm text-primaryGray">{requester?.email || "N/A"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-primary">Requested Items</h3>
                <EditableTable isEditable={false} data={products} />
              </div>

              <RequisitionSignatureSection
                requester={requester}
                requesterSignature={requestData?.summary?.user_sign ?? null}
                requestApprovals={requestData?.request_approvals}
              />
            </section>

            <section className="space-y-4">
              <RequisitionSummary
                summary={requestData?.summary}
                currency={requestData?.currency}
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
