import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "@/utils/api/apiCalls";
import type { AttendanceTimingSettingsConfig } from "@/utils/api/settings/attendanceTimingInterfaces";
import type { EventReportExcludedUser } from "@/utils/api/settings/eventReportExclusionInterfaces";
import type { ReportConfigDepartment } from "@/utils/api/settings/reportConfigInterfaces";
import type {
  SystemNotificationAdminCandidate,
  SystemNotificationSettingsConfig,
} from "@/utils/api/settings/systemNotificationInterfaces";

import {
  lookbackOk,
  parseRequisition,
  replyOk,
  requisitionPayload,
  type StoredWorkflow,
} from "../approvals/approvalsModel";
import {
  ATT_ROWS,
  attFromConfig,
  clonePart,
  eligFromConfig,
  eligPayload,
  normPart,
  PART_ORDER,
  repCfgFromConfig,
  repCfgPayload,
  type RulesPart,
  type RulesValues,
} from "./generalModel";

export type LoadStatus = "loading" | "ready" | "error";

type Saved = { [P in RulesPart]?: RulesValues[P] };
type Status = Record<RulesPart, LoadStatus>;

export interface AttendanceApply {
  applyToExisting: boolean;
  /** YYYY-MM */
  applyFrom?: string;
}

const LOADING: Status = {
  att: "loading",
  req: "loading",
  elig: "loading",
  repExcl: "loading",
  repCfg: "loading",
  logTo: "loading",
};

/**
 * Attendance timing, requisition timing, eligibility rules, report exclusions,
 * report configuration and the failure alert recipient share one page-level draft and one Save
 * button. Each part loads on its own so a slow or failing endpoint only
 * affects its section. Requisition timing loads only for people who can view
 * Requisition, so others don't get an access-denied toast.
 */
