import { showNotification } from "@/pages/HomePage/utils";
import { AxiosError } from "axios";

class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

class ApiErrorHandler {
  private static readonly SESSION_EXPIRY_MARKERS = [
    "session expired",
    "token not found",
    "not authorized. token not found",
    "jwt expired",
    "token expired",
  ];

  private static asNonEmptyString(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private static extractErrorMessage(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") return null;

    const payloadRecord = payload as Record<string, unknown>;
    const nestedData =
      payloadRecord.data && typeof payloadRecord.data === "object"
        ? (payloadRecord.data as Record<string, unknown>)
        : undefined;

    const prioritizedCandidates: unknown[] = [
      nestedData?.error,
      nestedData?.message,
      payloadRecord.error,
      payloadRecord.message,
    ];

    for (const candidate of prioritizedCandidates) {
      const normalizedMessage = this.asNonEmptyString(candidate);
      if (normalizedMessage) return normalizedMessage;
    }

    const errors = payloadRecord.errors;

    if (Array.isArray(errors)) {
      for (const entry of errors) {
        const normalizedMessage = this.asNonEmptyString(entry);
        if (normalizedMessage) return normalizedMessage;
      }
    }

    if (errors && typeof errors === "object") {
      for (const entry of Object.values(errors)) {
        if (Array.isArray(entry)) {
          for (const nestedEntry of entry) {
            const normalizedMessage = this.asNonEmptyString(nestedEntry);
            if (normalizedMessage) return normalizedMessage;
          }
        } else {
          const normalizedMessage = this.asNonEmptyString(entry);
          if (normalizedMessage) return normalizedMessage;
        }
      }
    }

    return null;
  }

  private static isSessionExpiredMessage(message: string): boolean {
    const normalizedMessage = message.trim().toLowerCase();
    if (!normalizedMessage) return false;

    return this.SESSION_EXPIRY_MARKERS.some((marker) =>
      normalizedMessage.includes(marker)
    );
  }

  private static parseRetryAfterSeconds(value: unknown): number | null {
    const normalizedValue = this.asNonEmptyString(value);
    if (!normalizedValue) return null;

    const numericSeconds = Number(normalizedValue);
    if (Number.isFinite(numericSeconds) && numericSeconds >= 0) {
      return Math.ceil(numericSeconds);
    }

    const retryAt = Date.parse(normalizedValue);
    if (Number.isNaN(retryAt)) return null;

    const diffSeconds = Math.ceil((retryAt - Date.now()) / 1000);
    return diffSeconds > 0 ? diffSeconds : null;
  }

  private static resolveRetryAfterSeconds(headers: unknown): number | null {
    if (!headers || typeof headers !== "object") return null;

    const headerRecord = headers as Record<string, unknown>;
    const retryAfterRaw =
      headerRecord["retry-after"] ??
      headerRecord["Retry-After"] ??
      headerRecord.retryAfter;

    return this.parseRetryAfterSeconds(retryAfterRaw);
  }

  static handleResponse(response: Response): Promise<unknown> {
    if (!response.ok) {
      return response
        .json()
        .then((errorData: { message?: string; [key: string]: unknown }) => {
        throw new ApiError(
          errorData.message || "An error occurred",
          response.status,
          errorData
        );
      });
    }
    return response.json();
  }

  static handleError(error: unknown): Error {
    if (error instanceof ApiError) {
      showNotification(error.message, "error", "Error");
      throw error;
    }

    if (error instanceof AxiosError) {
      const payload = error.response?.data;
      const extractedMessage = this.extractErrorMessage(payload);
      const fallbackMessage =
        this.asNonEmptyString(error.message) || "An unexpected error occurred";
      const statusCode = error.response?.status ?? 500;
      const normalizedError = new ApiError(
        extractedMessage || fallbackMessage,
        statusCode,
        payload
      );

      if (statusCode === 401) {
        if (this.isSessionExpiredMessage(normalizedError.message)) {
          showNotification(
            "Your session has expired. Please login again.",
            "error",
            "Authentication"
          );
        } else {
          showNotification(
            normalizedError.message ||
              "You do not have permission to perform this action.",
            "error",
            "Access denied"
          );
        }
      } else if (statusCode === 403) {
        showNotification(
          "You do not have permission to perform this action.",
          "error",
          "Access denied"
        );
      } else if (statusCode === 429) {
        const retryAfterSeconds = this.resolveRetryAfterSeconds(
          error.response?.headers
        );
        const cooldownMessage = retryAfterSeconds
          ? `Too many requests. Please try again in ${retryAfterSeconds} seconds.`
          : "Too many requests. Please try again later.";

        showNotification(cooldownMessage, "error", "Rate limited");
      } else if (statusCode >= 500) {
        showNotification(
          "Something went wrong on the server. Please try again.",
          "error",
          "Server error"
        );
      } else {
        showNotification(normalizedError.message, "error", "Error");
      }

      throw normalizedError;
    }

    const genericMessage =
      (error instanceof Error && this.asNonEmptyString(error.message)) ||
      "An unexpected error occurred";
    const normalizedError = new ApiError(genericMessage, 500, error);

    showNotification(normalizedError.message, "error", "Error");
    throw normalizedError;
  }
}

export { ApiError, ApiErrorHandler };
// export const apiErrorHandler = new ApiErrorHandler();
