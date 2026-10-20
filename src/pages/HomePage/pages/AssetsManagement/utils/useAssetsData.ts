import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { pictureInstance } from "@/axiosInstance";
import { useFetch } from "@/CustomHooks/useFetch";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type {
  AssetRow,
  AssetSavePayload,
  AssetSnapshot,
  AssetStatusPayload,
  RepairRequisitionPayload,
  PastStockCheck,
  StockCheck,
  StockCheckResponse,
} from "@/utils/api/assets/interfaces";
import { validateUploadFile } from "@/utils/uploadValidation";

import { todayKey } from "./assetModel";

/** Active branch id for writes, or undefined for "All branches". */
export const useWriteBranchId = () => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  return activeBranchId && activeBranchId !== ALL_BRANCHES && Number(activeBranchId) > 0
    ? Number(activeBranchId)
    : undefined;
};

/** Today's calendar day; rolls over at midnight. */
export const useToday = () => {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayKey()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return today;
};

/** Uploads one asset photo and returns its URL. Throws with a readable reason. */
export const uploadAssetPhoto = async (file: File): Promise<string> => {
  const check = validateUploadFile(file);
  if (!check.valid) throw new Error(check.message || "That file can’t be used as a photo.");
  const form = new FormData();
  form.append("file", file);
  const response = await pictureInstance.post("/upload", form);
  const link = response?.data?.result?.link;
  if (!link) throw new Error("The upload didn’t return a link.");
  return String(link);
};

/**
 * The register the viewer can see (branch-scoped through useFetch) and every
 * action the Assets pages run. Mutations patch the local copy with the rows the
 * server returns, so the page updates without a full reload.
 */
