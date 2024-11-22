import { AxiosResponse } from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { DateTime } from "luxon";
import axios from "../axiosInstance";
import type { ApiResponse } from "./interfaces";

export const getToken = () => {
  return Cookies.get("token");
};
export const setToken = (token: string) => {
  return Cookies.set("token", token, {
    expires: new Date(decodeToken(token)?.exp * 1000),
  });
};
export const removeToken = () => {
  return Cookies.remove("token");
};

export const decodeToken = (value?: string): any => {
  const token = value ? value : getToken();
  return token && jwtDecode(token);
};
export const firstLetters = (string = "No Name") => {
  string = string.length > 0 ? string : "No Name";
  const arr = string.trim().split(" ");
  let initials = "";
  if (arr[0][0]) initials += arr[0][0].toUpperCase();
  if (arr[arr.length - 1][0]) initials += arr[arr.length - 1][0].toUpperCase();

  return initials;
};

export const formatTime = (value: string) => {
  return DateTime.fromISO(value).toLocaleString(DateTime.DATE_MED);
};
export const formatInputDate = (value: string | undefined) => {
  return value && DateTime.fromISO(value).toFormat("yyyy-MM-dd");
};

export const compareDates = (date1: string, date2 = "") => {
  const dt1 = DateTime.fromISO(date1);
  const dt2 = date2 ? DateTime.fromISO(date2) : DateTime.now();
  // console.log(dt1,"1", dt2,"2");

  if (dt1 < dt2) {
    return true;
  } else if (dt1 >= dt2) {
    return false;
  }
  // else {
  //     return 0;
  // }
};
export const genderOptions = [
  { name: "Male", value: "male" },
  { name: "Female", value: "female" },
];
export const memberValues = {
  password: "123456",
  department_id: "",
  first_name: "",
  other_name: "",
  last_name: "",
  email: "",
  primary_number: "",
  date_of_birth: "",
  gender: "",
  is_active: true,
  address: "",
  work_name: "",
  work_industry: "",
  work_position: "",
  emergency_contact_name: "",
  emergency_contact_relation: "",
  emergency_contact_phone_number: "",
  department_head: "",
  country: "",
};

export const getChangedValues = (initialValues: any, currentValues: any) => {
  const changedValues: any = {};
  for (const key in currentValues) {
    if (typeof currentValues[key] == "object") continue;
    if (currentValues[key] !== initialValues[key]) {
      changedValues[key] = currentValues[key];
    }
  }
  return changedValues;
};

// Define the fetchData function
export const fetchData = async <T>(
  baseUrl: string,
  path: string,
  query?: Record<string, any>
): Promise<ApiResponse<any>> => {
  try {
    const queryString = query
    ? `?${new URLSearchParams(query).toString()}`
    : "";
  const url = `${baseUrl}${path}${queryString}`;
    const response: AxiosResponse<T> = await axios.get(url);
    return { data: response.data, status: response.status };
  } catch (error) {
    console.error(`Error fetching data from ${baseUrl}${path}:`, error);
    throw error;
  }
};

export const deleteData = async <T>(
  baseUrl: string,
  path: string,
  query?: Record<string, any>
): Promise<ApiResponse<T>> => {
  try {
    // Construct query string if query parameters are provided
    const queryString = query
      ? `?${new URLSearchParams(query).toString()}`
      : "";
    const url = `${baseUrl}${path}${queryString}`;

    const response: AxiosResponse<T> = await axios.delete(url);
    return { data: response.data, status: response.status };
  } catch (error) {
    console.error(`Error deleting data from ${baseUrl}${path}:`, error);
    throw error; 
  }
};

export const postData = async <T>(
  baseUrl: string,
  path: string,
  payload: Record<string, any>
): Promise<ApiResponse<T>> => {
  try {
    const url = `${baseUrl}${path}`;
    const response: AxiosResponse<T> = await axios.post(url, payload);
    return { data: response.data, status: response.status };
  } catch (error) {
    console.error(`Error posting data to ${baseUrl}${path}:`, error);
    throw error;
  }
};

export const updateData = async <T>(
  baseUrl: string,
  path: string,
  payload: Record<string, any>
): Promise<ApiResponse<T>> => {
  try {
    const url = `${baseUrl}${path}`;
    const response: AxiosResponse<T> = await axios.put(url, payload);
    return { data: response.data, status: response.status };
  } catch (error) {
    console.error(`Error posting data to ${baseUrl}${path}:`, error);
    throw error;
  }
};
