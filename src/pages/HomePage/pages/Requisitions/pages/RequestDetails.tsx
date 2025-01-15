import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import RequisitionSummary from "../components/RequisitionSummary";
import EditableTable from "../components/EditableTable";
import RequisitionComments from "../components/RequisitionComments";
import RequisitionSignatureSection from "../components/RequisitionSignatureSection";
import api from "@/utils/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import Modal from "@/components/Modal";
import TextField from "@/pages/HomePage/Components/reusable/TextField";
import RequestAttachments from "../components/RequestAttachments";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import AddSignature from "@/components/AddSignature";
import type { IRequisitionDetails } from "../types/requestInterface";
import { ApiResponse } from "@/utils/interfaces";
import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const requisitionId = window.atob(String(id));
  const [attachments, setAttachments] = useState<
    { URL: string; id?: number }[]
  >([]);
  const [openSignature, setOpenSignature] = useState(false);
  const [openComment, setOpenComment] = useState(false);

  const { data, loading } = useFetch<{
    data: { data: IRequisitionDetails };
  }>(api.fetch.fetchRequisitionDetails, { id: requisitionId });

  const {
    postData,
    data: updateData,
    loading: isUpdating,
  } = usePost<ApiResponse<{ data: IRequisitionDetails; message: string }>>(
    api.put.updateRequisition
  );

  const requestData = useMemo(() => data?.data?.data, [data]);
  const [action,setAction] = useState("")
  const [fileId, setFileId] = useState("");
  const { setNotification } = useNotificationStore();


  const isEditable = useMemo(() => {
    const status = requestData?.summary?.status;
    return status === "Awaiting_HOD_Approval" || status === "Draft";
  }, [requestData]);

  const products = useMemo(
    () =>
      requestData?.products?.map((item) => ({
        name: item.name,
        amount: item.unitPrice,
        quantity: item.quantity,
        total: item.quantity * item.unitPrice,
        id: String(item.id),
      })) ?? [],
    [requestData]
  );

  useEffect(() => {
    if (requestData?.attachmentLists) {
      setAttachments(requestData.attachmentLists);
    }
  }, [requestData]);


  const handleAddAttachment = async (attachment: string) => {
  setAction("add")
    const updatedAttachments = [...attachments, { URL: attachment }];
    setFileId("");
    await postData({
      id: Number(requisitionId),
      attachmentLists: updatedAttachments,
    });
  };

  const handleRemoveAttachment = async (id: number) => {
    setAction("delete")
    const updatedAttachments = attachments.filter((att) => att.id !== id);
    setFileId(String(id));
    await postData({
      id: Number(requisitionId),
      attachmentLists: updatedAttachments,
    });
  };

  const handleOpenNotification = useCallback(
    (action: string, type: "error" | "success", title:string) => {
      setNotification({
        message: `Attachment ${action} successfuly`,
        show: true,
        type: type,
        title: `${title} attachment`,
        onClose: () => {},
      });
    },
    [setNotification]
  );

  useEffect(() => {
    if (updateData?.status === 201) {
      if (fileId) {
        setAttachments((prev) =>
          prev.filter((file) => String(file.id) !== fileId)
        );

        handleOpenNotification("deleted","success","Delete")
      } else {
        setAttachments(updateData.data.data.attachmentLists);
        handleOpenNotification("added","success","Add")

      }
    }
  }, [updateData]); // Runs when updateData change

  if (loading) return <LoaderComponent />;

  return (
    <PageOutline>
      {/* Modals */}
      <Modal open={openSignature} onClose={() => setOpenSignature(false)}>
        <AddSignature
          cancel={() => setOpenSignature(false)}
          handleSignature={() => {}}
          onSubmit={() => {}}
        />
      </Modal>

      <Modal open={openComment} onClose={() => setOpenComment(false)}>
        <div className="p-10">
          <TextField label="Comment" />
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
          <Button
            value="Disapprove"
            className="secondary"
            onClick={() => setOpenComment(true)}
          />
          <Button
            value="Approve"
            className="primary"
            onClick={() => setOpenSignature(true)}
          />
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
            requester={requestData?.requester}
            signatures={{
              receivedBy: { name: "John Doe", signature: "J.D" },
              authorizedBy: {
                name: "Tuffour Boateng",
                signature:
                  "https://www.jsign.com/wp-content/uploads/2022/06/graphic-signature-completeness.png.webp",
              },
              approvedBy: { name: "", signature: "" },
            }}
          />
        </section>

        {/* Right Section */}
        <section className="flex flex-col gap-4 col-span-1">
          <RequisitionSummary
            summary={requestData?.summary}
            currency={requestData?.currency}
          />
          <RequisitionComments isEditable={isEditable} />
          <RequestAttachments
            attachments={attachments}
            isEditable={isEditable}
            addAttachement={handleAddAttachment}
            removAttachment={handleRemoveAttachment}
            isLoading = {isUpdating}
            action={action}
            fileId={fileId}
          />
        </section>
      </section>
    </PageOutline>
  );
};

export default RequestDetails;
