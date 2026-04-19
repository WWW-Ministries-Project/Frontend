import { ArrowPathIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  FormEvent,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthWrapper";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { AiStructuredMessage } from "@/pages/HomePage/pages/AI/components/AiStructuredMessage";
import { api, relativePath } from "@/utils";
import type {
  AiChatResponse,
  AiChatbotConfig,
  AiChatbotRequest,
  AiDisplay,
  AiProvider,
  AiRole,
} from "@/utils/api/ai/interfaces";
import { ApiError } from "@/utils/api/errors/ApiError";

type ChatEntry = {
  id: string;
  role: AiRole;
  content: string;
  createdAt: string;
  display?: AiDisplay;
  provider?: AiProvider;
  model?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  totalTokens?: number;
  latencyMs?: number;
};

type ParsedAiError = {
  statusCode?: number;
  message: string;
};

type PanelOffset = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const CHAT_MODULE_OPTIONS = [
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

const createIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const formatDateTime = (value?: string) => {
  if (!value) return "Now";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Now";
  return parsedDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatLatency = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return null;
  }

  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }

  return `${(value / 1000).toFixed(1)} s`;
};

const createEntry = (
  role: AiRole,
  content: string,
  options: Partial<Omit<ChatEntry, "role" | "content">> = {}
): ChatEntry => ({
  id:
    options.id ||
    `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  createdAt: options.createdAt || new Date().toISOString(),
  display: options.display,
  provider: options.provider,
  model: options.model,
  fallbackUsed: options.fallbackUsed,
  fallbackReason: options.fallbackReason,
  totalTokens: options.totalTokens,
  latencyMs: options.latencyMs,
});

const parseAiError = (error: unknown): ParsedAiError => {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unable to complete the AI request." };
};

const mapAssistantResponse = (response: AiChatResponse): ChatEntry =>
  createEntry("assistant", response.reply || "No response from AI service.", {
    id: response.message_id,
    createdAt: response.created_at,
    display: response.display,
    provider: response.provider,
    model: response.model,
    fallbackUsed: response.fallback_used,
    fallbackReason: response.fallback_reason,
    totalTokens: response.usage?.total_tokens,
    latencyMs: response.performance?.latency_ms,
  });

const buildIntroMessages = (config: AiChatbotConfig | null): ChatEntry[] => {
  if (!config) {
    return [
      createEntry(
        "assistant",
        "Admin AI assistant is loading. You can ask about operations, visitors, attendance, finance, and approvals."
      ),
    ];
  }

  const intro = [config.welcome_message, config.unavailable_reason]
    .filter((value) => typeof value === "string" && value.trim())
    .join("\n\n");

  return [
    createEntry(
      "assistant",
      intro ||
        "Ask for summaries, risks, follow-up actions, and structured data answers."
    ),
  ];
};

const DEFAULT_PANEL_OFFSET: PanelOffset = { x: 0, y: 0 };

export const AiChatbotWidget = () => {
  const { user } = useAuth();
  const { canManage, canView } = useAccessControl();
  const navigate = useNavigate();
  const location = useLocation();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const introHydratedRef = useRef(false);
  const dragStateRef = useRef<DragState | null>(null);
  const canViewAi = canView("AI");
  const canManageAi = canManage("AI");
  const shouldHideOnPage = location.pathname.startsWith(
    `${relativePath.home.main}/${relativePath.home.ai}`
  );

  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AiChatbotConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [selectedModule, setSelectedModule] = useState("operations");
  const [messages, setMessages] = useState<ChatEntry[]>(buildIntroMessages(null));
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [panelOffset, setPanelOffset] = useState<PanelOffset>(
    DEFAULT_PANEL_OFFSET
  );

  const clampPanelOffset = useCallback((nextOffset: PanelOffset) => {
    if (typeof window === "undefined") {
      return nextOffset;
    }

    const panelWidth = panelRef.current?.offsetWidth ?? 0;
    const panelHeight = panelRef.current?.offsetHeight ?? 0;
    const horizontalLimit = Math.max(window.innerWidth - panelWidth - 32, 0);
    const verticalLimit = Math.max(window.innerHeight - panelHeight - 32, 0);

    return {
      x: Math.min(0, Math.max(-horizontalLimit, nextOffset.x)),
      y: Math.min(0, Math.max(-verticalLimit, nextOffset.y)),
    };
  }, []);

  const endDrag = useCallback(
    (currentTarget?: HTMLDivElement | null, pointerId?: number) => {
      if (
        currentTarget &&
        typeof pointerId === "number" &&
        currentTarget.hasPointerCapture(pointerId)
      ) {
        currentTarget.releasePointerCapture(pointerId);
      }

      dragStateRef.current = null;
    },
    []
  );

  const handleDragStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("button, select, input, textarea, a, [role='button']")
      ) {
        return;
      }

      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: panelOffset.x,
        originY: panelOffset.y,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [panelOffset.x, panelOffset.y]
  );

  const handleDragMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      setPanelOffset(
        clampPanelOffset({
          x: dragState.originX + (event.clientX - dragState.startX),
          y: dragState.originY + (event.clientY - dragState.startY),
        })
      );
    },
    [clampPanelOffset]
  );

  const handleDragEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) {
        return;
      }

      endDrag(event.currentTarget, event.pointerId);
    },
    [endDrag]
  );

  const starterPrompts = useMemo(
    () => config?.suggested_prompts?.filter((item) => item.trim()) ?? [],
    [config?.suggested_prompts]
  );

  const defaultModelLabel = useMemo(() => {
    const label = config?.available_models?.[0]?.label?.trim();
    if (label) return label;
    return config?.default_model?.trim() || "Unavailable";
  }, [config?.available_models, config?.default_model]);

  const resetConversation = useCallback(
    (nextConfig: AiChatbotConfig | null = config) => {
      setConversationId(undefined);
      setChatError(null);
      setPrompt("");
      setMessages(buildIntroMessages(nextConfig));
    },
    [config]
  );

  useEffect(() => {
    if (!canViewAi || shouldHideOnPage) {
      return;
    }

    let isActive = true;

    const loadConfig = async () => {
      setIsLoadingConfig(true);
      setConfigError(null);

      try {
        const response = await api.fetch.fetchAiChatbotConfig();
        if (!isActive) return;

        const nextConfig = response.data;
        setConfig(nextConfig);
        setSelectedModule(nextConfig.default_context?.module?.trim() || "operations");

        if (!introHydratedRef.current) {
          setMessages(buildIntroMessages(nextConfig));
          introHydratedRef.current = true;
        }
      } catch (error) {
        if (!isActive) return;
        const parsedError = parseAiError(error);
        setConfigError(parsedError.message);
        setConfig({
          enabled: false,
          welcome_message: "Admin AI assistant could not be initialized.",
          unavailable_reason: parsedError.message,
          suggested_prompts: [],
          default_context: {
            module: "operations",
            scope: "admin",
          },
        });

        if (!introHydratedRef.current) {
          setMessages(
            buildIntroMessages({
              enabled: false,
              welcome_message: "Admin AI assistant could not be initialized.",
              unavailable_reason: parsedError.message,
              suggested_prompts: [],
              default_context: {
                module: "operations",
                scope: "admin",
              },
            })
          );
          introHydratedRef.current = true;
        }
      } finally {
        if (isActive) {
          setIsLoadingConfig(false);
        }
      }
    };

    void loadConfig();

    return () => {
      isActive = false;
    };
  }, [canViewAi, shouldHideOnPage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPanelOffset(DEFAULT_PANEL_OFFSET);
      return;
    }

    dragStateRef.current = null;
  }, [isOpen]);

  const sendPrompt = useCallback(
    async (messageText: string) => {
      const trimmedPrompt = messageText.trim();
      if (!trimmedPrompt || isSending || !canManageAi) {
        return;
      }

      setIsOpen(true);
      setChatError(null);
      setPrompt("");
      setMessages((previousValue) => [
        ...previousValue,
        createEntry("user", trimmedPrompt),
      ]);
      setIsSending(true);

      const payload: AiChatbotRequest = {
        message: trimmedPrompt,
        conversation_id: conversationId,
        context: {
          ...(config?.default_context ?? {}),
          module: selectedModule,
          scope: "admin",
        },
      };

      try {
        const response = await api.post.sendAiChatbotMessage(payload, {
          idempotencyKey: createIdempotencyKey(),
        });
        const responseData = response.data;
        setConversationId(responseData.conversation_id || conversationId);
        setMessages((previousValue) => [
          ...previousValue,
          mapAssistantResponse(responseData),
        ]);
      } catch (error) {
        const parsedError = parseAiError(error);
        setChatError(parsedError.message);
        setMessages((previousValue) => [
          ...previousValue,
          createEntry(
            "assistant",
            parsedError.message ||
              "AI request failed. Confirm the provider setup and try again."
          ),
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [
      canManageAi,
      config?.default_context,
      conversationId,
      isSending,
      selectedModule,
    ]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendPrompt(prompt);
  };

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    if (!isSending) {
      void sendPrompt(prompt);
    }
  };

  if (!canViewAi || shouldHideOnPage) {
    return null;
  }

  const isChatEnabled = Boolean(config?.enabled) && canManageAi;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[130] flex justify-end p-4 md:p-6">
      <div className="pointer-events-auto flex w-full max-w-[26rem] flex-col items-end gap-3">
        {isOpen ? (
          <section
            ref={panelRef}
            style={{
              transform: `translate(${panelOffset.x}px, ${panelOffset.y}px)`,
            }}
            className="flex w-full max-h-[calc(100dvh-var(--app-header-height,64px)-1rem)] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] md:max-h-[calc(100dvh-var(--app-header-height,64px)-2rem)]"
          >
            <div
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
              className="cursor-grab touch-none border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] px-4 py-4 text-white active:cursor-grabbing"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100">
                    Admin Assistant
                  </p>
                  <h2 className="mt-1 text-lg font-semibold leading-tight">
                    AI chatbot
                  </h2>
                  <p className="mt-1 text-xs text-blue-100">
                    {isLoadingConfig
                      ? "Loading assistant"
                      : canManageAi && isChatEnabled
                        ? defaultModelLabel
                        : canManageAi
                          ? "Setup required"
                          : "View only"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => resetConversation()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    title="Start a new chat"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    title="Close chatbot"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <label className="min-w-[9rem] flex-1 text-xs font-medium text-blue-100">
                  Focus area
                  <select
                    value={selectedModule}
                    onChange={(event) => setSelectedModule(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none backdrop-blur placeholder:text-blue-100"
                  >
                    {CHAT_MODULE_OPTIONS.map((moduleOption) => (
                      <option
                        key={moduleOption.value}
                        value={moduleOption.value}
                        className="text-slate-900"
                      >
                        {moduleOption.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => navigate(`${relativePath.home.main}/${relativePath.home.ai}`)}
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  Open AI console
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-4 py-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[88%] rounded-[1.25rem] rounded-br-md bg-primary px-4 py-3 text-sm text-white shadow-sm"
                        : "max-w-full rounded-[1.25rem] rounded-bl-md border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm"
                    }
                  >
                    {message.role === "assistant" ? (
                      <AiStructuredMessage
                        display={message.display}
                        fallbackText={message.content}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap leading-6">{message.content}</p>
                    )}

                    <div
                      className={`mt-2 text-[10px] ${
                        message.role === "user" ? "text-white/75" : "text-slate-500"
                      }`}
                    >
                      <span>{message.role === "user" ? "You" : formatDateTime(message.createdAt)}</span>
                      {message.role === "assistant" && message.model ? (
                        <span>{` • ${message.model}`}</span>
                      ) : null}
                      {formatLatency(message.latencyMs) ? (
                        <span>{` • ${formatLatency(message.latencyMs)}`}</span>
                      ) : null}
                      {message.fallbackUsed ? <span> • fallback used</span> : null}
                    </div>
                  </article>
                ))}

                {isChatEnabled && starterPrompts.length > 0 && messages.length <= 1 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Try asking
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {starterPrompts.map((starterPrompt) => (
                        <button
                          key={starterPrompt}
                          type="button"
                          onClick={() => {
                            void sendPrompt(starterPrompt);
                          }}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:border-primary hover:text-primary"
                        >
                          {starterPrompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {!canManageAi && messages.length <= 1 ? (
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-100 p-3 text-sm text-slate-700">
                    <p className="font-semibold">AI access is view-only</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      This access level can open the AI console, but sending
                      chatbot requests requires AI manage access.
                    </p>
                  </div>
                ) : null}

                {canManageAi && !isChatEnabled && messages.length <= 1 ? (
                  <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-semibold">AI setup required</p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Activate an OpenAI, Gemini, or Claude credential in AI Console,
                      then reopen this chatbot.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`${relativePath.home.main}/${relativePath.home.ai}`)}
                      className="mt-3 rounded-full border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
                    >
                      Open AI console
                    </button>
                  </div>
                ) : null}

                {isSending ? (
                  <div className="max-w-[75%] rounded-[1.25rem] rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    Thinking through the request...
                  </div>
                ) : null}

                <div ref={bottomRef} />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-4">
              {configError ? (
                <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {configError}
                </p>
              ) : null}

              {chatError ? (
                <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {chatError}
                </p>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-2">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={handlePromptKeyDown}
                  rows={3}
                  placeholder={
                      canManageAi && isChatEnabled
                        ? "Ask about records, approvals, trends, attendance, visitors, finance, or operational risks."
                        : canManageAi
                          ? "Enable an active AI credential in AI Console to start chatting."
                          : "AI manage access is required to send chatbot requests."
                    }
                    disabled={!canManageAi || !isChatEnabled || isSending}
                    className="w-full resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-2 pt-2">
                    <p className="text-[11px] text-slate-500">
                      Enter to send. Shift+Enter for a new line.
                    </p>

                    <button
                      type="submit"
                      disabled={
                        !canManageAi || !isChatEnabled || isSending || !prompt.trim()
                      }
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>
        ) : null}

        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(15,23,42,0.2)]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-sm font-semibold text-white">
              AI
            </span>
            <span className="hidden min-w-0 flex-col md:flex">
              <span className="text-sm font-semibold text-slate-900">
                Admin assistant
              </span>
              <span className="text-xs text-slate-500">
                {isLoadingConfig
                  ? "Preparing chatbot"
                  : canManageAi && isChatEnabled
                    ? "Ask without leaving this page"
                    : canManageAi
                      ? "Setup required"
                      : "View only"}
              </span>
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
