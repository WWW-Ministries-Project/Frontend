import { AxiosResponse } from "axios";
import axios from "../../axiosInstance";
import type { ApiResponse, QueryType } from "../interfaces";
import { ApiErrorHandler } from "./errors/ApiError";

// Define the fetchData function
export const fetchData = async <T>(
  baseUrl: string,
  path: string,
  query?: QueryType
): Promise<ApiResponse<T>> => {
  try {
    const queryString = query
      ? `?${new URLSearchParams(query).toString()}`
      : "";
    const url = `${baseUrl}${path}${queryString}`;
    const response: AxiosResponse<{ data: T }> = await axios.get(url);
    return {
      data: response.data.data,
      status: response.status,
      error: "",
      success: true,
    };
  } catch (error) {
    throw ApiErrorHandler.handleError(error);
    // throw Error
  }
};

export const deleteData = async <T>(
  baseUrl: string,
  path: string,
  query?: QueryType
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
    throw ApiErrorHandler.handleError(error);
    // throw error;
  }
};

export const postData = async <T,K>(
  baseUrl: string,
  path: string,
  payload: K
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
    // console.error(`Error posting data to ${baseUrl}${path}:`, error);
    throw ApiErrorHandler.handleError(error);
  }
};

export const updateData = async <T, K>(
  baseUrl: string,
  path: string,
  payload: K,
  query?: QueryType
): Promise<ApiResponse<T>> => {
  try {
    const queryString = query
      ? `?${new URLSearchParams(query).toString()}`
      : "";
    const url = `${baseUrl}${path}${queryString}`;
    const response: AxiosResponse<T> = await axios.put(url, payload);
    return {
      data: response.data,
      status: response.status,
      error: "",
      success: true,
    };
  } catch (error) {
    // console.error(`Error posting data to ${baseUrl}${path}:`, error);
    throw ApiErrorHandler.handleError(error);
  }
};

export const patchData = async <T, K>(
  baseUrl: string,
  path: string,
  payload: K,
  query?: QueryType
): Promise<ApiResponse<T>> => {
  try {
    const queryString = query
      ? `?${new URLSearchParams(query).toString()}`
      : "";
    const url = `${baseUrl}${path}${queryString}`;
    const response: AxiosResponse<T> = await axios.patch(url, payload);
    return {
      data: response.data,
      status: response.status,
      error: "",
      success: true,
    };
  } catch (error) {
    throw ApiErrorHandler.handleError(error);
  }
};
