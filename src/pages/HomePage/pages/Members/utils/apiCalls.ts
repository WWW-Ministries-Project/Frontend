import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import api from "@/utils/apiCalls";
import { AxiosResponse } from "axios";
import axios from "../../../../../axiosInstance";
import { baseUrl } from "../../../../Authentication/utils/helpers";
import { UserType } from "./membersInterfaces";
import { useStore } from "@/store/useStore";

export const addNewMember = (obj: UserType) => {
  // const addNewMember = (value) => {// moving user to parent component
  return axios
    .post(`${baseUrl}/user/register`, obj)
    .then((response: AxiosResponse<UserType>) => {
      return { data: response.data, status: response.status };
    })
    .catch((error: any) => {
      console.log(error);
    });
};

export const fetchAMember = (id: string | number) => {
  return axios
    .get(`${baseUrl}/user/get-user?user_id=${id}`)
    .then((response: AxiosResponse<{ data: UserType }>) => {
      return { data: response.data, status: response.status };
    })
    .catch((error: any) => {
      console.log(error);
    });
};

export const updateAMember = (obj: UserType) => {
  return axios
    .post(`${baseUrl}/user/update-user`, obj)
    .then((response: AxiosResponse<{ data: UserType }>) => {
      return { data: response.data, status: response.status };
    })
    .catch((error: any) => {
      console.log(error);
    });
};

export const deleteMember = (id: string | number) => {
  api.delete
    .deleteMember(id)
    .then(() => {
      useNotificationStore.getState().setNotification({
        title: "Success",
        message: "Member deleted successfully",
        type: "success",
        onClose: () => {},
        show: true,
      });
      useStore.getState().removeMember(id);
    })
    .catch((error) => {
      useNotificationStore.getState().setNotification({
        title: "Error",
        message: error.message,
        type: "error",
        onClose: () => {},
        show: true,
      });
    });
};
