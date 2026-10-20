import { useCallback, useEffect, useMemo, useState } from "react";

import { pictureInstance } from "@/axiosInstance";
import { useAuth } from "@/context/AuthWrapper";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type {
  RequisitionFormPayload,
  RequisitionOverviewDetail,
} from "@/utils/api/requisitions/interfaces";
import { validateUploadFile } from "@/utils/uploadValidation";

import type { Row } from "./requisitionModel";

/** Re-renders every minute so waiting times stay current. */
export const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
};

/** Uploads one quote or photo and returns its URL. Throws with a readable reason. */
export const uploadRequisitionFile = async (file: File): Promise<string> => {
  const check = validateUploadFile(file);
  if (!check.valid) throw new Error(check.message || "That file can’t be attached.");
  const form = new FormData();
  form.append("file", file);
  const response = await pictureInstance.post("/upload", form);
  const link = response?.data?.result?.link;
  if (!link) throw new Error("The upload didn’t return a link.");
  return String(link);
};

/**
 * Requisitions the viewer can see for one section, plus every action the
 * pages run. Branch-scoped through useFetch (it re-runs on branch change).
 */
export const useRequisitionsData = (scope: "mine" | "all") => {
  const { user } = useAuth();
  const me = Number(user?.id) || 0;
  const { canManage } = useAccessControl();
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const now = useNow();

  const query = useMemo(() => ({ scope }), [scope]);
  const overview = useFetch(api.fetch.fetchRequisitionOverview, query);
  const data = overview.data?.data;

  const rows = useMemo<Row[]>(() => (Array.isArray(data?.requisitions) ? data!.requisitions : []), [data]);
  const isManager = data?.viewer.is_manager ?? canManage("Requisition");
  const isApprover = data?.viewer.is_approver ?? false;
  const replyDays = data?.reply_days || 3;
  const lookbackDays = data?.lookback_days || 30;

  const { refetch } = overview;
  const reload = useCallback(() => refetch(), [refetch]);

  const branchId =
    activeBranchId && activeBranchId !== ALL_BRANCHES && Number(activeBranchId) > 0 ? Number(activeBranchId) : undefined;

  /** Create (no id) or update a requisition. Returns the saved record's id and generated id. */
  const save = useCallback(
    async (payload: RequisitionFormPayload) => {
      const body = { ...payload, ...(branchId && !payload.id ? { branch_id: branchId } : {}) };
      const response = payload.id
        ? await api.put.updateRequisition<RequisitionOverviewDetail>(body as unknown as Record<string, unknown>)
        : await api.post.createRequisition<RequisitionOverviewDetail>(body as unknown as Record<string, unknown>);
      const saved = response?.data as unknown as { id?: number; generated_id?: string } | undefined;
      return { id: Number(saved?.id ?? payload.id), generatedId: String(saved?.generated_id ?? "") };
    },
    [branchId]
  );

  /** Requester signs, then submits. The update alone submits on older servers; submit is idempotent. */
  const submit = useCallback(async (id: number, signature: string) => {
    await api.put.updateRequisition({ id, user_sign: signature });
    await api.post.submitRequisition({ requisition_id: id });
  }, []);

  const approve = useCallback(async (id: number, signature: string, comment: string) => {
    await api.post.requisitionApprovalAction({
      requisition_id: id,
      action: "APPROVE",
      user_sign: signature,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    });
  }, []);

  const reject = useCallback(async (id: number, reason: string) => {
    await api.post.requisitionApprovalAction({ requisition_id: id, action: "REJECT", comment: reason.trim() });
  }, []);

  const remind = useCallback(async (id: number) => {
    const response = await api.post.sendRequisitionReminder({ requisition_id: id });
    return response?.data;
  }, []);

  const remove = useCallback(async (id: number) => {
    await api.delete.deleteRequest({ id });
  }, []);

  const comment = useCallback(async (id: number, text: string) => {
    await api.post.addRequisitionComment({ requisition_id: id, comment: text.trim() });
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    const response = await api.fetch.fetchRequisitionOverviewDetail({ id });
    return response?.data ?? null;
  }, []);

  return {
    me,
    now,
    rows,
    isManager,
    isApprover,
    replyDays,
    lookbackDays,
    loading: overview.loading,
    loaded: overview.data !== null,
    error: overview.error,
    reload,
    save,
    submit,
    approve,
    reject,
    remind,
    remove,
    comment,
    loadDetail,
  };
};

export type RequisitionsData = ReturnType<typeof useRequisitionsData>;
