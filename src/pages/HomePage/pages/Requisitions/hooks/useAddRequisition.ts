import { useNavigate } from "react-router-dom";
import { IRequisitionDetails } from "../types/requestInterface";

import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import useEditableTableStore from "../requisitionStore/EditableTableStore";
import { decodeToken } from "@/utils/helperFunctions";
import UsePost from "@/CustomHooks/usePost";
import { ApiResponse } from "@/utils/interfaces";
import api from "@/utils/apiCalls";
import { fetchCurrencies } from "@/pages/HomePage/utils/apiCalls";
import { useCallback, useEffect, useState } from "react";

interface IRequest {
  requester_name: string;
  department_id: string;
  event_id: string;
  request_date: string;
  comment: string;
  currency: string;
  approval_status: string;
}
export const useAddRequisition = () => {
  const { postData, loading, error, data } = UsePost<
    ApiResponse<{ data: IRequisitionDetails; message: string }>
  >(api.post.createRequisition);
  const { id } = decodeToken();
  const { rows } = useEditableTableStore();
  const navigate = useNavigate();
  const { setNotification } = useNotificationStore();
  const [currencies, setCurrencies] = useState<{ name: string; value: string }[]>(
    []
  );
  
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
        title: "Create requisition",
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
        };
      });
      const dataToSend = {
        ...val,
        event_id: Number(val.event_id),
        department_id: Number(val.department_id),
        products,
        user_id: id,
        attachmentLists: [],
      };

      await postData(dataToSend);
    },
    [rows, id, postData]
  );
  
  return {currencies, handleSubmit, loading, error, data}
};
