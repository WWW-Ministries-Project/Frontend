import { ApiDeletionCalls } from "./apiDelete";
import { ApiCalls } from "./apiFetch";
import { ApiCreationCalls } from "./apiPost";
import { ApiUpdateCalls } from "./apiPut";

class UnifiedApi {
  fetch: ApiCalls;
  delete: ApiDeletionCalls;
  post: ApiCreationCalls;
  put: ApiUpdateCalls;

  constructor() {
    this.fetch = new ApiCalls();
    this.delete = new ApiDeletionCalls();
    this.post = new ApiCreationCalls();
    this.put = new ApiUpdateCalls();
  }
}

// Create an instance of the unified API class and export it
// export default new UnifiedApi();
export const api = new UnifiedApi();
