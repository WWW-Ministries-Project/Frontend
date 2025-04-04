import { AxiosResponse } from "axios";
import axios from "../../axiosInstance";
import { ApiResponse } from "../interfaces";
import { ApiErrorHandler } from "./errors/ApiError";

// Define the fetchData function
export const fetchData = async <T>(
  baseUrl: string,
  path: string,
  query?: Record<string, any>
): Promise<ApiResponse<any> | undefined> => {
  try {
    const queryString = query
      ? `?${new URLSearchParams(query).toString()}`
      : "";
    const url = `${baseUrl}${path}${queryString}`;
    const response: AxiosResponse<T> = await axios.get(url);
    return {
      data: response.data,
      status: response.status,
      error: "",
      success: true,
    };
  } catch (error) {
    ApiErrorHandler.handleError(error);
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
    return {
      data: response.data,
      status: response.status,
      error: "",
      success: true,
    };
  } catch (error) {
    // console.error(`Error deleting data from ${baseUrl}${path}:`, error);
    ApiErrorHandler.handleError(error);    
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
    return {
      data: response.data,
      status: response.status,
      error: "",
      success: true,
    };
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
    return {
      data: response.data,
      status: response.status,
      error: "",
      success: true,
    };
  } catch (error) {
    // console.error(`Error posting data to ${baseUrl}${path}:`, error);
    ApiErrorHandler.handleError(error);
    throw error;
  }
};
