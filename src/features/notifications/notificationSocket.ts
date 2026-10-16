import { io, type Socket } from "socket.io-client";

/**
 * One socket.io connection to the backend realtime server. Transport only: it
 * reports status, forwards every server event and flags auth rejections; the
 * connector decides what they mean. Contract: Backend docs/REALTIME_EVENTS.md.
 */

export type RealtimeStatus = "connected" | "disconnected";
export type RealtimeEvent = { name: string; body: Record<string, unknown> };

type OpenNotificationSocketOptions = {
  origin: string;
  token: string;
  onEvent: (event: RealtimeEvent) => void;
  onStatus: (status: RealtimeStatus, info: { recovered: boolean }) => void;
  onFatal: (code: string) => void;
};

/** The server rejected the session itself; reconnecting cannot help. */
const FATAL_CODES = new Set([
  "TOKEN_MISSING",
  "TOKEN_INVALID",
  "TOKEN_EXPIRED",
  "ACCOUNT_INACTIVE",
]);

const MANUAL_RETRY_BASE_MS = 2_000;
const MANUAL_RETRY_MAX_MS = 60_000;

const toBody = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const readErrorCode = (error: unknown): string => {
  const code = (error as { data?: { code?: unknown } } | null)?.data?.code;
  return typeof code === "string" ? code : "";
};

export const openNotificationSocket = ({
  origin,
  token,
  onEvent,
  onStatus,
  onFatal,
}: OpenNotificationSocketOptions): { close: () => void } => {
  let closed = false;
  let manualRetryTimer: number | null = null;
  let manualRetryAttempts = 0;

  const socket: Socket = io(origin, {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
  });

  const clearManualRetry = () => {
    if (manualRetryTimer === null) return;
    window.clearTimeout(manualRetryTimer);
    manualRetryTimer = null;
  };

  // socket.io-client does not retry after the server refused the handshake
  // (SERVER_ERROR) or closed the socket itself; schedule it here.
  const scheduleManualRetry = () => {
    if (closed || manualRetryTimer !== null) return;
    const delay =
      Math.min(MANUAL_RETRY_MAX_MS, MANUAL_RETRY_BASE_MS * 2 ** manualRetryAttempts) +
      Math.floor(Math.random() * 1_000);
    manualRetryAttempts += 1;
    manualRetryTimer = window.setTimeout(() => {
      manualRetryTimer = null;
      if (!closed) socket.connect();
    }, delay);
  };

  socket.on("connect", () => {
    if (closed) return;
    manualRetryAttempts = 0;
    clearManualRetry();
    onStatus("connected", { recovered: socket.recovered });
  });

  socket.on("disconnect", (reason) => {
    if (closed) return;
    onStatus("disconnected", { recovered: false });
    if (reason === "io server disconnect") scheduleManualRetry();
  });

  socket.on("connect_error", (error) => {
    if (closed) return;
    const code = readErrorCode(error);
    if (FATAL_CODES.has(code)) {
      closed = true;
      clearManualRetry();
      socket.disconnect();
      onFatal(code);
      return;
    }
    onStatus("disconnected", { recovered: false });
    if (!socket.active) scheduleManualRetry();
  });

  socket.onAny((name: string, body: unknown) => {
    if (closed) return;
    onEvent({ name, body: toBody(body) });
  });

  return {
    close: () => {
      closed = true;
      clearManualRetry();
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
};
