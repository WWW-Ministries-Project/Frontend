import type { WorkspaceKey } from "@/utils/api/workspaces/interfaces";

import type { WidgetDef } from "../wsTypes";
import { ADMIN_WIDGETS } from "./admin";
import { FINANCE_WIDGETS } from "./finance";
import { GENERIC_WIDGETS } from "./generic";
import { HOD_WIDGETS } from "./hod";
import { PRELATE_WIDGETS } from "./prelate";

/** Widgets per workspace, in layout order. */
export const WORKSPACE_WIDGETS: Record<WorkspaceKey, WidgetDef[]> = {
  prelate: PRELATE_WIDGETS,
  admin: ADMIN_WIDGETS,
  finance: FINANCE_WIDGETS,
  hod: HOD_WIDGETS,
  generic: GENERIC_WIDGETS,
};
