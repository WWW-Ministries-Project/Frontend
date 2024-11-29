import { useNavigate, useParams } from "react-router-dom";
import { IRequisitionDetails } from "../types/requestInterface";
import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import { decodeToken } from "@/utils/helperFunctions";
import UsePost from "@/CustomHooks/usePost";
import { ApiResponse } from "@/utils/interfaces";
import api from "@/utils/apiCalls";
import { fetchCurrencies } from "@/pages/HomePage/utils/apiCalls";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

interface IRequest {
  requester_name: string;
  department_id: number;
  event_id: number;
  request_date: string;
  comment: string;
  currency: string;
  approval_status: string;
  attachmentLists:{URL:string}[]
}
export const useAddRequisition = () => {
  const { id: requestId } = useParams();
  const decodedId = () => {
    if (requestId) {
      return window.atob(String(requestId));
    }

    return "";
  };

  const requisitionId = decodedId()
  const { postData, loading, error, data } = UsePost<
    ApiResponse<{ data: IRequisitionDetails; message: string }>
  >(decodedId() ? api.put.updateRequisition : api.post.createRequisition);
  const { id } = decodeToken();
  const {rows} = useStore()

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
        title: decodedId() ? "Update requisition" : "Create requisition",
        onClose: () => {},
      });
    },
    [setNotification]
  );

  useEffect(() => {
    if (data) {
      handleOpenNotification(data.data.message, "success");
      navigate("/home/requests");
    }
    if (error) {
      handleOpenNotification(error.message, "error");
    }
  }, [data, error]);

  const handleSubmit = useCallback(
    async (val: IRequest) => {
      const products = rows.map((item) => {
        return {
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.amount,
          id:item?.id
        };
      });
      const dataToSend = decodedId()
        ? {
            ...val,
            event_id: Number(val.event_id),
            department_id: Number(val.department_id),
            products,
            user_id: id,
            currency:"GHS",
            id: Number(decodedId()),
          }
        : {
            ...val,
            event_id: Number(val.event_id),
            department_id: Number(val.department_id),
            products,
            user_id: id,
          };

      await postData(dataToSend);
    },
    [rows, id, postData]
  );

  return { currencies, handleSubmit, loading, error, data };
};
