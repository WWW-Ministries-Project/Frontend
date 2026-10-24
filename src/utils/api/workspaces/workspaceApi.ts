import type { ApiResponse, QueryType } from "@/utils/interfaces";

import { ApiExecution } from "../apiConstructor";
import { fetchData } from "../apiFunctions";
import type { WorkspaceResponse } from "./interfaces";

const execution = new ApiExecution({ fetchExecutor: fetchData });

/**
 * `GET workspaces/:ws?range=&branch_id=&department_id=&att_event=`.
 * `ws` travels in the query so the call fits `useFetch`; it becomes the path.
 */
export const fetchWorkspace = (query?: QueryType): Promise<ApiResponse<WorkspaceResponse>> => {
  const { ws, ...rest } = query ?? {};
  return execution.fetchData<WorkspaceResponse>(
    `workspaces/${encodeURIComponent(String(ws ?? "generic"))}`,
    rest
  );
};
