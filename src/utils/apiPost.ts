import { ApiExecution } from "./apiConstructor";
import { postData } from "./helperFunctions";
import type { ApiResponse } from "./interfaces";

export class ApiCreationCalls {
  private apiExecution: ApiExecution;
  constructor() {
    this.apiExecution = new ApiExecution({
      postExecutor: postData,
    });
  }
  private postToApi<T>(
    path: string,
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> {
    return this.apiExecution.postData(path, payload);
  }

  createMember = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("user/register", payload);
  };
  createEvent = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("event/create-event", payload);
  };
  createAsset = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("assets/create-asset", payload);
  };
  createRequisition = <T>(
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("requisitions/create-requisition", payload);
  };

  //todo :speak to BE TO UPDATE THIS TO PUT
  updateMember = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("user/update-user", payload);
  };
}
