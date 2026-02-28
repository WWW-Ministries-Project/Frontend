import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "@/utils/api/apiCalls";
import { ApiError } from "@/utils/api/errors/ApiError";
import type {
  AiChatRequest,
  AiChatResponse,
  AiCredentialRecord,
  AiInsightsRequest,
  AiProvider,
  AiRole,
  AiUsageHistoryPoint,
  AiUsageSnapshot,
  AiUsageSummary,
  CreateAiCredentialPayload,
  UpdateAiCredentialPayload,
} from "@/utils/api/ai/interfaces";

interface ChatEntry {
  id: string;
  role: AiRole;
  content: string;
  createdAt: string;
}

interface FailedAiRequest {
  payload: AiChatRequest;
  idempotencyKey: string;
}

interface ParsedAiError {
  statusCode?: number;
  message: string;
  usageSnapshot?: AiUsageSnapshot;
  resetAt?: string;
}

const USAGE_REFRESH_INTERVAL_MS = 60_000;
const USAGE_HISTORY_DAYS = 7;
const SESSION_EXPIRY_MARKERS = [
  "session expired",
  "token not found",
  "jwt expired",
  "token expired",
];

const AI_MODULE_OPTIONS = [
  { label: "Operations", value: "operations" },
  { label: "Visitors", value: "visitors" },
  { label: "Membership", value: "membership" },
  { label: "Attendance", value: "attendance" },
  { label: "Events", value: "events" },
  { label: "Requisition", value: "requisition" },
  { label: "Appointments", value: "appointments" },
  { label: "Marketplace", value: "marketplace" },
  { label: "Finance", value: "finance" },
];

