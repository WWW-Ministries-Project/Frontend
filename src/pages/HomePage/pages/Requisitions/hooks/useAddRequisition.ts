import { pictureInstance as axiosPic } from "@/axiosInstance";
import { usePost } from "@/CustomHooks/usePost";
import { image } from "@/pages/HomePage/Components/MultiImageComponent";
import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import { fetchCurrencies } from "@/pages/HomePage/utils/apiCalls";
import { useStore } from "@/store/useStore";
import api from "@/utils/apiCalls";
import { decodeToken } from "@/utils/helperFunctions";
import { ApiResponse } from "@/utils/interfaces";
import { FormikErrors, FormikTouched, FormikValues } from "formik";
import { useCallback, useEffect, useState } from "react";
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
  user_sign: string |null;
}
export const useAddRequisition = () => {
  const { id: requestId } = useParams();

  const requisitionId = requestId ? window.atob(String(requestId)) : "";
  const { postData, loading, error, data } = usePost<
    ApiResponse<{ data: IRequisitionDetails; message: string }>
  >(requisitionId ? api.put.updateRequisition : api.post.createRequisition);
  const { id } = decodeToken();
  const { rows } = useStore();
  const [openSignature, setOpenSignature] = useState(false);
  const [images, setImages] = useState<image[]>([]);
  const [addingImage, setAddingImage] = useState(false);
  const [signature, setSignature] = useState<{
    signature: File | null | string;
    isImage: boolean;
  }>({ signature: null, isImage: false });

  const navigate = useNavigate();
  const { setNotification } = useNotificationStore();
  const [currencies, setCurrencies] = useState<
    { name: string; value: string }[]
  >([]);

  const fetchCurrenciesData = useCallback(async () => {
    const data = await fetchCurrencies();
    setCurrencies(
      data?.data?.map((data) => ({
        name: data?.currency,
        value: data?.currency,
      }))
    );
  }, []);

  useEffect(() => {
    fetchCurrenciesData();
  }, [fetchCurrenciesData]);

  const handleOpenNotification = useCallback(
    (message: string, type: "error" | "success") => {
      setNotification({
        message: message,
        show: true,
        type: type,
        title: requisitionId ? "Update requisition" : "Create requisition",
        onClose: () => {},
      });
    },
    [setNotification]
  );

  useEffect(() => {
    if (data) {
      handleOpenNotification(data.data.message, "success");
      navigate(-1);
    }
    if (error) {
      handleOpenNotification(error.message, "error");
    }
  }, [data, error]);

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
    console.log(images)
  };

  const handleUpload = async (formData: FormData) => {
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
  };

  const handleUploadImage = async () => {
    let imgUrls: { URL: string; id?: string | number }[] = [];
    if (images?.length) {
      for (const image of images) {
        const formData = new FormData();
        if (image.file) {
          formData.append(`file`, image?.file);
          imgUrls = [
            ...imgUrls,
            (await handleUpload(formData)) as { URL: string },
          ];
        } else {
          imgUrls = [...imgUrls, { URL: image.image, id: image.id }];
        }
      }
    }
    return imgUrls;
  };

  const handleSignature = (signature: File | string, isImage: boolean) => {
    setSignature({ signature, isImage });
    console.log(signature);
  };

  const handleSubmit = useCallback(
    async (val: IRequest) => {
      const products = rows.map((item) => {
        return {
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.amount,
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
    [rows, id, postData]
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
  };
};
