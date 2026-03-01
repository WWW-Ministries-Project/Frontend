import { pictureInstance as axiosPic } from "@/axiosInstance";
import { useAuth } from "@/context/AuthWrapper";
import { image } from "@/pages/HomePage/Components/MultiImageComponent";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { ApiError } from "@/utils/api/errors/ApiError";
import { ApiResponse } from "@/utils/interfaces";
import { validateUploadFile } from "@/utils/uploadValidation";
import { FormikErrors, FormikTouched, FormikValues } from "formik";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  RequisitionStatusType,
} from "../types/requestInterface";

export interface IRequest {
  requester_name: string;
  department_id: number | string;
  event_id: number | string | "";
  request_date: string;
  comment: string;
  currency: string;
  approval_status: RequisitionStatusType;
  attachmentLists: { URL: string }[];
  user_sign: string | null;
}

type SubmitOptions = {
  submitForApproval?: boolean;
  redirectToDetails?: boolean;
};

type RequisitionMutationResponse = ApiResponse<Record<string, unknown>>;
const REQUESTS_BASE_PATH = "/home/requests";

const isPositiveInteger = (value: unknown): value is number => {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0;
};

const normalizeOptionalId = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
};

const getMessageFromPayload = (payload: unknown, fallback: string): string => {
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

const resolveRequisitionId = (
  payload: unknown,
  fallbackId?: string
): number | null => {
  const candidateValues: unknown[] = [];
  const keysToInspect = new Set([
    "id",
    "requisition_id",
    "requisitionId",
    "request_id",
    "requestId",
  ]);

  const visited = new WeakSet<object>();

  const collectCandidates = (value: unknown, depth = 0) => {
    if (depth > 4 || value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => collectCandidates(entry, depth + 1));
      return;
    }

    if (typeof value !== "object") {
      return;
    }

    if (visited.has(value)) {
      return;
    }

    visited.add(value);

    const valueRecord = value as Record<string, unknown>;
    for (const [key, nestedValue] of Object.entries(valueRecord)) {
      if (keysToInspect.has(key)) {
        candidateValues.push(nestedValue);
      }
      collectCandidates(nestedValue, depth + 1);
    }
  };

  collectCandidates(payload);

  if (fallbackId) {
    candidateValues.push(fallbackId);
  }

  for (const candidate of candidateValues) {
    if (isPositiveInteger(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string" && candidate.trim()) {
      const normalized = Number(candidate);
      if (isPositiveInteger(normalized)) {
        return normalized;
      }
    }
  }

  return null;
};

export const useAddRequisition = () => {
  const { id: requestId } = useParams();

  const requisitionId = requestId ? window.atob(String(requestId)) : "";
  const {
    user: { id },
  } = useAuth();
  const { rows } = useStore();
  const [openSignature, setOpenSignature] = useState(false);
  const [images, setImages] = useState<image[]>([]);
  const [addingImage, setAddingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<RequisitionMutationResponse | null>(null);
  const [signature, setSignature] = useState<string>("");

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
      showNotification(
        message,
        type,
        requisitionId ? "Update requisition" : "Create requisition"
      );
    },
    [requisitionId]
  );

  const handleAddSignature = async (
    validateForm: () => Promise<FormikErrors<FormikValues>>,
    setTouched: (fields: FormikTouched<FormikValues>) => void
  ) => {
    const errors = await validateForm();

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

    setOpenSignature(true);
  };

  const closeModal = () => {
    setOpenSignature(false);
  };

  const imageChange = (images: image[]) => {
    setImages(images);
  };

  const handleUpload = useCallback(
    async (formData: FormData) => {
      const file = formData.get("file");
      if (file instanceof File) {
        const validation = validateUploadFile(file);
        if (!validation.valid) {
          handleOpenNotification(
            validation.message || "Invalid file selected.",
            "error"
          );
          return null;
        }
      }

      try {
        setAddingImage(true);
        const response = await axiosPic.post("/upload", formData);

        if (response.status === 200) {
          return { URL: response.data.result.link as string };
        }
      } catch (error) {
        handleOpenNotification(
          error instanceof Error ? error.message : "Unknown error",
          "error"
        );
      } finally {
        setAddingImage(false);
      }
    },
    [handleOpenNotification]
  );

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
          formData.append("file", image.file);
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

  const handleSignature = useCallback((value: string) => {
    setSignature(value);
  }, []);

  const handleSubmit = useCallback(
    async (val: IRequest, options?: SubmitOptions) => {
      const products = rows.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.amount,
        image_url: item.image_url || undefined,
        image: item.image_url || undefined,
        id: item?.id,
      }));

      const payload = {
        ...val,
        event_id: normalizeOptionalId(val.event_id),
        department_id: Number(val.department_id),
        products,
      };

      const dataToSend = requisitionId
        ? {
            ...payload,
            id: Number(requisitionId),
            updated_by: id,
          }
        : payload;

      setLoading(true);
      setError(null);

      try {
        const upsertResponse = requisitionId
          ? await api.put.updateRequisition<Record<string, unknown>>(dataToSend)
          : await api.post.createRequisition<Record<string, unknown>>(dataToSend);

        setData(upsertResponse as RequisitionMutationResponse);

        const shouldSubmitForApproval = Boolean(options?.submitForApproval);
        const shouldRedirectToDetails = Boolean(options?.redirectToDetails);
        const resolvedId = resolveRequisitionId(upsertResponse.data, requisitionId);
        const detailsPath = resolvedId
          ? `${REQUESTS_BASE_PATH}/${window.btoa(String(resolvedId))}`
          : REQUESTS_BASE_PATH;

        if (shouldSubmitForApproval) {
          if (!resolvedId) {
            throw new Error("Unable to resolve requisition ID for submission.");
          }

          try {
            const submitResponse = await api.post.submitRequisition({
              requisition_id: resolvedId,
            });

            handleOpenNotification(
              getMessageFromPayload(
                submitResponse.data,
                "Requisition submitted successfully."
              ),
              "success"
            );
          } catch (submitError) {
            if (!(submitError instanceof ApiError)) {
              const normalizedSubmitError =
                submitError instanceof Error
                  ? submitError
                  : new Error("Failed to submit requisition for approval.");
              handleOpenNotification(normalizedSubmitError.message, "error");
            }
          }
        } else {
          handleOpenNotification(
            getMessageFromPayload(
              upsertResponse.data,
              requisitionId
                ? "Requisition updated successfully."
                : "Requisition created successfully."
            ),
            "success"
          );
        }

        setOpenSignature(false);

        if (shouldRedirectToDetails) {
          navigate(detailsPath, { replace: true });
          return;
        }

        navigate(detailsPath, { replace: true });
      } catch (error) {
        const normalizedError =
          error instanceof Error ? error : new Error("Unknown error");
        setError(normalizedError);

        if (!(error instanceof ApiError)) {
          handleOpenNotification(normalizedError.message, "error");
        }
      } finally {
        setLoading(false);
      }
    },
    [rows, id, requisitionId, handleOpenNotification, navigate]
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
