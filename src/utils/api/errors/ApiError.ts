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
    if (error instanceof ApiError || error instanceof AxiosError) {
      showNotification(error.message, "error", "Error");
      throw error;
    } else {
      showNotification("An unexpected error occurred", "error", "Error");
      throw error;
    }
  }
}

export { ApiError, ApiErrorHandler };
// export const apiErrorHandler = new ApiErrorHandler();
