import axios from "axios";
import { baseUrl } from "./pages/Authentication/utils/helpers";
import { getToken } from "./utils/helperFunctions";

const SESSION_EXPIRY_MARKERS = [
  "session expired",
  "token not found",
  "not authorized. token not found",
  "jwt expired",
  "token expired",
];

const PUBLIC_AUTH_PATHS = [
  "/user/login",
  "/user/register",
  "/user/forgot-password",
  "/user/reset-password",
];

const instance = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export const pictureInstance = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

const asNonEmptyString = (value) => {
  if (typeof value !== "string") return null;
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
};

const extractErrorMessage = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  const payloadRecord = payload;
  const nestedData =
    payloadRecord.data && typeof payloadRecord.data === "object"
      ? payloadRecord.data
      : undefined;

  const candidates = [
    nestedData?.error,
    nestedData?.message,
    payloadRecord.error,
    payloadRecord.message,
    payloadRecord.detail,
  ];

  for (const candidate of candidates) {
    const message = asNonEmptyString(candidate);
    if (message) return message;
  }

  return null;
};

const isSessionExpiredMessage = (message) => {
  if (!message) return false;
  const normalizedMessage = message.trim().toLowerCase();
  return SESSION_EXPIRY_MARKERS.some((marker) =>
    normalizedMessage.includes(marker)
  );
};

const resolvePathName = (requestUrl = "") => {
  try {
    const resolvedUrl = new URL(requestUrl, baseUrl || window.location.origin);
    return resolvedUrl.pathname.toLowerCase();
  } catch {
    return String(requestUrl || "").toLowerCase();
  }
};

const isPublicAuthRequest = (requestUrl = "") => {
  const pathname = resolvePathName(requestUrl);
  return PUBLIC_AUTH_PATHS.some((path) => pathname.includes(path));
};

const parseRetryAfterSeconds = (retryAfterValue) => {
  if (retryAfterValue === undefined || retryAfterValue === null) return null;

  const rawValue = String(retryAfterValue).trim();
  if (!rawValue) return null;

  const numericSeconds = Number(rawValue);
  if (Number.isFinite(numericSeconds) && numericSeconds >= 0) {
    return Math.ceil(numericSeconds);
  }

  const retryAfterDate = new Date(rawValue);
  const timestamp = retryAfterDate.getTime();
  if (Number.isNaN(timestamp)) return null;

  const diffInSeconds = Math.ceil((timestamp - Date.now()) / 1000);
  return diffInSeconds > 0 ? diffInSeconds : null;
};

const getRetryAfterSeconds = (headers) => {
  if (!headers || typeof headers !== "object") return null;
  const retryAfterHeader =
    headers["retry-after"] ??
    headers["Retry-After"] ??
    headers["retry_after"] ??
    headers["retryAfter"];
  return parseRetryAfterSeconds(retryAfterHeader);
};

const dispatchAppEvent = (name, detail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

const applyRequestInterceptor = (client) => {
  client.interceptors.request.use(
    (config) => {
      config.headers = config.headers || {};
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

const applyResponseInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const statusCode = error?.response?.status;
      const message =
        extractErrorMessage(error?.response?.data) ||
        asNonEmptyString(error?.message) ||
        "";
      const requestUrl = error?.config?.url;
      const isPublicAuth = isPublicAuthRequest(requestUrl);
      const hasActiveSession = Boolean(getToken());

      if (statusCode === 401) {
        if (isSessionExpiredMessage(message)) {
          dispatchAppEvent("app:session-expired", {
            statusCode,
            message,
          });
        } else if (!isPublicAuth && hasActiveSession) {
          dispatchAppEvent("app:access-denied", {
            statusCode,
            message,
          });
        }
      } else if (statusCode === 403) {
        if (!isPublicAuth && hasActiveSession) {
          dispatchAppEvent("app:access-denied", {
            statusCode,
            message,
          });
        }
      } else if (statusCode === 429) {
        dispatchAppEvent("app:rate-limited", {
          statusCode,
          message,
          retryAfterSeconds: getRetryAfterSeconds(error?.response?.headers),
        });
      } else if (typeof statusCode === "number" && statusCode >= 500) {
        dispatchAppEvent("app:server-error", {
          statusCode,
          message,
        });
      }

      return Promise.reject(error);
    }
  );
};

applyRequestInterceptor(instance);
applyRequestInterceptor(pictureInstance);
applyResponseInterceptor(instance);
applyResponseInterceptor(pictureInstance);

export const changeAuth = (token) => {
  const authorizationHeader = token ? `Bearer ${token}` : "";

  if (authorizationHeader) {
    instance.defaults.headers.common.Authorization = authorizationHeader;
    pictureInstance.defaults.headers.common.Authorization = authorizationHeader;
    return;
  }

  delete instance.defaults.headers.common.Authorization;
  delete pictureInstance.defaults.headers.common.Authorization;
};

export default instance;
