type LmsFeatureFlag =
  | "guided_forms"
  | "deep_navigation_context"
  | "server_student_operations"
  | "grading_guardrails"
  | "telemetry";

type LmsActionStatus = "started" | "success" | "failure";

interface LmsLogEntry {
  action: string;
  status: LmsActionStatus;
  timestamp: string;
  durationMs?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_FLAGS: Record<LmsFeatureFlag, boolean> = {
  guided_forms: true,
  deep_navigation_context: true,
  server_student_operations: true,
  grading_guardrails: true,
  telemetry: true,
};

const FLAG_PREFIX = "lms.flag.";
const TELEMETRY_STORAGE_KEY = "lms.telemetry.events";
const AUDIT_STORAGE_KEY = "lms.audit.logs";
const MAX_LOG_ENTRIES = 100;

const parseBoolean = (raw?: string | null): boolean | null => {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
};

const readStorageFlag = (flag: LmsFeatureFlag): boolean | null => {
  if (typeof window === "undefined") return null;
  return parseBoolean(window.localStorage.getItem(`${FLAG_PREFIX}${flag}`));
};

const readEnvFlag = (flag: LmsFeatureFlag): boolean | null => {
  const envKey = `VITE_LMS_${flag.toUpperCase()}`;
  const value = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.[envKey];
  return parseBoolean(value);
};

export const isLmsFeatureEnabled = (flag: LmsFeatureFlag): boolean => {
  const storageOverride = readStorageFlag(flag);
  if (storageOverride !== null) return storageOverride;

  const envOverride = readEnvFlag(flag);
  if (envOverride !== null) return envOverride;

  return DEFAULT_FLAGS[flag];
};

const appendLog = (key: string, entry: LmsLogEntry) => {
  if (typeof window === "undefined") return;

  try {
    const existing = window.localStorage.getItem(key);
    const parsed = existing ? (JSON.parse(existing) as LmsLogEntry[]) : [];
    const next = [...parsed, entry].slice(-MAX_LOG_ENTRIES);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Ignore storage failures to avoid impacting core UX flows.
  }
};

const writeTelemetry = (entry: LmsLogEntry) => {
  if (!isLmsFeatureEnabled("telemetry")) return;
  appendLog(TELEMETRY_STORAGE_KEY, entry);
  // Console logging helps short-term production validation without extra backend contracts.
  // eslint-disable-next-line no-console
  console.info("[LMS][Telemetry]", entry);
};

const writeAudit = (entry: LmsLogEntry) => {
  appendLog(AUDIT_STORAGE_KEY, entry);
  // eslint-disable-next-line no-console
  console.info("[LMS][Audit]", entry);
};

export const createLmsActionTracker = (
  action: string,
  metadata?: Record<string, unknown>
) => {
  const startedAt = Date.now();

  const startedEntry: LmsLogEntry = {
    action,
    status: "started",
    timestamp: new Date(startedAt).toISOString(),
    metadata,
  };

  writeTelemetry(startedEntry);
  writeAudit(startedEntry);

  const finish = (
    status: Exclude<LmsActionStatus, "started">,
    options?: {
      message?: string;
      metadata?: Record<string, unknown>;
      error?: unknown;
    }
  ) => {
    const finishedAt = Date.now();
    const durationMs = finishedAt - startedAt;
    const errorMessage =
      options?.error instanceof Error
        ? options.error.message
        : typeof options?.error === "string"
        ? options.error
        : undefined;

    const entry: LmsLogEntry = {
      action,
      status,
      timestamp: new Date(finishedAt).toISOString(),
      durationMs,
      message: options?.message ?? errorMessage,
      metadata: {
        ...(metadata ?? {}),
        ...(options?.metadata ?? {}),
      },
    };

    if (status === "failure") {
      writeTelemetry({
        ...entry,
        action: `${action}.api_failure`,
      });
    } else {
      writeTelemetry(entry);
    }
    writeAudit(entry);
  };

  return {
    success: (options?: { message?: string; metadata?: Record<string, unknown> }) =>
      finish("success", options),
    failure: (options?: {
      message?: string;
      metadata?: Record<string, unknown>;
      error?: unknown;
    }) => finish("failure", options),
  };
};
