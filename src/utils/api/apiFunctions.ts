import { AxiosError, AxiosResponse } from "axios";
import axios from "../../axiosInstance";
import type { ApiResponse, IPaginationMeta, QueryType } from "../interfaces";
import { ApiErrorHandler } from "./errors/ApiError";
import { extractFileNameFromDisposition } from "../helperFunctions";
import type { DownloadedFile } from "./eventReports/interfaces";

const serializeQuery = (query?: QueryType): string => {
  if (!query) return "";

  const normalizedQuery = Object.entries(query).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    },
    {}
  );

  return `?${new URLSearchParams(normalizedQuery).toString()}`;
};

// Define the fetchData function
export const fetchData = async <T>(
  baseUrl: string,
  path: string,
  query?: QueryType
): Promise<ApiResponse<T>> => {
  try {
    const queryString = serializeQuery(query);
    const url = `${baseUrl}${path}${queryString}`;
    const response: AxiosResponse<
      {
        data: T;
      } & IPaginationMeta
    > = await axios.get(url);
    return {
      data: response.data.data,
      meta: {
        current_page: response.data.current_page,
        take: response.data.take,
        total: response.data.total,
        page_size: response.data.page_size,
        totalPages: response.data.totalPages,
      },
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
    const queryString = serializeQuery(query);
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

export const postData = async <T, K>(
  baseUrl: string,
  path: string,
  payload: K
): Promise<ApiResponse<T>> => {
  try {
    const url = `${baseUrl}${path}`;
    const response: AxiosResponse<{ data: T }> = await axios.post(url, payload);
    return {
      data: response.data.data,
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
    const queryString = serializeQuery(query);
    const url = `${baseUrl}${path}${queryString}`;
    const response: AxiosResponse<{ data: T }> = await axios.put(url, payload);
    return {
      data: response.data.data,
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
    const queryString = serializeQuery(query);
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

/**
 * With `responseType: "blob"` axios hands back a JSON error body as a Blob, so
 * ApiErrorHandler's message extraction — and with it session-expiry and
 * permission handling — would see nothing usable. Re-parse it into the response
 * so the shared handler behaves exactly as it does for JSON requests.
 */
const withParsedBlobError = async (error: unknown): Promise<unknown> => {
  if (!(error instanceof AxiosError)) return error;

  const payload = error.response?.data;
  if (!(payload instanceof Blob)) return error;

  try {
    error.response!.data = JSON.parse(await payload.text());
  } catch {
    // Not JSON (or unreadable) — leave the blob in place and let the handler
    // fall back to the axios message.
  }
  return error;
};

/**
 * GETs a binary document and hands back the blob plus the filename the server
 * chose. Unlike the JSON helpers above this deliberately does not unwrap a
 * `data` envelope — the response body is the file itself.
 *
 * The server must send `Access-Control-Expose-Headers: Content-Disposition`,
 * otherwise the browser hides that header and `fallbackFileName` is used.
 */
export const downloadFile = async (
  baseUrl: string,
  path: string,
  query: QueryType | undefined,
  fallbackFileName: string
): Promise<DownloadedFile> => {
  try {
    const queryString = serializeQuery(query);
    const url = `${baseUrl}${path}${queryString}`;
    const response = await axios.get<Blob>(url, { responseType: "blob" });

    const contentDisposition =
      response.headers["content-disposition"] ??
      response.headers["Content-Disposition"];

    return {
      blob: response.data,
      fileName:
        extractFileNameFromDisposition(contentDisposition) || fallbackFileName,
      contentType: (response.headers["content-type"] ??
        response.headers["Content-Type"]) as string | null | undefined,
    };
  } catch (error) {
    throw ApiErrorHandler.handleError(await withParsedBlobError(error));
  }
};
