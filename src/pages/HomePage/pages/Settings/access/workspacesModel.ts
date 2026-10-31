import { isDepartmentScope, normalizePermissionPayload, resolvePermission, type PermissionMap, type ScopesMap } from "@/utils/accessControl";
import type { AccessLevelWorkspaceKey } from "@/utils/api/settings/accessLevelWorkspaceInterfaces";

import type { AccessRight } from "../utils/settingsInterfaces";
import type { StartKey } from "../utils/settingsModel";

export type WorkspaceKey = AccessLevelWorkspaceKey;

export interface WorkspaceInfo {
  key: WorkspaceKey;
  /** Tab label next to Home. */
  label: string;
  /** Longer name for the role's workspace cards. */
  title: string;
  question: string;
  description: string;
}

/** Home workspaces, in display order. */
export const WORKSPACES: WorkspaceInfo[] = [
  {
    key: "prelate",
    label: "Prelate",
    title: "Prelate",
    question: "Is the church healthy and growing?",
    description: "Narrative summary, growth, pastoral care, sign-offs",
  },
  {
    key: "admin",
    label: "Administration",
    title: "Administrative head",
    question: "Is everything running?",
    description: "Approval queues, compliance, events readiness, pipeline",
  },
  {
    key: "finance",
    label: "Finance",
    title: "Head of Finance",
    question: "Where is the money, and what’s waiting on me?",
    description: "Giving, pledges, approvals, reconciliation, exports",
  },
  {
    key: "hod",
    label: "My department",
    title: "Head of department",
    question: "How is my team, and what do I need to do?",
    description: "Scoped to the departments each person leads, plus a pack for their department type",
  },
  {
    key: "generic",
    label: "Personal",
    title: "Personal",
    question: "What’s happening for me?",
    description: "Events, giving, appointments, rides, notifications",
  },
];

const ORDER = WORKSPACES.map((w) => w.key);

/** Keeps known keys only, without duplicates, in display order. */
export const sortWorkspaces = (keys: readonly string[]): WorkspaceKey[] =>
  ORDER.filter((key) => keys.includes(key));

export const toggleWorkspace = (keys: readonly WorkspaceKey[], key: WorkspaceKey): WorkspaceKey[] =>
  keys.includes(key) ? keys.filter((k) => k !== key) : sortWorkspaces([...keys, key]);

export const workspaceNames = (keys: readonly WorkspaceKey[]) =>
  sortWorkspaces(keys)
    .map((key) => WORKSPACES.find((w) => w.key === key)?.label ?? key)
    .join(", ");

/** Starting workspaces for each "Start from" preset in the new-role dialog. */
export const WORKSPACES_FROM_START: Record<Exclude<StartKey, "copy">, WorkspaceKey[]> = {
  view: ["generic"],
  manager: ["admin"],
  hod: ["hod"],
  admin: ["admin"],
  blank: ["generic"],
};

const RANK: Record<string, number> = { No_Access: 0, Can_View: 1, Can_Manage: 2, Super_Admin: 3 };

/** The server's default when a role has never had workspaces set (mirrors the contract's rules). */
export const deriveWorkspaces = (role: Pick<AccessRight, "permissions"> | null | undefined): WorkspaceKey[] => {
  const normalized = normalizePermissionPayload((role?.permissions || {}) as PermissionMap);
  const rank = (key: string) => RANK[String(resolvePermission(normalized, key) ?? "No_Access")] ?? 0;
  const scopes = (normalized.Scopes || {}) as ScopesMap;
  const out: WorkspaceKey[] = [];
  if (rank("Reports") >= 3) out.push("prelate");
  if (rank("Settings") >= 2 || rank("Members") >= 2) out.push("admin");
  if (rank("Financials") >= 2) out.push("finance");
  if (rank("Departments") >= 2 && isDepartmentScope(scopes.Departments)) out.push("hod");
  return out.length ? out : ["generic"];
};

/** A role's workspaces as the server reports them, falling back to the derived default. */
export const workspacesOf = (role: AccessRight | null | undefined): WorkspaceKey[] =>
  Array.isArray(role?.workspaces) ? sortWorkspaces(role.workspaces) : deriveWorkspaces(role);

/** Whether the workspaces shown are a default rather than saved on the role. */
export const isDefaultWorkspaces = (role: AccessRight | null | undefined) =>
  !Array.isArray(role?.workspaces) || !!role?.workspaces_default;

/** Note for the give-role dialogs: what the chosen role adds next to Home. */
export const roleWorkspaceNote = (role: AccessRight | null | undefined) => {
  const keys = workspacesOf(role);
  return keys.length
    ? `Home workspaces from this role: ${workspaceNames(keys)}. Change them on the role, not per person.`
    : "This role adds no workspaces. They will see Home only.";
};
