/** Home workspace keys, in display order. */
export type AccessLevelWorkspaceKey = "prelate" | "admin" | "finance" | "hod" | "generic";

export interface AccessLevelWorkspacesPayload {
  id: number;
  workspaces: AccessLevelWorkspaceKey[];
}

export interface AccessLevelWorkspacesResult {
  id: number;
  workspaces: AccessLevelWorkspaceKey[];
  workspaces_default: false;
}