export const useAssetsData = () => {
  const overview = useFetch(api.fetch.fetchAssetOverview);
  const data = overview.data?.data;
  const branchId = useWriteBranchId();

  const [assets, setAssets] = useState<AssetRow[]>([]);
  useEffect(() => {
    setAssets(Array.isArray(data?.assets) ? data!.assets : []);
  }, [data]);

  const merge = useCallback((rows: AssetRow[]) => {
    if (!rows.length) return;
    setAssets((prev) => {
      const byId = new Map(rows.map((row) => [row.id, row]));
      const kept = prev.map((row) => byId.get(row.id) ?? row);
      const added = rows.filter((row) => !prev.some((p) => p.id === row.id));
      return [...added, ...kept];
    });
  }, []);

  const { refetch } = overview;
  const reload = useCallback(() => refetch(), [refetch]);

  const save = useCallback(
    async (payload: AssetSavePayload) => {
      const response = await api.post.saveAsset({ ...payload, ...(branchId && !payload.id ? { branch_id: branchId } : {}) });
      const row = response.data;
      merge([row]);
      return row;
    },
    [branchId, merge]
  );

  const updateStatus = useCallback(
    async (payload: AssetStatusPayload) => {
      const response = await api.post.updateAssetStatus(payload);
      merge(response.data.assets);
      return response.data;
    },
    [merge]
  );

  const restore = useCallback(
    async (snapshots: AssetSnapshot[]) => {
      const response = await api.post.restoreAssets({ snapshots });
      merge(response.data.assets);
    },
    [merge]
  );

  const confirmLost = useCallback(
    async (id: number) => {
      const response = await api.post.confirmAssetLost({ id });
      merge([response.data.asset]);
      return response.data.previous;
    },
    [merge]
  );

  const raiseRepair = useCallback(
    async (payload: RepairRequisitionPayload) => {
      const response = await api.post.raiseRepairRequisition({ ...payload, ...(branchId ? { branch_id: branchId } : {}) });
      merge(response.data.assets);
      return response.data;
    },
    [branchId, merge]
  );

  const clearRepair = useCallback(
    async (id: number) => {
      const response = await api.post.clearRepairRequisition({ id });
      merge([response.data.asset]);
      return response.data.asset;
    },
    [merge]
  );

  const remove = useCallback(async (id: number) => {
    await api.delete.deleteAsset({ id });
    setAssets((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const loadHistory = useCallback(async (id: number) => {
    const response = await api.fetch.fetchAssetHistory({ id });
    return response?.data?.history ?? [];
  }, []);

  const departments = useMemo(() => data?.departments ?? [], [data]);

  return {
    loaded: overview.data !== null,
    loading: overview.loading,
    error: overview.error,
    assets,
    departments,
    viewer: data?.viewer ?? { user_id: null, can_view_all: false, can_manage: false, can_delete: false, department_ids: [] },
    staleDays: data?.repair_stale_days || 30,
    reload,
    save,
    updateStatus,
    restore,
    confirmLost,
    raiseRepair,
    clearRepair,
    remove,
    loadHistory,
  };
};

export type AssetsData = ReturnType<typeof useAssetsData>;

/** Stock checks the viewer can see, with every counting and review action. */
export const useStockChecks = () => {
  const list = useFetch(api.fetch.fetchStockChecks);
  const data = list.data?.data;
  const branchId = useWriteBranchId();

  const [checks, setChecks] = useState<StockCheck[]>([]);
  const [past, setPast] = useState<PastStockCheck[]>([]);
  const [pastTotal, setPastTotal] = useState(0);
  useEffect(() => {
    setChecks(Array.isArray(data?.checks) ? data!.checks : []);
    setPast(Array.isArray(data?.past) ? data!.past : []);
    setPastTotal(data?.past_total ?? 0);
  }, [data]);

  const put = useCallback((check: StockCheck) => {
    setChecks((prev) => (prev.some((c) => c.id === check.id) ? prev.map((c) => (c.id === check.id ? check : c)) : [check, ...prev]));
  }, []);

  const { refetch } = list;
  const reload = useCallback(() => refetch(), [refetch]);
  const refetchRef = useRef(reload);
  refetchRef.current = reload;

  // Quick taps send several requests per check; only the newest response is applied.
  const seq = useRef(new Map<number, number>());

  /** Runs one stock-check action and swaps in the check the server returns. */
  const run = useCallback(
    async <T extends StockCheckResponse = StockCheckResponse>(action: string, payload: Record<string, unknown>) => {
      const checkId = Number(payload.check_id) || 0;
      const mine = (seq.current.get(checkId) ?? 0) + 1;
      seq.current.set(checkId, mine);
      const latest = () => !checkId || seq.current.get(checkId) === mine;
      try {
        const response = await api.post.stockCheckAction<T>(action, payload);
        const check = response.data?.check;
        if (check && latest()) put(check);
        return response.data;
      } catch (error) {
        // An earlier response may have been skipped for this one; resync.
        if (latest()) void refetchRef.current();
        throw error;
      }
    },
    [put]
  );

  const start = useCallback(
    (payload: { name: string; department_key: number | null; category: string; due_date: string }) =>
      run<StockCheckResponse & { counted: number; notified: number }>("start", {
        ...payload,
        ...(branchId ? { branch_id: branchId } : {}),
      }),
    [branchId, run]
  );

  /** Next page of closed checks. */
  const loadMorePast = useCallback(async () => {
    const response = await api.fetch.fetchStockChecks({ past_offset: past.length, past_limit: 10 });
    const next = response?.data?.past ?? [];
    setPast((prev) => [...prev, ...next.filter((row) => !prev.some((p) => p.id === row.id))]);
    setPastTotal(response?.data?.past_total ?? 0);
  }, [past.length]);

  /** One check in full (closed reports aren't in the list). */
  const loadCheck = useCallback(
    async (id: number) => {
      const response = await api.fetch.fetchStockCheckDetail({ id });
      const check = response?.data?.check;
      if (check) put(check);
      return check ?? null;
    },
    [put]
  );

  const cancel = useCallback(async (checkId: number) => {
    await api.post.stockCheckAction<{ id: number }>("cancel", { check_id: checkId });
    setChecks((prev) => prev.filter((c) => c.id !== checkId));
  }, []);


  return {
    loaded: list.data !== null,
    loading: list.loading,
    checks,
    past,
    pastTotal,
    loadMorePast,
    loadCheck,
    viewer: data?.viewer ?? { user_id: null, is_admin: false, department_keys: [] },
    reload,
    run,
    start,
    cancel,
  };
};

export type StockChecksData = ReturnType<typeof useStockChecks>;
