import { notify } from "@/components/feedback/notify";
import { AxiosError } from "axios";

class ApiError extends Error {
  statusCode: number;
  details?: unknown;
  requestPath?: string;

  constructor(
    message: string,
    statusCode: number,
    details?: unknown,
    requestPath?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.requestPath = requestPath;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

class ApiErrorHandler {
  private static readonly PUSH_PUBLIC_KEY_PATH = "/notifications/push/public-key";

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

  private static resolveRequestPath(error: AxiosError): string {
    const requestUrl = error.config?.url;
    if (!requestUrl) return "";

    try {
      const resolvedUrl = new URL(requestUrl, window.location.origin);
      return resolvedUrl.pathname.toLowerCase();
    } catch {
      return String(requestUrl).toLowerCase();
    }
  }

  private static isPushPublicKeyRequest(path: string): boolean {
    if (!path) return false;
    return path.includes(this.PUSH_PUBLIC_KEY_PATH);
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
      notify.fromError(error, { preferServerMessage: true, source: "api" });
      throw error;
    }

    if (error instanceof AxiosError) {
      const payload = error.response?.data;
      const extractedMessage = this.extractErrorMessage(payload);
      const fallbackMessage =
        this.asNonEmptyString(error.message) || "An unexpected error occurred";
      const statusCode = error.response?.status ?? 500;
      const requestPath = this.resolveRequestPath(error);
      const normalizedError = new ApiError(
        extractedMessage || fallbackMessage,
        statusCode,
        payload,
        requestPath
      );

      if (
        statusCode === 503 &&
        this.isPushPublicKeyRequest(requestPath)
      ) {
        throw normalizedError;
      }

      // Pass the raw axios error so offline/timeout codes and Retry-After
      // headers reach the copy mapping.
      notify.fromError(error, { preferServerMessage: true, source: "api" });
      throw normalizedError;
    }

    const genericMessage =
      (error instanceof Error && this.asNonEmptyString(error.message)) ||
      "An unexpected error occurred";
    const normalizedError = new ApiError(genericMessage, 500, error);

    notify.fromError(error, { source: "api" });
    throw normalizedError;
  }
}

export { ApiError, ApiErrorHandler };
// export const apiErrorHandler = new ApiErrorHandler();
