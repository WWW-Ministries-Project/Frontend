import { showNotification } from "@/pages/HomePage/utils";
import { AxiosError } from "axios";

class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

class ApiErrorHandler {
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

  static handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      return response.json().then((errorData) => {
        throw new ApiError(
          errorData.message || "An error occurred",
          response.status,
          errorData
        );
      });
    }
    return response.json();
  }

  static handleError(error: any): Error {
    if (error instanceof ApiError) {
      showNotification(error.message, "error", "Error");
      throw error;
    }

    if (error instanceof AxiosError) {
      const payload = error.response?.data;
      const extractedMessage = this.extractErrorMessage(payload);
      const fallbackMessage =
        this.asNonEmptyString(error.message) || "An unexpected error occurred";
      const normalizedError = new ApiError(
        extractedMessage || fallbackMessage,
        error.response?.status ?? 500,
        payload
      );

      showNotification(normalizedError.message, "error", "Error");
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