const MODEL_OPTIONS: Array<{
  label: string;
  value: string;
  provider: AiProvider;
}> = [
  { label: "GPT-4.1 Mini", value: "gpt-4.1-mini", provider: "openai" },
  { label: "GPT-4.1", value: "gpt-4.1", provider: "openai" },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash", provider: "gemini" },
  { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash", provider: "gemini" },
  { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro", provider: "gemini" },
  {
    label: "Gemini 2.5 Flash Lite",
    value: "gemini-2.5-flash-lite",
    provider: "gemini",
  },
  {
    label: "Gemini 1.5 Flash (Latest)",
    value: "gemini-1.5-flash-latest",
    provider: "gemini",
  },
  { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro", provider: "gemini" },
];

const MODEL_PROVIDER_LOOKUP = MODEL_OPTIONS.reduce<Record<string, AiProvider>>(
  (acc, modelOption) => {
    acc[modelOption.value] = modelOption.provider;
    return acc;
  },
  {}
);

const createEntry = (role: AiRole, content: string): ChatEntry => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
});

const createIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const toLocalISODate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatCount = (value?: number) =>
  typeof value === "number" ? value.toLocaleString() : "--";

const formatDateTime = (value?: string) => {
  if (!value) return "Not available";
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return "Not available";
  return asDate.toLocaleString();
};

const shortId = (value: string) =>
  value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;

const getModelProvider = (model: string): AiProvider | null =>
  MODEL_PROVIDER_LOOKUP[model] ?? null;

const computeUsagePercent = (used?: number, limit?: number) => {
  if (
    typeof used !== "number" ||
    typeof limit !== "number" ||
    Number.isNaN(used) ||
    Number.isNaN(limit) ||
    limit <= 0
  ) {
    return 0;
  }

  return Math.min(100, Math.max(0, (used / limit) * 100));
};

const mergeUsageSnapshot = (
  previous: AiUsageSummary | null,
  snapshot?: AiUsageSnapshot
): AiUsageSummary | null => {
  if (!snapshot) return previous;
  return {
    ...(previous ?? {}),
    ...snapshot,
    updated_at: new Date().toISOString(),
  };
};

const mapAssistantResponse = (response: AiChatResponse): ChatEntry =>
  createEntry("assistant", response.reply || "No response from AI service.");

const isSessionExpiredMessage = (message: string) => {
  const normalizedMessage = message.trim().toLowerCase();
  if (!normalizedMessage) return false;

  return SESSION_EXPIRY_MARKERS.some((marker) =>
    normalizedMessage.includes(marker)
  );
};

const parseAiError = (error: unknown): ParsedAiError => {
  if (error instanceof ApiError) {
    const rawDetails =
      error.details && typeof error.details === "object"
        ? (error.details as Record<string, unknown>)
        : {};
    const nestedData =
      rawDetails.data && typeof rawDetails.data === "object"
        ? (rawDetails.data as Record<string, unknown>)
        : {};
    const usageSnapshot =
      (nestedData.usage_snapshot as AiUsageSnapshot | undefined) ??
      (rawDetails.usage_snapshot as AiUsageSnapshot | undefined);
    const resetAt =
      (nestedData.reset_at as string | undefined) ??
      (rawDetails.reset_at as string | undefined);

    return {
      statusCode: error.statusCode,
      message: error.message,
      usageSnapshot,
      resetAt,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unable to complete AI request." };
};

const usageMetrics = [
  {
    key: "messages-used",
    label: "Messages Used",
    value: (usage: AiUsageSummary | null) => formatCount(usage?.message_used),
  },
  {
    key: "messages-left",
    label: "Messages Left",
    value: (usage: AiUsageSummary | null) =>
      formatCount(usage?.message_remaining),
  },
  {
    key: "tokens-used",
    label: "Tokens Used",
    value: (usage: AiUsageSummary | null) => formatCount(usage?.token_used),
  },
  {
    key: "tokens-left",
    label: "Tokens Left",
    value: (usage: AiUsageSummary | null) => formatCount(usage?.token_remaining),
  },
];

const starterMessages: ChatEntry[] = [
  createEntry(
    "assistant",
    "Welcome to AI Console. Ask for operational insights, summaries, or risk flags."
  ),
];

export const AIConsole = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedModule, setSelectedModule] = useState("operations");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatEntry[]>(starterMessages);
  const [isSending, setIsSending] = useState(false);
  const [lastFailedRequest, setLastFailedRequest] =
    useState<FailedAiRequest | null>(null);

  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [usageHistory, setUsageHistory] = useState<AiUsageHistoryPoint[]>([]);

  const [chatError, setChatError] = useState<string | null>(null);
  const [chatResetAt, setChatResetAt] = useState<string | null>(null);

  const [provider, setProvider] = useState<AiProvider>("openai");
  const [credentials, setCredentials] = useState<AiCredentialRecord[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [credentialsInfo, setCredentialsInfo] = useState<string | null>(null);

  const [createCredentialForm, setCreateCredentialForm] = useState({
    apiKey: "",
    apiSecret: "",
    isActive: true,
  });

  const [selectedCredentialId, setSelectedCredentialId] =
    useState<string>("");
  const [updateCredentialForm, setUpdateCredentialForm] = useState({
    apiKey: "",
    apiSecret: "",
    isActive: true,
  });

  const [insightModule, setInsightModule] = useState("visitors");
  const [insightPrompt, setInsightPrompt] = useState("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const isMountedRef = useRef(false);
  const usageRequestInFlightRef = useRef(false);
  const usageHistoryRequestInFlightRef = useRef(false);

  const selectedCredential = useMemo(
    () => credentials.find((credential) => credential.id === selectedCredentialId),
    [credentials, selectedCredentialId]
  );
  const selectedModelProvider = useMemo(
    () => getModelProvider(selectedModel),
    [selectedModel]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshUsage = useCallback(async () => {
    if (usageRequestInFlightRef.current) return;
    usageRequestInFlightRef.current = true;
    if (isMountedRef.current) {
      setIsLoadingUsage(true);
      setUsageError(null);
    }

    try {
      const response = await api.fetch.fetchAiUsageSummary();
      if (!isMountedRef.current) return;
      setUsage(response.data ?? null);
    } catch (error) {
      if (!isMountedRef.current) return;
      const parsedError = parseAiError(error);
      setUsageError(parsedError.message);
    } finally {
      usageRequestInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsLoadingUsage(false);
      }
    }
  }, []);

  const refreshUsageHistory = useCallback(async () => {
    if (usageHistoryRequestInFlightRef.current) return;
    usageHistoryRequestInFlightRef.current = true;

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (USAGE_HISTORY_DAYS - 1));

    try {
      const response = await api.fetch.fetchAiUsageHistory({
        from: toLocalISODate(startDate),
        to: toLocalISODate(endDate),
        interval: "day",
      });
      if (!isMountedRef.current) return;
      setUsageHistory(response.data?.points ?? []);
    } catch {
      if (isMountedRef.current) {
        setUsageHistory([]);
      }
    } finally {
      usageHistoryRequestInFlightRef.current = false;
    }
  }, []);

  const refreshCredentials = useCallback(
    async (nextProvider: AiProvider) => {
      setIsLoadingCredentials(true);
      setCredentialsError(null);

      try {
        const response = await api.fetch.fetchAiCredentials({
          provider: nextProvider,
        });
        const fetchedCredentials = response.data ?? [];
        setCredentials(fetchedCredentials);

        if (!selectedCredentialId && fetchedCredentials.length > 0) {
          setSelectedCredentialId(fetchedCredentials[0].id);
          setUpdateCredentialForm((previousValue) => ({
            ...previousValue,
            isActive: fetchedCredentials[0].is_active,
          }));
        }
      } catch (error) {
        const parsedError = parseAiError(error);
        setCredentialsError(parsedError.message);
        setCredentials([]);
      } finally {
        setIsLoadingCredentials(false);
      }
    },
    [selectedCredentialId]
  );

  const ensureActiveCredentialForModel = useCallback(
    async (model: string) => {
      const modelProvider = getModelProvider(model);
      if (!modelProvider) {
        return {
          ok: false,
          message: "Selected model is not supported. Choose a valid model.",
        };
      }

      try {
        const response = await api.fetch.fetchAiCredentials({
          provider: modelProvider,
        });
        const providerCredentials = response.data ?? [];
        const hasActiveCredential = providerCredentials.some(
          (credential) => credential.is_active
        );

        if (!hasActiveCredential) {
          return {
            ok: false,
            message: `Selected model requires an active ${modelProvider.toUpperCase()} credential.`,
          };
        }

        return { ok: true, provider: modelProvider };
      } catch (error) {
        const parsedError = parseAiError(error);
        return {
          ok: false,
          message:
            parsedError.message ||
            "Unable to validate model credential status.",
        };
      }
    },
    []
  );

  useEffect(() => {
    void refreshUsage();
    void refreshUsageHistory();
  }, [refreshUsage, refreshUsageHistory]);

  useEffect(() => {
    void refreshCredentials(provider);
  }, [provider, refreshCredentials]);

  useEffect(() => {
    let timeoutId: number | null = null;
    let stopped = false;

    const isPageActive = () =>
      document.visibilityState === "visible" && document.hasFocus();

    const pollUsage = async () => {
      if (stopped) return;
      if (isPageActive()) {
        await refreshUsage();
      }
      if (stopped) return;
      timeoutId = window.setTimeout(() => {
        void pollUsage();
      }, USAGE_REFRESH_INTERVAL_MS);
    };

    const syncOnForeground = () => {
      if (!isPageActive()) return;
      void refreshUsage();
      void refreshUsageHistory();
    };

    timeoutId = window.setTimeout(() => {
      void pollUsage();
    }, USAGE_REFRESH_INTERVAL_MS);

    window.addEventListener("focus", syncOnForeground);
    document.addEventListener("visibilitychange", syncOnForeground);

    return () => {
      stopped = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener("focus", syncOnForeground);
      document.removeEventListener("visibilitychange", syncOnForeground);
    };
  }, [refreshUsage, refreshUsageHistory]);

  useEffect(() => {
    if (!selectedCredential) return;
    setUpdateCredentialForm((previousValue) => ({
      ...previousValue,
      isActive: selectedCredential.is_active,
    }));
  }, [selectedCredential]);

  const updateUsageFromError = (parsedError: ParsedAiError) => {
    if (parsedError.usageSnapshot) {
      setUsage((previousValue) =>
        mergeUsageSnapshot(previousValue, parsedError.usageSnapshot)
      );
    }
    setChatResetAt(parsedError.resetAt ?? null);
  };

  const submitChatRequest = async (
    payload: AiChatRequest,
    idempotencyKey: string
  ) => {
    setIsSending(true);
    setChatError(null);
    setChatResetAt(null);

    try {
      const response = await api.post.sendAiMessage(payload, { idempotencyKey });
      const responseData = response.data;
      setConversationId(responseData.conversation_id || conversationId);
      setMessages((previousValue) => [
        ...previousValue,
        mapAssistantResponse(responseData),
      ]);
      setUsage((previousValue) =>
        mergeUsageSnapshot(previousValue, responseData.usage_snapshot)
      );
      setLastFailedRequest(null);
      await Promise.all([refreshUsage(), refreshUsageHistory()]);
    } catch (error) {
      const parsedError = parseAiError(error);
      updateUsageFromError(parsedError);

      if (parsedError.statusCode === 409) {
        setChatError(
          "Idempotency key conflict detected. Submit again with a new message payload."
        );
        setLastFailedRequest(null);
      } else if (parsedError.statusCode === 429) {
        setChatError(
          parsedError.message || "AI quota exceeded. Please wait for reset."
        );
        setLastFailedRequest({ payload, idempotencyKey });
      } else if (parsedError.statusCode === 401) {
        setChatError(
          isSessionExpiredMessage(parsedError.message)
            ? "Session expired. Please sign in again."
            : "Access denied for this AI action."
        );
        setLastFailedRequest({ payload, idempotencyKey });
      } else {
        setChatError(parsedError.message || "Unable to complete AI request.");
        setLastFailedRequest({ payload, idempotencyKey });
      }

      setMessages((previousValue) => [
        ...previousValue,
        createEntry(
          "assistant",
          "AI request failed. Confirm credentials/access and retry."
        ),
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const onSubmitPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isSending) return;

    if (!selectedModel.trim()) {
      setChatError("Model selection is required.");
      return;
    }

    const credentialCheck = await ensureActiveCredentialForModel(selectedModel);
    if (!credentialCheck.ok) {
      setChatError(credentialCheck.message);
      return;
    }

    const requestPayload: AiChatRequest = {
      message: trimmedPrompt,
      model: selectedModel,
      conversation_id: conversationId,
      context: {
        module: selectedModule,
        scope: "admin",
      },
    };

    const idempotencyKey = createIdempotencyKey();
    setPrompt("");
    setMessages((previousValue) => [
      ...previousValue,
      createEntry("user", trimmedPrompt),
    ]);

    await submitChatRequest(requestPayload, idempotencyKey);
  };

  const onRetryLastFailedRequest = async () => {
    if (!lastFailedRequest || isSending) return;
    await submitChatRequest(
      lastFailedRequest.payload,
      lastFailedRequest.idempotencyKey
    );
  };

  const onRunInsights = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isGeneratingInsight) return;

    setInsightError(null);
    setIsGeneratingInsight(true);

    if (!selectedModel.trim()) {
      setInsightError("Model selection is required.");
      setIsGeneratingInsight(false);
      return;
    }

    const credentialCheck = await ensureActiveCredentialForModel(selectedModel);
    if (!credentialCheck.ok) {
      setInsightError(credentialCheck.message);
      setIsGeneratingInsight(false);
      return;
    }

    const trimmedInsightPrompt = insightPrompt.trim();
    const payload: AiInsightsRequest = {
      model: selectedModel,
      message: trimmedInsightPrompt || undefined,
      context: {
        module: insightModule,
        scope: "admin",
      },
    };

    try {
      const response = await api.post.createAiInsights(insightModule, payload);
      const responseData = response.data;
      setMessages((previousValue) => [
        ...previousValue,
        createEntry(
          "assistant",
          `[Insight:${insightModule}] ${responseData.reply || "No insight returned."}`
        ),
      ]);
      setUsage((previousValue) =>
        mergeUsageSnapshot(previousValue, responseData.usage_snapshot)
      );
      await Promise.all([refreshUsage(), refreshUsageHistory()]);
    } catch (error) {
      const parsedError = parseAiError(error);
      updateUsageFromError(parsedError);
      setInsightError(parsedError.message);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const onCreateCredential = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: CreateAiCredentialPayload = {
      provider,
      api_key: createCredentialForm.apiKey.trim(),
      api_secret: createCredentialForm.apiSecret.trim() || null,
      is_active: createCredentialForm.isActive,
    };

    if (!payload.api_key) {
      setCredentialsError("API key is required.");
      return;
    }

    setCredentialsError(null);
    setCredentialsInfo(null);

    try {
      const response = await api.post.createAiCredential(payload);
      setCredentialsInfo(
        `Credential created for ${response.data.provider}. Secret is stored securely.`
      );
      setCreateCredentialForm({
        apiKey: "",
        apiSecret: "",
        isActive: true,
      });
      await refreshCredentials(provider);
    } catch (error) {
      const parsedError = parseAiError(error);
      setCredentialsError(parsedError.message);
    }
  };

  const onUpdateCredential = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCredential) {
      setCredentialsError("Select a credential to update.");
      return;
    }

    const nextKey = updateCredentialForm.apiKey.trim();
    const nextSecret = updateCredentialForm.apiSecret.trim();
    const statusChanged = updateCredentialForm.isActive !== selectedCredential.is_active;

    if (!nextKey && !nextSecret && !statusChanged) {
      setCredentialsError("No changes to update.");
      return;
    }

    const payload: UpdateAiCredentialPayload = {
      is_active: updateCredentialForm.isActive,
    };

    if (nextKey) payload.api_key = nextKey;
    if (nextSecret) payload.api_secret = nextSecret;

    setCredentialsError(null);
    setCredentialsInfo(null);

    try {
      await api.put.updateAiCredential(selectedCredential.id, payload);
      setCredentialsInfo("Credential updated successfully.");
      setUpdateCredentialForm((previousValue) => ({
        ...previousValue,
        apiKey: "",
        apiSecret: "",
      }));
      await refreshCredentials(provider);
    } catch (error) {
      const parsedError = parseAiError(error);
      setCredentialsError(parsedError.message);
    }
  };

  const messageUsagePercent = useMemo(
    () => computeUsagePercent(usage?.message_used, usage?.message_limit),
    [usage?.message_used, usage?.message_limit]
  );

  const tokenUsagePercent = useMemo(
    () => computeUsagePercent(usage?.token_used, usage?.token_limit),
    [usage?.token_used, usage?.token_limit]
  );

  const usageHistoryRows = useMemo(
    () => [...usageHistory].reverse().slice(0, USAGE_HISTORY_DAYS),
    [usageHistory]
  );

  return (
    <section className="p-4 md:p-6">
      <div className="rounded-xl border border-gray-100 bg-white p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">AI Console</h1>
            <p className="mt-1 text-sm text-gray-600">
              Admin AI entry point for assistant workflows, provider setup, and
              usage monitoring.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void refreshUsage();
                void refreshUsageHistory();
              }}
              className="rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              {isLoadingUsage ? "Refreshing..." : "Refresh usage"}
            </button>
            <button
              type="button"
              onClick={() => void refreshCredentials(provider)}
              className="rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              {isLoadingCredentials ? "Loading..." : "Refresh setup"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-lightGray/40 p-4">
              <h2 className="text-lg font-semibold text-primary">AI Assistant</h2>
              <p className="mt-1 text-xs text-gray-600">
                Chat requests use `Idempotency-Key` for safe retries and quota protection.
              </p>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <label className="text-xs font-semibold text-gray-600">
                  Model (required)
                  <select
                    value={selectedModel}
                    onChange={(event) => setSelectedModel(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    required
                  >
                    {MODEL_OPTIONS.map((modelOption) => (
                      <option key={modelOption.value} value={modelOption.value}>
                        {modelOption.label} ({modelOption.provider})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-gray-600">
                  Module context
                  <select
                    value={selectedModule}
                    onChange={(event) => setSelectedModule(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  >
                    {AI_MODULE_OPTIONS.map((moduleOption) => (
                      <option key={moduleOption.value} value={moduleOption.value}>
                        {moduleOption.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Selected model provider:{" "}
                <span className="font-semibold">
                  {selectedModelProvider
                    ? selectedModelProvider.toUpperCase()
                    : "Unknown"}
                </span>
                . An active credential for this provider is required.
              </p>

              <div className="mt-4 h-80 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[92%] rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "ml-auto bg-primary text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              <form onSubmit={onSubmitPrompt} className="mt-3 space-y-2">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ask AI for operational insight..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-primary"
                />

                {chatError && (
                  <p className="text-xs text-red-600">
                    Request error: {chatError}
                    {chatResetAt ? ` (resets: ${formatDateTime(chatResetAt)})` : ""}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  {lastFailedRequest && (
                    <button
                      type="button"
                      onClick={() => void onRetryLastFailedRequest()}
                      disabled={isSending}
                      className="rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Retry failed send
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSending || !prompt.trim()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <h3 className="text-sm font-semibold text-primary">
                Quick Insights
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                Generate module-level summaries using `/ai/insights/{'{module}'}`.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Uses selected model: <span className="font-semibold">{selectedModel}</span>
              </p>
              <form onSubmit={onRunInsights} className="mt-3 space-y-2">
                <div className="grid gap-2 md:grid-cols-[180px_1fr]">
                  <select
                    value={insightModule}
                    onChange={(event) => setInsightModule(event.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-2 text-sm"
                  >
                    {AI_MODULE_OPTIONS.filter((moduleOption) =>
                      moduleOption.value !== "operations"
                    ).map((moduleOption) => (
                      <option key={moduleOption.value} value={moduleOption.value}>
                        {moduleOption.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={insightPrompt}
                    onChange={(event) => setInsightPrompt(event.target.value)}
                    placeholder="Optional focus: conversion, overdue follow-ups..."
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                {insightError && (
                  <p className="text-xs text-red-600">{insightError}</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isGeneratingInsight}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingInsight ? "Running..." : "Run insight"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <h2 className="text-lg font-semibold text-primary">
                Usage and Quota
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                Tokens and message balance for current usage window.
              </p>

              {usageError && (
                <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                  {usageError}
                </p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                {usageMetrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="rounded-md border border-gray-200 px-2 py-3"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">
                      {metric.label}
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      {metric.value(usage)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-600">
                    <span>Message utilization</span>
                    <span>{messageUsagePercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${messageUsagePercent}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-600">
                    <span>Token utilization</span>
                    <span>{tokenUsagePercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-secondary"
                      style={{ width: `${tokenUsagePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-gray-500">
                Last updated: {formatDateTime(usage?.updated_at)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <h3 className="text-sm font-semibold text-primary">
                {`Usage History (Last ${USAGE_HISTORY_DAYS} Days)`}
              </h3>
              <div className="mt-2 space-y-2">
                {usageHistoryRows.length === 0 && (
                  <p className="text-xs text-gray-500">No usage points yet.</p>
                )}
                {usageHistoryRows.map((point) => (
                  <div
                    key={`${point.date}-${point.total_tokens}-${point.message_count}`}
                    className="rounded-md border border-gray-200 px-2 py-2 text-xs"
                  >
                    <div className="font-semibold text-primary">{point.date}</div>
                    <div className="text-gray-600">
                      Messages: {formatCount(point.message_count)} | Tokens:{" "}
                      {formatCount(point.total_tokens)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <h3 className="text-sm font-semibold text-primary">
                Provider Setup
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                Manage encrypted provider credentials (keys are never returned).
              </p>

              <div className="mt-3 flex gap-2">
                {(["openai", "gemini"] as AiProvider[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setProvider(item)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      provider === item
                        ? "bg-primary text-white"
                        : "border border-gray-300 text-primary"
                    }`}
                  >
                    {item.toUpperCase()}
                  </button>
                ))}
              </div>

              {credentialsError && (
                <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                  {credentialsError}
                </p>
              )}
              {credentialsInfo && (
                <p className="mt-2 rounded-md bg-green-50 px-2 py-1 text-xs text-green-700">
                  {credentialsInfo}
                </p>
              )}

              <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-2">
                {credentials.length === 0 && (
                  <p className="text-xs text-gray-500">
                    {isLoadingCredentials
                      ? "Loading credentials..."
                      : "No credentials configured for this provider."}
                  </p>
                )}
                {credentials.map((credential) => (
                  <button
                    key={credential.id}
                    type="button"
                    onClick={() => setSelectedCredentialId(credential.id)}
                    className={`block w-full rounded-md border px-2 py-2 text-left text-xs ${
                      selectedCredentialId === credential.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="font-semibold text-primary">
                      {shortId(credential.id)}
                    </div>
                    <div className="text-gray-600">
                      Active: {credential.is_active ? "Yes" : "No"} | Has
                      Secret: {credential.has_secret ? "Yes" : "No"}
                    </div>
                    <div className="text-gray-500">
                      Rotated: {formatDateTime(credential.rotated_at)}
                    </div>
                  </button>
                ))}
              </div>

              <form onSubmit={onCreateCredential} className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-primary">
                  Create credential
                </p>
                <input
                  type="password"
                  value={createCredentialForm.apiKey}
                  onChange={(event) =>
                    setCreateCredentialForm((previousValue) => ({
                      ...previousValue,
                      apiKey: event.target.value,
                    }))
                  }
                  placeholder="API key"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs"
                />
                <input
                  type="password"
                  value={createCredentialForm.apiSecret}
                  onChange={(event) =>
                    setCreateCredentialForm((previousValue) => ({
                      ...previousValue,
                      apiSecret: event.target.value,
                    }))
                  }
                  placeholder="API secret (optional)"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs"
                />
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={createCredentialForm.isActive}
                    onChange={(event) =>
                      setCreateCredentialForm((previousValue) => ({
                        ...previousValue,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Set as active
                </label>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white"
                >
                  Save credential
                </button>
              </form>

              <form onSubmit={onUpdateCredential} className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-primary">
                  Update selected credential
                </p>
                <input
                  type="password"
                  value={updateCredentialForm.apiKey}
                  onChange={(event) =>
                    setUpdateCredentialForm((previousValue) => ({
                      ...previousValue,
                      apiKey: event.target.value,
                    }))
                  }
                  placeholder="New API key (optional)"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs"
                />
                <input
                  type="password"
                  value={updateCredentialForm.apiSecret}
                  onChange={(event) =>
                    setUpdateCredentialForm((previousValue) => ({
                      ...previousValue,
                      apiSecret: event.target.value,
                    }))
                  }
                  placeholder="New API secret (optional)"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs"
                />
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={updateCredentialForm.isActive}
                    onChange={(event) =>
                      setUpdateCredentialForm((previousValue) => ({
                        ...previousValue,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Active
                </label>
                <button
                  type="submit"
                  disabled={!selectedCredential}
                  className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Update credential
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
