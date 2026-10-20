import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import type {
  FinanceApprovalConfig,
  FinanceConfigLine,
  FinanceConfigLinePayload,
  FinancialRecord,
  GivingContribution,
  GivingContributionQuery,
  GivingOption,
} from "@/utils/api/finance/interface";
import type { PledgeListRow } from "@/utils/api/pledges/interface";
import type { ApiResponse, QueryType } from "@/utils/interfaces";

import { type FinanceConfigState, type WeekRecord, num, toWeekRecord, todayKey } from "./financeModel";

/** Active branch id for writes, or undefined for "All branches". */
export const useWriteBranchId = () => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  return activeBranchId && activeBranchId !== ALL_BRANCHES && Number(activeBranchId) > 0
    ? Number(activeBranchId)
    : undefined;
};

export const useIsAllBranches = () => useBranchStore((state) => state.activeBranchId) === ALL_BRANCHES;

/** Today's calendar day; rolls over at midnight. */
export const useToday = () => {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayKey()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return today;
};

/** Member names by user id, from the org-wide options the shell loads. */
export const useMemberNames = () => {
  const options = useStore((state) => state.membersOptions);
  return useMemo(() => {
    const byId = new Map(options.map((o) => [String(o.value), String(o.label)]));
    return {
      options,
      nameOf: (id?: number | string | null) => (id === null || id === undefined ? "" : byId.get(String(id)) ?? `User ${id}`),
    };
  }, [options]);
};

const listOf = <T,>(response: ApiResponse<unknown> | null | undefined): T[] => {
  const d = (response as { data?: unknown } | null | undefined)?.data;
  return Array.isArray(d) ? (d as T[]) : [];
};

/* ----------------------------- weekly records ---------------------------- */

const RECORDS_QUERY = { page: 1, take: 500 };

export const useFinanceRecords = () => {
  const res = useFetch(api.fetch.fetchFinancials, RECORDS_QUERY);
  const records = useMemo<WeekRecord[]>(
    () =>
      listOf<FinancialRecord>(res.data)
        .filter((r) => r && r.id)
        .map(toWeekRecord),
    [res.data]
  );
  const { refetch } = res;
  const reload = useCallback(() => refetch(), [refetch]);
  return { records, loading: res.loading && !res.data, error: res.error, reload };
};

/* ------------------------------ configuration ---------------------------- */

const CONFIG_QUERY = { page: 1, take: 200 };

/** Config endpoints list newest first; records use them in the order created. */
const lines = (response: ApiResponse<unknown> | null | undefined) =>
  listOf<FinanceConfigLine>(response)
    .map((c) => ({ ...c, id: String(c.id), name: String(c.name ?? "").trim() }))
    .filter((c) => c.name)
    .reverse();

export type ConfigKind = "receipts" | "payments" | "tithe" | "alloc";

const CONFIG_API: Record<
  ConfigKind,
  {
    create: (p: FinanceConfigLinePayload) => Promise<unknown>;
    update: (p: FinanceConfigLinePayload, q: QueryType) => Promise<unknown>;
    remove: (q: QueryType) => Promise<unknown>;
    hasPct: boolean;
  }
> = {
  receipts: {
    create: (p) => api.post.createReceiptConfig(p),
    update: (p, q) => api.put.updateReceiptConfig(p, q),
    remove: (q) => api.delete.deleteReceiptConfig(q),
    hasPct: false,
  },
  payments: {
    create: (p) => api.post.createPaymentConfig(p),
    update: (p, q) => api.put.updatePaymentConfig(p, q),
    remove: (q) => api.delete.deletePaymentConfig(q),
    hasPct: false,
  },
  tithe: {
    create: (p) => api.post.createTitheBreakdownConfig(p),
    update: (p, q) => api.put.updateTitheBreakdownConfig(p, q),
    remove: (q) => api.delete.deleteTitheBreakdownConfig(q),
    hasPct: true,
  },
  alloc: {
    create: (p) => api.post.createBankAccountConfig(p),
    update: (p, q) => api.put.updateBankAccountConfig(p, q),
    remove: (q) => api.delete.deleteBankAccountConfig(q),
    hasPct: true,
  },
};

export interface DraftLine {
  id?: string;
  name: string;
  percentage?: number | string;
}

