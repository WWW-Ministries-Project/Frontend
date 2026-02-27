import { AxiosError } from "axios";

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const parseRetryAfterSeconds = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;

  const normalized = asNonEmptyString(value) ?? String(value);
  if (!normalized) return null;

  const numeric = Number(normalized);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return Math.ceil(numeric);
  }

  const parsedDate = Date.parse(normalized);
  if (Number.isNaN(parsedDate)) return null;

  const diffSeconds = Math.ceil((parsedDate - Date.now()) / 1000);
  return diffSeconds > 0 ? diffSeconds : null;
};

export const getRetryAfterSecondsFromHeaders = (
  headers: unknown
): number | null => {
  if (!headers || typeof headers !== "object") return null;

  const headerRecord = headers as Record<string, unknown>;
  const retryAfterHeader =
    headerRecord["retry-after"] ??
    headerRecord["Retry-After"] ??
    headerRecord.retryAfter;

  return parseRetryAfterSeconds(retryAfterHeader);
};

export const getRetryAfterSecondsFromError = (
  error: unknown
): number | null => {
  if (!(error instanceof AxiosError)) return null;
  return getRetryAfterSecondsFromHeaders(error.response?.headers);
};
