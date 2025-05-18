import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { showNotification } from "@/pages/HomePage/utils";
import { useImageUpload } from "@/pages/HomePage/utils/useImageUpload";
import { api } from "@/utils/api/apiCalls";
import { ApiResponse } from "@/utils/interfaces";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { IRequisitionDetails } from "../types/requestInterface";

export type ActionType =
  | "comment"
  | "reject"
  | "approve"
  | "addAttachment"
  | "removeAttachment";
export const useRequisitionDetail = () => {
  const { id } = useParams();
  const requisitionId = window.atob(String(id));

  const {
    data,
    loading,
    error: detailsError,
  } = useFetch(
    api.fetch.fetchRequisitionDetails,
    { id: requisitionId }
  );

  const {
    postData,
    data: updateData,
    loading: isUpdating,
    error,
  } = usePost<ApiResponse<{ data: IRequisitionDetails; message: string }>>(
    api.put.updateRequisition
  );

  const [requestData, setRequestData] = useState<IRequisitionDetails | null>(
    null
  );
  const [openSignature, setOpenSignature] = useState(false);
  const [openComment, setOpenComment] = useState(false);
  const [actionType, setActionType] = useState<ActionType>("reject");
  const [comment, setComment] = useState("");
  const [attachments, setAttachments] = useState<
    { URL: string; id?: number }[]
  >([]);

  const [attachmentId, setAttachmentId] = useState("");
  const [signature, setSignature] = useState<File | string | null>(null);
  const { handleUpload, addingImage } = useImageUpload();

  useEffect(() => {
    setAttachments(data?.data?.attachmentLists ?? []);
    return setRequestData(data?.data ?? null);
  }, [data]);

  const openCommentModal = (type: ActionType) => {
    setOpenComment(true);
    setActionType(type);
  };

  const closeComment = () => {
    setComment("");
    setOpenComment(false);
  };

  const commentHeader = useMemo(() => {
    if (actionType === "reject") {
      return "Request Disapproval Comment";
    } else {
      return "Add Comment";
    }
  }, [actionType]);

  const handleOpenNotification = (
    message: string,
    type: "error" | "success",
    title: string
  ) => showNotification(message, type, title);

  const notificationMessages: Record<
    ActionType,
    { success: string; error: string; title: string }
  > = {
    comment: {
      success: "Comment added successfully",
      error: "Error adding comment",
      title: "Add Comment",
    },
    reject: {
      success: "Request rejected successfully",
      error: "Error rejecting request",
      title: "Reject Request",
    },
    approve: {
      success: "Request approved successfully",
      error: "Error approving request",
      title: "Approve Request",
    },
    addAttachment: {
      success: "Attachment added successfully",
      error: "Error adding attachment",
      title: "Add Attachment",
    },
    removeAttachment: {
      success: "Attachment removed successfully",
      error: "Error removing attachment",
      title: "Remove Attachment",
    },
  };

  const handleUpdate = async <T>(data: T, type: ActionType) => {
    try {
      await postData(data);
      const { success, title } = notificationMessages[type];
      handleOpenNotification(success, "success", title);
    } catch (error) {
      const { error: errorMsg, title } = notificationMessages[type];
      handleOpenNotification(errorMsg, "error", title);
    }
  };

  const handleComment = async () => {
    const commentData = { comment, id: Number(requisitionId) };
    if (["reject", "comment"].includes(actionType)) {
      await handleUpdate(
        actionType === "reject"
          ? { ...commentData, approval_status: "REJECTED" }
          : commentData,
        actionType
      );
      setComment("");
      setOpenComment(false);
    }
  };
  const handleAddAttachment = async (attachment: string) => {
    setActionType("addAttachment");
    const updatedAttachments = [...attachments, { URL: attachment }];
    await handleUpdate(
      {
        id: Number(requisitionId),
        attachmentLists: updatedAttachments,
      },
      "addAttachment"
    );
  };

  const handleRemoveAttachment = async (id: number) => {
    setActionType("removeAttachment");
    setAttachmentId(String(id));
    const updatedAttachments = attachments.filter((att) => att.id !== id);
    await postData({
      id: Number(requisitionId),
      attachmentLists: updatedAttachments,
    });
  };

  useEffect(() => {
    if (updateData?.status !== 201) return;

    const { data } = updateData.data;

    switch (actionType) {
      case "removeAttachment":
        setAttachments((prev) =>
          prev.filter((file) => String(file.id) !== attachmentId)
        );
        break;
      case "addAttachment":
        setAttachments(data.attachmentLists);
        break;
      default:
        setRequestData(data);
    }

    setAttachmentId("");

    // Reset status after handling the update
    updateData.status = 0; // Or another value that makes sense for your use case
  }, [updateData, actionType, attachmentId]);

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

  const isApprovedOrRejected = useMemo(() => {
    const status = requestData?.summary?.status;
    return status === "APPROVED" || status === "REJECTED";
  }, [requestData]);

  const handleOpenSignature = () => {
    setActionType("approve");
    setOpenSignature((pre) => !pre);
  };

  const handleSignature = (signature: File | string) => {
    setSignature(signature);
  };

  const handleAddSignature = async () => {
    const id = Number(requisitionId);

    if (typeof signature === "string") {
      await handleUpdate({ user_sign: signature, id }, "approve");
    } else {
      const formData = new FormData();
      formData.append("file", signature as File);

      const response = await handleUpload(formData);
      const uploadedURL = response?.URL;

      if (uploadedURL) {
        await handleUpdate({ user_sign: uploadedURL, id }, "approve");
      }
    }

    setOpenSignature(false);
  };

  return {
    requestData,
    loading,
    detailsError,
    openSignature,
    setOpenSignature,
    openComment,
    setOpenComment,
    actionType,
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
  };
};
