import { useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import { ApiError } from "@/utils/api/errors/ApiError";
import type { MembersType } from "@/utils/api/members/interfaces";
import type { PositionType } from "@/utils/api/settings/positionInterfaces";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  emptyDraft,
  eventReportPayload,
  financePayload,
  parseEventReport,
  parseFinance,
  parseRequisition,
  requisitionPayload,
  StoredWorkflow,
  WorkflowDraft,
  WorkflowKey,
  WORKFLOW_KEYS,
} from "./approvalsModel";

export type CardState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "error" }
  | { status: "ready"; stored: StoredWorkflow };

export interface Person {
  id: number;
  name: string;
}

const statusOf = (error: unknown) => (error instanceof ApiError ? error.statusCode : 0);

const loaders: Record<WorkflowKey, () => Promise<StoredWorkflow>> = {
  REQ: async () => parseRequisition((await api.fetch.fetchRequisitionApprovalConfig()).data),
  REP: async () => parseEventReport((await api.fetch.fetchEventReportApprovalConfig()).data),
  FIN: async () => parseFinance((await api.fetch.fetchFinanceApprovalConfig()).data),
};

const savers: Record<WorkflowKey, (draft: WorkflowDraft, active: boolean) => Promise<unknown>> = {
  REQ: (draft, active) => api.post.upsertRequisitionApprovalConfig(requisitionPayload(draft, active)),
  REP: (draft, active) => api.post.upsertEventReportApprovalConfig(eventReportPayload(draft, active)),
  FIN: (draft, active) => api.post.upsertFinanceApprovalConfig(financePayload(draft, active)),
};

const toPeople = (rows: MembersType[] | undefined): (Person & { active: boolean })[] =>
  (Array.isArray(rows) ? rows : [])
    .filter((row) => row && Number(row.id) > 0)
    .map((row) => ({ id: Number(row.id), name: row.name || `Member ${row.id}`, active: row.is_active !== false }));

const byName = (a: Person, b: Person) => a.name.localeCompare(b.name);

export const useApprovals = () => {
  const branches = useBranchStore((s) => s.branches);
  const [cards, setCards] = useState<Record<WorkflowKey, CardState>>({
    REQ: { status: "loading" },
    REP: { status: "loading" },
    FIN: { status: "loading" },
  });
  const [members, setMembers] = useState<(Person & { active: boolean })[]>([]);
  const [financeMembers, setFinanceMembers] = useState<Person[]>([]);
  const [positions, setPositions] = useState<PositionType[]>([]);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  const load = useCallback(async (key: WorkflowKey) => {
    try {
      const stored = await loaders[key]();
      if (mounted.current) setCards((prev) => ({ ...prev, [key]: { status: "ready", stored } }));
    } catch (error) {
      const code = statusOf(error);
      const next: CardState =
        code === 403
          ? { status: "denied" }
          : code === 404
            ? { status: "ready", stored: { exists: false, draft: emptyDraft() } }
            : { status: "error" };
      if (mounted.current) setCards((prev) => ({ ...prev, [key]: next }));
    }
  }, []);

  useEffect(() => {
    WORKFLOW_KEYS.forEach((key) => void load(key));

    api.fetch
      .fetchMembersForOptions()
      .then((res) => mounted.current && setMembers(toPeople(res.data)))
      .catch(() => undefined);
    api.fetch
      .fetchMembersForOptions({ permission_domain: "Financials", minimum_access: "view" })
      .then((res) => mounted.current && setFinanceMembers(toPeople(res.data).filter((p) => p.active)))
      .catch(() => undefined);
    api.fetch
      .fetchPositions()
      .then((res) => mounted.current && setPositions(Array.isArray(res.data) ? res.data : []))
      .catch(() => undefined);
  }, [load]);

  const retry = useCallback(
    (key: WorkflowKey) => {
      setCards((prev) => ({ ...prev, [key]: { status: "loading" } }));
      void load(key);
    },
    [load]
  );

  const nameById = useMemo(() => {
    const map = new Map<number, string>();
    financeMembers.forEach((p) => map.set(p.id, p.name));
    members.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [members, financeMembers]);

  const personName = useCallback((id: number) => nameById.get(id) ?? `Member #${id}`, [nameById]);

  const positionName = useCallback(
    (id: number) => positions.find((p) => Number(p.id) === id)?.name ?? `Position #${id}`,
    [positions]
  );

  const positionOptions = useMemo(
    () =>
      positions
        .map((p) => {
          const branch = branches.find((b) => b.id === p.branch_id);
          return { id: Number(p.id), name: branch ? `${p.name} · ${branch.name}` : p.name };
        })
        .sort(byName),
    [positions, branches]
  );

  const activeMembers = useMemo(() => members.filter((p) => p.active).sort(byName), [members]);
  const financeOptions = useMemo(() => [...financeMembers].sort(byName), [financeMembers]);

  /** Upserts the workflow and stores the result locally. Resolves false if the request failed. */
  const save = useCallback(async (key: WorkflowKey, draft: WorkflowDraft, active: boolean) => {
    try {
      await savers[key](draft, active);
    } catch {
      return false;
    }
    if (mounted.current) {
      setCards((prev) => ({ ...prev, [key]: { status: "ready", stored: { exists: true, draft: { ...draft, active } } } }));
    }
    return true;
  }, []);

  return {
    cards,
    retry,
    save,
    personName,
    positionName,
    positionOptions,
    activeMembers,
    financeOptions,
  };
};
