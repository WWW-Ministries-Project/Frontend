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
}
