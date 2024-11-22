
import { ApiCalls } from "./apiFetch";
import { ApiCreationCalls } from "./apiPost";
import { ApiDeletionCalls } from "./apiDelete";
import { deleteData, fetchData, postData, updateData } from "./helperFunctions";
import type { ApiCallOptions, ApiResponse } from "./interfaces";

// Define the ApiExecution class








// class ApiUpdateCalls {
//   private apiExecution: ApiExecution;

//   constructor() {
//     this.apiExecution = new ApiExecution({
//       postExecutor: updateData,
//     });
//   }
//   updateEvent = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
//     return this.apiExecution.updateData("event/update-event", payload);
//   }
// }

class UnifiedApi {
  fetch: ApiCalls;
  delete: ApiDeletionCalls;
  post: ApiCreationCalls;

  constructor() {
    this.fetch = new ApiCalls();
    this.delete = new ApiDeletionCalls();
    this.post = new ApiCreationCalls();
  }
}

// Create an instance of the unified API class and export it
export default new UnifiedApi();