export const useRulesDraft = ({
  withRequisition,
  withLogs = true,
}: {
  withRequisition: boolean;
  /** False without Settings.view_logs: the failure alert recipient isn't loaded. */
  withLogs?: boolean;
}) => {
  const [saved, setSaved] = useState<Saved>({});
  const [drafts, setDrafts] = useState<Saved>({});
  const [status, setStatus] = useState<Status>(LOADING);
  const [saving, setSaving] = useState(false);
  const [attConfig, setAttConfig] = useState<AttendanceTimingSettingsConfig | null>(null);
  const [excludedUsers, setExcludedUsers] = useState<EventReportExcludedUser[]>([]);
  const [reportDepartments, setReportDepartments] = useState<ReportConfigDepartment[]>([]);
  const [logsConfig, setLogsConfig] = useState<SystemNotificationSettingsConfig | null>(null);
  const [admins, setAdmins] = useState<SystemNotificationAdminCandidate[]>([]);
  /** The whole stored requisition workflow; timing saves re-send the rest unchanged. */
  const [reqStored, setReqStored] = useState<StoredWorkflow | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const mark = (part: RulesPart, next: LoadStatus) => {
    if (alive.current) setStatus((current) => ({ ...current, [part]: next }));
  };

  const load = useCallback(async (part: RulesPart) => {
    mark(part, "loading");
    try {
      if (part === "att") {
        const response = await api.fetch.fetchAttendanceTimingConfig();
        if (!alive.current) return;
        setAttConfig(response.data ?? null);
        setSaved((current) => ({ ...current, att: attFromConfig(response.data) }));
      } else if (part === "req") {
        const response = await api.fetch.fetchRequisitionApprovalConfig();
        if (!alive.current) return;
        const stored = parseRequisition(response.data);
        setReqStored(stored);
        setSaved((current) => ({
          ...current,
          req: { lookback: stored.draft.lookback, reply: stored.draft.reply },
        }));
      } else if (part === "elig") {
        const response = await api.fetch.fetchRoleEligibilityConfig();
        if (!alive.current) return;
        setSaved((current) => ({ ...current, elig: eligFromConfig(response.data) }));
      } else if (part === "repExcl") {
        const response = await api.fetch.fetchEventReportExclusions();
        if (!alive.current) return;
        const users = response.data?.users ?? [];
        setExcludedUsers(users);
        setSaved((current) => ({ ...current, repExcl: users.map((user) => user.id) }));
      } else if (part === "repCfg") {
        const response = await api.fetch.fetchReportConfig();
        if (!alive.current) return;
        setReportDepartments(Array.isArray(response.data?.departments) ? response.data.departments : []);
        setSaved((current) => ({ ...current, repCfg: repCfgFromConfig(response.data) }));
      } else {
        const [configResponse, adminsResponse] = await Promise.all([
          api.fetch.fetchSystemNotificationConfig(),
          api.fetch.fetchSystemNotificationAdmins(),
        ]);
        if (!alive.current) return;
        const config = configResponse.data ?? null;
        const candidates = Array.isArray(adminsResponse.data) ? adminsResponse.data : [];
        const current = config?.system_failure_recipient;
        setLogsConfig(config);
        setAdmins(current ? [current, ...candidates.filter((c) => c.id !== current.id)] : candidates);
        setSaved((prev) => ({ ...prev, logTo: config?.system_failure_recipient_user_id ?? null }));
      }
      mark(part, "ready");
    } catch {
      mark(part, "error");
    }
  }, []);

  useEffect(() => {
    PART_ORDER.forEach((part) => {
      if (part === "req" && !withRequisition) return;
      if (part === "logTo" && !withLogs) return;
      void load(part);
    });
  }, [load, withRequisition, withLogs]);

  const value = useCallback(
    <P extends RulesPart>(part: P): RulesValues[P] | undefined =>
      (part in drafts ? drafts[part] : saved[part]) as RulesValues[P] | undefined,
    [drafts, saved]
  );

  const dirtyParts = useMemo(
    () =>
      PART_ORDER.filter((part) => {
        const draft = drafts[part];
        const base = saved[part];
        if (draft === undefined || base === undefined) return false;
        return normPart(part, draft as RulesValues[typeof part]) !== normPart(part, base as RulesValues[typeof part]);
      }),
    [drafts, saved]
  );

  /** Edit one part; `fn` gets a copy it may mutate. */
  const set = useCallback(
    <P extends RulesPart>(part: P, fn: (draft: RulesValues[P]) => RulesValues[P]) => {
      setDrafts((current) => {
        const base = (part in current ? current[part] : saved[part]) as RulesValues[P] | undefined;
        if (base === undefined) return current;
        return { ...current, [part]: fn(clonePart(base)) };
      });
    },
    [saved]
  );

  const discard = useCallback(() => setDrafts({}), []);

  const attInvalid = useMemo(() => {
    const att = drafts.att;
    return !!att && ATT_ROWS.some((row) => !/^\d+$/.test(att[row.key].value.trim()) || Number(att[row.key].value) <= 0);
  }, [drafts.att]);

  const reqInvalid = useMemo(() => {
    const req = drafts.req;
    if (!req || !reqStored) return false;
    const draft = { ...reqStored.draft, ...req };
    return !lookbackOk(draft) || !replyOk(draft);
  }, [drafts.req, reqStored]);

  /** Saves every dirty part. Resolves true when all of them saved. */
  const commit = useCallback(
    async (apply?: AttendanceApply) => {
      const parts = dirtyParts;
      if (!parts.length) return true;
      setSaving(true);
      const results = await Promise.allSettled(
        parts.map(async (part) => {
          if (part === "att" && drafts.att) {
            const att = drafts.att;
            const response = await api.post.upsertAttendanceTimingConfig({
              early: { value: Number(att.early.value), unit: att.early.unit },
              on_time: { value: Number(att.on_time.value), unit: att.on_time.unit },
              late: { value: Number(att.late.value), unit: att.late.unit },
              apply_to_existing: !!apply?.applyToExisting,
              ...(apply?.applyToExisting && apply.applyFrom ? { apply_from: apply.applyFrom } : {}),
            });
            if (response.data) setAttConfig(response.data);
            return { part, next: response.data ? attFromConfig(response.data) : att };
          }
          if (part === "req" && drafts.req) {
            if (!reqStored?.exists) throw new Error("Requisition approvals aren't set up yet");
            const draft = {
              ...reqStored.draft,
              lookback: String(Number(drafts.req.lookback)),
              reply: String(Number(drafts.req.reply)),
            };
            const response = await api.post.upsertRequisitionApprovalConfig(
              requisitionPayload(draft, reqStored.draft.active)
            );
            const stored = response.data ? parseRequisition(response.data) : { exists: true, draft };
            setReqStored(stored);
            return { part, next: { lookback: stored.draft.lookback, reply: stored.draft.reply } };
          }
          if (part === "elig" && drafts.elig) {
            const response = await api.post.upsertRoleEligibilityConfig(eligPayload(drafts.elig));
            return { part, next: response.data ? eligFromConfig(response.data) : drafts.elig };
          }
          if (part === "repExcl" && drafts.repExcl) {
            const response = await api.post.upsertEventReportExclusions({ user_ids: drafts.repExcl });
            const users = response.data?.users;
            if (users) setExcludedUsers(users);
            return { part, next: users ? users.map((user) => user.id) : drafts.repExcl };
          }
          if (part === "repCfg" && drafts.repCfg) {
            const response = await api.post.upsertReportConfig(repCfgPayload(drafts.repCfg));
            const data = response.data;
            if (Array.isArray(data?.departments)) setReportDepartments(data.departments);
            return { part, next: data ? repCfgFromConfig(data) : drafts.repCfg };
          }
          const response = await api.post.upsertSystemNotificationConfig({
            system_failure_recipient_user_id: drafts.logTo ?? null,
          });
          if (response.data) setLogsConfig(response.data);
          return { part, next: response.data?.system_failure_recipient_user_id ?? drafts.logTo ?? null };
        })
      );
      if (!alive.current) return false;
      const done = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      setSaved((current) => {
        const next = { ...current };
        done.forEach(({ part, next: value }) => {
          (next as Record<RulesPart, unknown>)[part] = value;
        });
        return next;
      });
      setDrafts((current) => {
        const next = { ...current };
        done.forEach(({ part }) => delete next[part]);
        return next;
      });
      setSaving(false);
      return done.length === parts.length;
    },
    [dirtyParts, drafts, reqStored]
  );

  return {
    status,
    load,
    value,
    set,
    discard,
    commit,
    saving,
    dirtyParts,
    attInvalid,
    reqInvalid,
    reqStored,
    attConfig,
    excludedUsers,
    reportDepartments,
    logsConfig,
    admins,
  };
};

export type RulesDraft = ReturnType<typeof useRulesDraft>;
