import { DateTime } from "luxon";
import type { image } from "@/pages/HomePage/Components/MultiImageComponent";
import type {
  IRequisitionDetails,
  RequisitionStatusType,
  TableRow,
} from "./requestInterface";

export type RequisitionFormValues = {
  requester_name: string;
  department_id: number | string;
  event_id: number | string | "";
  request_date: string;
  comment: string;
  currency: string;
  approval_status: RequisitionStatusType;
  attachmentLists: { URL: string }[];
  user_sign: string | null;
  edit_justification_comment?: string;
};

export type DropdownOption = {
  label: string;
  value: string | number;
};

export const mapRequisitionProductsToTableRows = (
  requestData?: IRequisitionDetails | null,
): TableRow[] =>
  requestData?.products?.map((product) => ({
    name: product?.name,
    amount: product?.unitPrice,
    quantity: product?.quantity,
    total: product?.quantity * product?.unitPrice,
    image_url: product?.image_url ?? product?.image ?? "",
    id: product?.id,
  })) ?? [];

export const mapRequisitionAttachmentsToImages = (
  requestData?: IRequisitionDetails | null,
): image[] =>
  requestData?.attachmentLists?.map((attachment) => ({
    id: attachment.id,
    image: attachment.URL,
  })) ?? [];

export const buildRequisitionInitialValues = (args: {
  requestData?: IRequisitionDetails | null;
  requesterName?: string;
}): RequisitionFormValues => {
  const { requestData, requesterName } = args;

  return {
    requester_name: requestData?.requester?.name ?? requesterName ?? "",
    department_id: requestData?.summary?.department_id ?? "",
    event_id: requestData?.summary?.program_id ?? "",
    request_date: requestData?.summary?.request_date
      ? DateTime.fromISO(requestData.summary.request_date).toFormat("yyyy-MM-dd")
      : DateTime.now().toFormat("yyyy-MM-dd"),
    comment: requestData?.comment ?? "",
    currency: requestData?.currency || "GHS",
    approval_status: requestData?.summary?.status ?? "Draft",
    user_sign: requestData?.requester?.user_sign ?? "",
    attachmentLists: requestData?.attachmentLists ?? [],
    edit_justification_comment: "",
  };
};
