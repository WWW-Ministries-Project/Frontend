import { createContext, ReactNode, useContext } from "react";

import type {
  QueueItem,
  WidgetResult,
  WorkspaceDepartment,
  WorkspaceKey,
  WorkspaceRange,
} from "@/utils/api/workspaces/interfaces";

import type { ExportSheet } from "./wsExport";

export type BtnTone = "primary" | "secondary" | "ghost";

export interface BtnSpec {
  label: string;
  tone: BtnTone;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/** Everything a widget renderer may need besides its own data. */
export interface WidgetCtx {
  ws: WorkspaceKey;
  range: WorkspaceRange | null;
  allBranches: boolean;
  userId: string;
  department: WorkspaceDepartment | null;
  go: (to: string) => void;
  /** Per-widget view state (queue tab, chart mode, selects). */
  tabOf: (widgetId: string, fallback: string) => string;
  setTab: (widgetId: string, value: string) => void;
  /** Items acted on in this session are hidden until the next fetch. */
  isDone: (item: QueueItem) => boolean;
  openItem: (widgetId: string, item: QueueItem, actionKey?: string) => void;
  runAction: (widgetId: string, item: QueueItem, actionKey: string) => void;
  busyItem: string | null;
  /** Workspace query extras (e.g. `att_event`). */
  attEvent: string;
  setAttEvent: (value: string) => void;
  refetch: () => void;
}

export interface WidgetDef<D = unknown> {
  id: string;
  kind?: "card" | "hero" | "kpis";
  /** Columns out of 12 on wide screens. */
  span: number;
  title: string | ((ctx: WidgetCtx) => string);
  sub?: (data: D | undefined, ctx: WidgetCtx) => string | undefined;
  /** Count chip next to the title (queues). */
  count?: (data: D, ctx: WidgetCtx) => number | null;
  /** Controls in the card header (tabs, selects). */
  aside?: (data: D, ctx: WidgetCtx) => ReactNode;
  link?: (data: D, ctx: WidgetCtx) => { label: string; to: string } | null;
  btns?: (data: D, ctx: WidgetCtx) => BtnSpec[];
  isEmpty?: (data: D, ctx: WidgetCtx) => boolean;
  empty?: { title: string; text: string };
  exportSheet?: (data: D, ctx: WidgetCtx) => ExportSheet | ExportSheet[];
  render: (data: D, ctx: WidgetCtx) => ReactNode;
  /** Shown above the widget, e.g. the department pack heading. */
  slot?: (ctx: WidgetCtx) => { title: string; sub: string; tag?: string } | null;
  /** Leave the card out entirely when `isEmpty` is true. */
  hideIfEmpty?: boolean;
  /** Rendered from client data only; the API never sends it. */
  clientOnly?: boolean;
  /** Skeleton chart height. */
  skeleton?: number;
}

/** Widens a typed definition for the registry. */
export const def = <D,>(widget: WidgetDef<D>): WidgetDef<unknown> =>
  widget as unknown as WidgetDef<unknown>;

export const WidgetCtxContext = createContext<WidgetCtx | null>(null);

export const useWidgetCtx = () => {
  const ctx = useContext(WidgetCtxContext);
  if (!ctx) throw new Error("useWidgetCtx must be used inside a workspace");
  return ctx;
};

export type WidgetState = "loading" | "ready" | "empty" | "error";

export const titleOf = (widget: WidgetDef, ctx: WidgetCtx) =>
  typeof widget.title === "function" ? widget.title(ctx) : widget.title;

export const widgetState = (
  widget: WidgetDef,
  result: WidgetResult | undefined,
  loading: boolean,
  ctx: WidgetCtx
): WidgetState => {
  if (widget.clientOnly) return "ready";
  if (!result) return loading ? "loading" : "empty";
  if (!result.ok) return "error";
  if (result.data === null || result.data === undefined) return widget.isEmpty ? "empty" : "ready";
  return widget.isEmpty?.(result.data, ctx) ? "empty" : "ready";
};


export const queueCount = (items: QueueItem[], ctx: WidgetCtx) =>
  items.filter((item) => !ctx.isDone(item)).length;


export const WORKSPACE_LABELS: Record<WorkspaceKey, string> = {
  prelate: "Prelate",
  admin: "Administration",
  finance: "Finance",
  hod: "My department",
  generic: "Personal",
};

