import { pictureInstance as axiosPic } from "@/axiosInstance";
import { useAuth } from "@/context/AuthWrapper";
import { usePost } from "@/CustomHooks/usePost";
import { image } from "@/pages/HomePage/Components/MultiImageComponent";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { ApiResponse } from "@/utils/interfaces";
import { FormikErrors, FormikTouched, FormikValues } from "formik";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IRequisitionDetails,
  RequisitionStatusType,
} from "../types/requestInterface";

export interface IRequest {
  requester_name: string;
  department_id: number | string;
  event_id: number | string;
  request_date: string;
  comment: string;
  currency: string;
  approval_status: RequisitionStatusType;
  attachmentLists: { URL: string }[];
  user_sign: string | null;
}
export const useAddRequisition = () => {
  const { id: requestId } = useParams();

  const requisitionId = requestId ? window.atob(String(requestId)) : "";
  type RequisitionMutationResponse = ApiResponse<{
    data: IRequisitionDetails;
    message: string;
  }>;

  const submitRequisition = (payload: Record<string, unknown>) =>
    requisitionId
      ? api.put.updateRequisition<{ data: IRequisitionDetails; message: string }>(
          payload
        )
      : api.post.createRequisition<{ data: IRequisitionDetails; message: string }>(
          payload
        );

  const { postData, loading, error, data } = usePost<
    RequisitionMutationResponse,
    Record<string, unknown>
  >(submitRequisition);
  const {
    user: { id },
  } = useAuth();
  const { rows } = useStore();
  const [openSignature, setOpenSignature] = useState(false);
  const [images, setImages] = useState<image[]>([]);
  const [addingImage, setAddingImage] = useState(false);
  const [signature, setSignature] = useState<{
    signature: File | null | string;
    isImage: boolean;
  }>({ signature: null, isImage: false });

  const navigate = useNavigate();
  const currencies = useMemo(
    () =>
      [
        { label: "Ghana Cedi (GHS)", value: "GHS" },
        { label: "US Dollar (USD)", value: "USD" },
        { label: "Euro (EUR)", value: "EUR" },
        { label: "British Pound Sterling (GBP)", value: "GBP" },
        { label: "Japanese Yen (JPY)", value: "JPY" },
      ] as { label: string; value: string }[],
    []
  );

  const handleOpenNotification = useCallback(
    (message: string, type: "error" | "success") => {
      showNotification(message, type, requisitionId ? "Update requisition" : "Create requisition");
    },
    [requisitionId]
  );

  useEffect(() => {
    if (data) {
      handleOpenNotification(data.data.message, "success");
      navigate(-1);
    }
    if (error) {
      handleOpenNotification(error.message, "error");
    }
  }, [data, error, handleOpenNotification, navigate]);

  const handleAddSignature = async (
    validateForm: () => Promise<FormikErrors<FormikValues>>,
    setTouched: (fields: FormikTouched<FormikValues>) => void
  ) => {
    const errors = await validateForm(); // Validate the form

    if (Object.keys(errors).length) {
      setTouched(
        Object.keys(errors).reduce(
          (acc, field) => ({
            ...acc,
            [field as keyof FormikValues]: true,
          }),
          {} as FormikTouched<FormikValues>
        )
      );
      return;
    }

    setOpenSignature(true); // Open the modal if no errors
  };

  const closeModal = () => {
    setOpenSignature(false);
  };

  const imageChange = (images: image[]) => {
    setImages(images);
  };

  const handleUpload = useCallback(async (formData: FormData) => {
    try {
      setAddingImage(true);
      const response = await axiosPic.post("/upload", formData);
      if (response.status === 200) {
        return { URL: response.data.result.link as string };
      }
      setAddingImage(false);
    } catch (error) {
      handleOpenNotification(
        error instanceof Error ? error.message : "Unknown error",
        "error"
      );
    } finally {
      setAddingImage(false);
    }
  }, [handleOpenNotification]);

  const handleItemImageUpload = useCallback(
    async (file: File): Promise<string | null> => {
      const formData = new FormData();
      formData.append("file", file);
      const uploaded = await handleUpload(formData);
      return uploaded?.URL ?? null;
    },
    [handleUpload]
  );

  const handleUploadImage = async () => {
    let imgUrls: { URL: string; id?: string | number }[] = [];
    if (images?.length) {
      for (const image of images) {
        const formData = new FormData();
        if (image.file) {
          formData.append(`file`, image?.file);
          const uploaded = await handleUpload(formData);
          if (uploaded?.URL) {
            imgUrls = [...imgUrls, uploaded];
          }
        } else {
          imgUrls = [...imgUrls, { URL: image.image, id: image.id }];
        }
      }
    }
    return imgUrls;
  };

  const handleSignature = (signature: File | string, isImage: boolean) => {
    setSignature({ signature, isImage });
  };

  const handleSubmit = useCallback(
    async (val: IRequest) => {
      const products = rows.map((item) => {
        return {
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.amount,
          image_url: item.image_url || undefined,
          image: item.image_url || undefined,
          id: item?.id,
        };
      });

      const data = {
        ...val,
        event_id: Number(val.event_id),
        department_id: Number(val.department_id),
        products,
        user_id: id,
      };
      const dataToSend = requisitionId
        ? {
            ...data,
            id: Number(requisitionId),
          }
        : data;

      await postData(dataToSend);
    },
    [rows, id, postData, requisitionId]
  );

  return {
    currencies,
    handleSubmit,
    loading,
    error,
    data,
    handleAddSignature,
    closeModal,
    openSignature,
    handleUploadImage,
    imageChange,
    addingImage,
    handleSignature,
    signature,
    handleUpload,
    handleItemImageUpload,
  };
};
