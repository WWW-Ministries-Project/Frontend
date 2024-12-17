import { ApiExecution } from "./apiConstructor";
import { updateData } from "./helperFunctions";
import { ApiResponse } from "./interfaces";

export class ApiUpdateCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      updateExecutor: updateData,
    });
  }
  updateEvent = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("event/update-event", payload);
  };
  updateAsset = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("assets/update-asset", payload);
  };
  updateRequisition = <T>(
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData<T>("requisitions/update-requisition", payload);
  };
  updatePosition = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("position/update-position", payload);
  };
  updateDepartment = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("department/update-department", payload);
  };
}
