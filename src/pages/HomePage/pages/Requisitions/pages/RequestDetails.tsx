import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import RequisitionSummary from "../components/RequisitionSummary";
import EditableTable from "../components/EditableTable";
import RequisitionComments from "../components/RequisitionComments";
import RequisitionSignatureSection from "../components/RequisitionSignatureSection";
import Modal from "@/components/Modal";
import RequestAttachments from "../components/RequestAttachments";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import AddSignature from "@/components/AddSignature";
import Textarea from "@/pages/HomePage/Components/reusable/TextArea";
import { useRequisitionDetail } from "../hooks/useRequisitionDetail";
import { useNavigate } from "react-router-dom";

const RequestDetails = () => {
    const navigate = useNavigate();
  

  const {
    loading,
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
    requisitionId:id
  } = useRequisitionDetail();

  const requester = requestData?.requester;

  if (loading) return <LoaderComponent />;

  return (
    <PageOutline>
      {/* Modals */}
      <Modal open={openSignature} onClose={handleOpenSignature}>
        <AddSignature
          cancel={handleOpenSignature}
          handleSignature={handleSignature}
          onSubmit={handleAddSignature}
          loading={addingImage || isUpdating}
        />
      </Modal>

      <Modal open={openComment} onClose={closeComment}>
        <div className="p-10 flex flex-col gap-8">
          <p className="text-center text-dark900 font-bold text-xl ">
            {commentHeader}
          </p>
          <Textarea
            label="Comment"
            value={comment}
            onChange={setComment}
            placeholder="Enter comment..."
          />
          {actionType === "reject" && (
            <p className="text-dark900 text-sm">
              By clicking "Submit", you agreed to disapproving this request
            </p>
          )}
          <div className="flex gap-4 justify-end">
            <Button
              value="Cancel"
              className="tertiary"
              onClick={closeComment}
            />
            <Button
              value="Submit"
              className="primary"
              onClick={handleComment}
              disabled={!comment}
              loading={isUpdating}
            />
          </div>
        </div>
      </Modal>

      {/* Page Header */}
      <PageHeader title="Requisition Details">
        <div className="flex gap-2">
          {isEditable && (
            <Button
              value="Edit"
              className="tertiary"
              onClick={() => navigate(`/home/requests/request/${id}`)}
            />
          )}
          {!isApprovedOrRejected && (
            <>
              <Button
                value="Disapprove"
                className="secondary"
                onClick={() => openCommentModal("reject")}
              />
              <Button
                value="Approve"
                className="primary"
                onClick={handleOpenSignature}
              />
            </>
          )}
        </div>
      </PageHeader>

      <section className="grid grid-cols-4 gap-4 text-dark900">
        {/* Left Section */}
        <section className="border rounded-xl p-3 col-span-3 border-[#D9D9D9] h-fit">
          <div className="flex gap-3">
            <ProfilePic
              alt="profile pic"
              className="w-[7rem] h-[7rem] border shadow-md"
              name={requestData?.requester?.name}
            />
            <div>
              <div className="font-bold">{requestData?.requester?.name}</div>
              <div className="text-mainGray">
                {requestData?.requester?.position ?? "N/A"}
              </div>
              <div className="text-mainGray">
                {requestData?.requester?.email}
              </div>
            </div>
          </div>
          <HorizontalLine />
          <div className="pl-4">
            <PageHeader title="Request Details" />
          </div>
          <EditableTable isEditable={false} data={products} />
          <HorizontalLine />
          <RequisitionSignatureSection
            requester={{...requester,user_sign:requestData?.summary?.user_sign ?? null}}
            requuest_approvals={requestData?.request_approvals}
          />
        </section>

        {/* Right Section */}
        <section className="flex flex-col gap-4 col-span-1">
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
    </PageOutline>
  );
};

export default RequestDetails;