export const useFinanceConfig = () => {
  const receipts = useFetch(api.fetch.fetchReceiptConfig, CONFIG_QUERY, false, { silent: true });
  const payments = useFetch(api.fetch.fetchPaymentConfig, CONFIG_QUERY, false, { silent: true });
  const tithe = useFetch(api.fetch.fetchTitheBreakdownConfig, CONFIG_QUERY, false, { silent: true });
  const alloc = useFetch(api.fetch.fetchBankAccountConfig, CONFIG_QUERY, false, { silent: true });
  const approval = useFetch(api.fetch.fetchFinanceApprovalConfig, undefined, false, { silent: true });
  const branchId = useWriteBranchId();

  const approvalCfg: FinanceApprovalConfig | null = approval.data?.data ?? null;
  const config = useMemo<FinanceConfigState>(
    () => ({
      receipts: lines(receipts.data),
      payments: lines(payments.data),
      tithe: lines(tithe.data),
      alloc: lines(alloc.data),
      rate: num(approvalCfg?.tithe_percentage ?? 10) || 0,
    }),
    [receipts.data, payments.data, tithe.data, alloc.data, approvalCfg]
  );

  const loaded = Boolean(receipts.data && payments.data && tithe.data && alloc.data && approval.data);
  const failed = Boolean(receipts.error || payments.error || tithe.error || alloc.error);

  const fetchers = { receipts, payments, tithe, alloc };

  /** Applies a list edit: deletes removed lines, updates changed ones, creates new ones. */
  const saveLines = async (kind: ConfigKind, draft: DraftLine[]) => {
    const spec = CONFIG_API[kind];
    const original = config[kind];
    const keep = new Set(draft.map((d) => d.id).filter(Boolean));
    for (const line of original) {
      if (!keep.has(line.id)) await spec.remove({ id: line.id });
    }
    for (const d of draft) {
      const payload: FinanceConfigLinePayload = {
        name: d.name.trim(),
        ...(spec.hasPct ? { percentage: num(d.percentage) } : {}),
        ...(branchId && !d.id ? { branch_id: branchId } : {}),
      };
      if (d.id) {
        const was = original.find((o) => o.id === d.id);
        const changed = !was || was.name !== payload.name || (spec.hasPct && num(was.percentage) !== num(d.percentage));
        if (changed) await spec.update({ ...payload, description: was?.description ?? undefined }, { id: d.id });
      } else {
        await spec.create(payload);
      }
    }
    await fetchers[kind].refetch();
  };

  const saveApproval = async (patch: Partial<FinanceApprovalConfig>) => {
    const next = { ...(approvalCfg ?? { notification_user_ids: [], is_active: true, finance_approver_user_id: null }), ...patch };
    if (!next.finance_approver_user_id) throw new Error("Choose the finance approver first, in the Approval tab.");
    await api.post.upsertFinanceApprovalConfig({
      finance_approver_user_id: Number(next.finance_approver_user_id),
      notification_user_ids: next.notification_user_ids ?? [],
      is_active: next.is_active !== false,
      ...(next.tithe_percentage !== undefined ? { tithe_percentage: num(next.tithe_percentage) } : {}),
    });
    await approval.refetch();
  };

  return { config, approval: approvalCfg, loaded, failed, saveLines, saveApproval };
};

/** Who approves weekly records, and whether that's the viewer. */
export const useApprover = (approval: FinanceApprovalConfig | null) => {
  const { user } = useAuth();
  const { nameOf } = useMemberNames();
  const approverId = approval?.finance_approver_user_id ?? null;
  return {
    approverId,
    approverName: approverId ? nameOf(approverId) : "",
    isApprover: Boolean(approverId && Number(user?.id) === Number(approverId)),
    notifyNames: (approval?.notification_user_ids ?? []).map((id) => nameOf(id)),
    me: String(user?.name ?? ""),
    myId: Number(user?.id ?? 0),
  };
};

/* --------------------------------- giving -------------------------------- */

const OPTIONS_QUERY = { page: 1, take: 200, include_archived: "true" };

export const useGivingOptions = () => {
  const res = useFetch(api.fetch.fetchGivingOptions, OPTIONS_QUERY);
  const options = useMemo(() => listOf<GivingOption>(res.data), [res.data]);
  const { refetch } = res;
  return { options, loading: res.loading && !res.data, error: res.error, reload: useCallback(() => refetch(), [refetch]) };
};

const CONTRIB_PAGE = 200;
const CONTRIB_PAGES = 3;

/**
 * The latest contributions (up to 600) matching the server-side filters. Status
 * tabs, search and KPIs work on this window; `total` says how many exist.
 */
export const useContributions = (filters: { giving_option_id?: string; from?: string; to?: string }) => {
  const branchId = useBranchStore((state) => state.activeBranchId);
  const [rows, setRows] = useState<GivingContribution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  // The API layer scopes this endpoint to the active branch; the key reloads on a switch.
  const key = JSON.stringify({ ...filters, branchId });
  const latest = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const f = JSON.parse(key) as typeof filters & { branchId?: unknown };
      const query: GivingContributionQuery = {
        take: CONTRIB_PAGE,
        ...(f.giving_option_id ? { giving_option_id: f.giving_option_id } : {}),
        ...(f.from ? { from: f.from } : {}),
        ...(f.to ? { to: f.to } : {}),
      };
      const out: GivingContribution[] = [];
      let seen = 0;
      for (let page = 1; page <= CONTRIB_PAGES; page += 1) {
        const response = (await api.fetch.fetchGivingContributions({ ...query, page })) as ApiResponse<
          GivingContribution[]
        > & { total?: number; meta?: { total?: number } };
        const data = Array.isArray(response?.data) ? response.data : [];
        out.push(...data);
        seen = Number(response?.total ?? response?.meta?.total ?? out.length);
        if (data.length < CONTRIB_PAGE) break;
      }
      // A newer filter change started another load; drop this one.
      if (ticket !== latest.current) return;
      setRows(out);
      setTotal(Math.max(seen, out.length));
    } catch (e) {
      if (ticket === latest.current) setError(e);
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback((changed: GivingContribution[]) => {
    if (!changed.length) return;
    setRows((prev) => prev.map((r) => changed.find((c) => c.reference === r.reference) ?? r));
  }, []);

  return { rows, total, loading, error, reload: load, patch };
};

/* --------------------------------- pledges ------------------------------- */

export const usePledgeList = () => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const query = useMemo(
    () => (activeBranchId && activeBranchId !== ALL_BRANCHES ? { branch_id: activeBranchId } : undefined),
    [activeBranchId]
  );
  const res = useFetch(api.fetch.fetchPledges, query);
  const pledges = useMemo(() => listOf<PledgeListRow>(res.data), [res.data]);
  const { refetch } = res;
  return { pledges, loading: res.loading && !res.data, error: res.error, reload: useCallback(() => refetch(), [refetch]) };
};
