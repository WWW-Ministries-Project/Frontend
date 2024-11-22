import { ApiDeletionCalls } from "./apiDelete";
import { ApiCalls } from "./apiFetch";
import { ApiCreationCalls } from "./apiPost";

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
