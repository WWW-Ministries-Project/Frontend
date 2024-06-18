import { baseUrl } from "../../../../Authentication/utils/helpers";
import { UserType } from "./membersInterfaces";
import axios from "../../../../../axiosInstance";
import { AxiosResponse } from "axios";

export const addNewMember = (obj:UserType) => {
    // const addNewMember = (value) => {// moving user to parent component 
    return axios
      .post(`${baseUrl}/user/register`, obj)
      .then((response: AxiosResponse<UserType>) => {
        return {data:response.data,status:response.status};
      })
      .catch((error: any) => {
        console.log(error);
      });
  }