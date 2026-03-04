import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { useImageUpload } from "@/pages/HomePage/utils/useImageUpload";
import { api } from "@/utils/api/apiCalls";
import { ApiError } from "@/utils/api/errors/ApiError";
import { ApiResponse } from "@/utils/interfaces";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ApprovalInstance,
  RequisitionApprovalActionPayload,
} from "../types/approvalWorkflow";
import { IRequisitionDetails } from "../types/requestInterface";

export type ActionType =
  | "comment"
  | "reject"
  | "approve"
  | "addAttachment"
  | "removeAttachment";

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
    success: "Requisition rejected successfully",
    error: "Error rejecting requisition",
    title: "Reject Requisition",
  },
  approve: {
    success: "Requisition approved successfully",
    error: "Error approving requisition",
    title: "Approve Requisition",
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

  const message = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0
  );

  return message ?? fallback;
};

export const useRequisitionDetail = () => {
  const { id } = useParams();
  const {
    user: { id: loggedInUserId },
  } = useAuth();

  const requisitionId = id ? window.atob(String(id)) : "";

  const {
    data,
    loading,
    error: detailsError,
    refetch,
  } = useFetch<ApiResponse<IRequisitionDetails>>(
    api.fetch.fetchRequisitionDetails as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<IRequisitionDetails>>,
    { id: requisitionId },
    !requisitionId
  );

  const [requestData, setRequestData] = useState<IRequisitionDetails | null>(
    null
  );
  const [openComment, setOpenComment] = useState(false);
  const [actionType, setActionType] = useState<ActionType>("comment");
  const [comment, setComment] = useState("");
  const [approvalSignature, setApprovalSignature] = useState("");
  const [attachments, setAttachments] = useState<
    { URL: string; id?: number }[]
  >([]);
  const [attachmentId, setAttachmentId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [openSubmitRequestSignature, setOpenSubmitRequestSignature] =
    useState(false);
  const [requestSignature, setRequestSignature] = useState("");

  const { addingImage } = useImageUpload();

  useEffect(() => {
    setAttachments(data?.data?.attachmentLists ?? []);
    setRequestData(data?.data ?? null);
  }, [data]);

  const openCommentModal = (type: ActionType) => {
    setActionType(type);
    setComment("");
    setApprovalSignature("");
    setOpenComment(true);
  };

  const closeComment = () => {
    setComment("");
    setApprovalSignature("");
    setOpenComment(false);
  };

  const commentHeader = useMemo(() => {
    if (actionType === "reject") {
      return "Reject Requisition";
    }

    if (actionType === "approve") {
      return "Approve Requisition";
    }

    return "Add Comment";
  }, [actionType]);

  const handleOpenNotification = (
    message: string,
    type: "error" | "success",
    title: string
  ) => showNotification(message, type, title);

  const refreshDetails = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const updateRequisition = useCallback(
    async (payload: Record<string, unknown>, type: ActionType) => {
      setIsUpdating(true);

      try {
        const response = await api.put.updateRequisition<{
          data?: IRequisitionDetails;
          message?: string;
        }>(payload);

        const { success, title } = notificationMessages[type];

        handleOpenNotification(
          getResponseMessage(response.data, success),
          "success",
          title
        );

        if (type === "removeAttachment") {
          setAttachments((prev) =>
            prev.filter((file) => String(file.id) !== attachmentId)
          );
        }

        await refreshDetails();
      } catch (error) {
        if (!(error instanceof ApiError)) {
          const { error: errorMsg, title } = notificationMessages[type];
          handleOpenNotification(
            error instanceof Error ? error.message : errorMsg,
            "error",
            title
          );
        }
      } finally {
        if (type === "removeAttachment") {
          setAttachmentId("");
        }
        setIsUpdating(false);
      }
    },
    [attachmentId, refreshDetails]
  );

  const executeApprovalAction = useCallback(
    async (type: "approve" | "reject") => {
      const id = Number(requisitionId);
      const normalizedComment = comment.trim();
      const normalizedSignature = approvalSignature.trim();

      if (!Number.isInteger(id) || id <= 0) {
        handleOpenNotification(
          "Invalid requisition identifier.",
          "error",
          "Requisition"
        );
        return;
      }

      if (type === "reject" && !normalizedComment) {
        handleOpenNotification(
          "Provide a clear reason before rejecting this requisition.",
          "error",
          "Reject Requisition"
        );
        return;
      }

      if (type === "approve" && !normalizedSignature) {
        handleOpenNotification(
          "Add your signature before approving this requisition.",
          "error",
          "Approve Requisition"
        );
        return;
      }

      setIsUpdating(true);

      try {
        const payload: RequisitionApprovalActionPayload = {
          requisition_id: id,
          action: type === "approve" ? "APPROVE" : "REJECT",
          comment: normalizedComment || undefined,
        };

        if (type === "approve") {
          payload.user_sign = normalizedSignature;
        }

        const response = await api.post.requisitionApprovalAction(payload);

        const messageMeta = notificationMessages[type];

        handleOpenNotification(
          getResponseMessage(response.data, messageMeta.success),
          "success",
          messageMeta.title
        );

        closeComment();
        await refreshDetails();
      } catch (error) {
        if (!(error instanceof ApiError)) {
          const messageMeta = notificationMessages[type];
          handleOpenNotification(
            error instanceof Error ? error.message : messageMeta.error,
            "error",
            messageMeta.title
          );
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [approvalSignature, comment, refreshDetails, requisitionId]
  );

  const handleComment = async () => {
    const id = Number(requisitionId);

    if (!Number.isInteger(id) || id <= 0) {
      handleOpenNotification(
        "Invalid requisition identifier.",
        "error",
        "Requisition"
      );
      return;
    }

    if (actionType === "comment") {
      const normalizedComment = comment.trim();

      if (!normalizedComment) {
        handleOpenNotification(
          "Please provide a comment before submitting.",
          "error",
          "Add Comment"
        );
        return;
      }

      await updateRequisition(
        {
          comment: normalizedComment,
          id,
        },
        "comment"
      );
      closeComment();
      return;
    }

    if (actionType === "approve") {
      await executeApprovalAction("approve");
      return;
    }

    if (actionType === "reject") {
      await executeApprovalAction("reject");
    }
  };

  const handleAddAttachment = async (attachment: string) => {
    setActionType("addAttachment");
    const updatedAttachments = [...attachments, { URL: attachment }];

    await updateRequisition(
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

    await updateRequisition(
      {
        id: Number(requisitionId),
        attachmentLists: updatedAttachments,
      },
      "removeAttachment"
    );
  };

  const approvalInstances: ApprovalInstance[] = useMemo(
    () =>
      [...(requestData?.approval_instances ?? [])].sort(
        (a, b) => a.step_order - b.step_order
      ),
    [requestData?.approval_instances]
  );

  const currentApprovalStep = useMemo(
    () => approvalInstances.find((step) => step.status === "PENDING") ?? null,
    [approvalInstances]
  );

  const canCurrentUserApprove = useMemo(
    () =>
      Boolean(
        currentApprovalStep &&
          String(currentApprovalStep.approver_user_id) === String(loggedInUserId)
      ),
    [currentApprovalStep, loggedInUserId]
  );

  const displayStatus = useMemo(() => {
    return (
      requestData?.request_approval_status ??
      requestData?.approval_status ??
      requestData?.summary?.request_approval_status ??
      requestData?.summary?.status ??
      "Draft"
    );
  }, [requestData]);

  const isEditable = useMemo(
    () => displayStatus === "Awaiting_HOD_Approval" || displayStatus === "Draft",
    [displayStatus]
  );

  const products = useMemo(
    () =>
      requestData?.products?.map((item) => ({
        name: item.name,
        amount: item.unitPrice,
        quantity: item.quantity,
        total: item.quantity * item.unitPrice,
        image_url: item.image_url ?? item.image ?? "",
        id: String(item.id),
      })) ?? [],
    [requestData]
  );

  const isApprovedOrRejected = useMemo(() => {
    return displayStatus === "APPROVED" || displayStatus === "REJECTED";
  }, [displayStatus]);

  const isDraft = useMemo(() => displayStatus === "Draft", [displayStatus]);

  const openSubmitRequestModal = useCallback(() => {
    const signatureFromRequest =
      requestData?.requester?.user_sign ??
      requestData?.summary?.user_sign ??
      requestData?.request_approvals?.requester_sign ??
      "";

    setRequestSignature(String(signatureFromRequest).trim());
    setOpenSubmitRequestSignature(true);
  }, [requestData]);

  const closeSubmitRequestModal = useCallback(() => {
    setOpenSubmitRequestSignature(false);
  }, []);

  const handleRequestSignature = useCallback((signature: string) => {
    setRequestSignature(signature.trim());
  }, []);

  const handleSubmitRequest = useCallback(async () => {
    const id = Number(requisitionId);
    const normalizedSignature = requestSignature.trim();

    if (!Number.isInteger(id) || id <= 0) {
      handleOpenNotification(
        "Invalid requisition identifier.",
        "error",
        "Send Requisition"
      );
      return;
    }

    if (!normalizedSignature) {
      handleOpenNotification(
        "Add your signature before sending this requisition.",
        "error",
        "Send Requisition"
      );
      return;
    }

    setIsSubmittingRequest(true);

    try {
      await api.put.updateRequisition({
        id,
        user_sign: normalizedSignature,
      });

      const response = await api.post.submitRequisition({
        requisition_id: id,
      });

      handleOpenNotification(
        getResponseMessage(response.data, "Requisition submitted successfully."),
        "success",
        "Send Requisition"
      );

      closeSubmitRequestModal();
      await refreshDetails();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        handleOpenNotification(
          error instanceof Error
            ? error.message
            : "Error sending requisition for approval.",
          "error",
          "Send Requisition"
        );
      }
    } finally {
      setIsSubmittingRequest(false);
    }
  }, [
    closeSubmitRequestModal,
    refreshDetails,
    requestSignature,
    requisitionId,
  ]);

  const submitButtonDisabled = useMemo(() => {
    if (actionType === "reject" || actionType === "comment") {
      return !comment.trim();
    }

    if (actionType === "approve") {
      return !approvalSignature.trim();
    }

    return false;
  }, [actionType, approvalSignature, comment]);

  return {
    requestData,
    loading,
    detailsError,
    openComment,
    setOpenComment,
    actionType,
    openCommentModal,
    closeComment,
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
    addingImage,
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
    displayStatus,
    submitButtonDisabled,
  };
};
