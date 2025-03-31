import { ApiExecution } from "./apiConstructor";
import { deleteData } from "./helperFunctions";
import type { ApiResponse } from "./interfaces";

export class ApiDeletionCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      deleteExecutor: deleteData,
    });
  }

  private deleteFromApi<T>(path: string, query: {}): Promise<ApiResponse<T>> {
    return this.apiExecution.deleteData(path, query);
  }

  deleteMember = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("user/delete-user", { id });
  };

  deleteEvent = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("event/delete-event", { id });
  };

  deleteAsset = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("assets/delete-asset", { id });
  };

  deleteRequest = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("requisitions/delete-requisition", { id });
  };

  deletePosition = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("position/delete-position", { id });
  };

  deleteDepartment = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("department/delete-department", { id });
  };

  // New Delete Methods

  deleteProgram = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`program/programs/${ id }`, { id });
  };

  deleteCohort = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`program/cohorts/${id}`, { id });
  };

  deleteCourse = (id: string | number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`program/courses/${id}`, { id });
  };
}
