import { baseUrl } from "../../../../Authentication/utils/helpers";
import { UserType } from "./membersInterfaces";
import axios from "../../../../../axiosInstance";

export const addNewMember = (obj:UserType) => {
    // const addNewMember = (value) => {// moving user to parent component 
    axios
      .post(`${baseUrl}/user/register`, obj)
      .then((response: { data: { data: UserType }; }) => {
        return response.data.data;
      })
      .catch((error: any) => {
        console.log(error);
      });
  }