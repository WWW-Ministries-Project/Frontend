import { FormEvent, useEffect, useRef } from "react";

import { AiStructuredMessage } from "@/pages/HomePage/pages/AI/components/AiStructuredMessage";
import { useAssistantStore } from "@/store/assistantStore";
import { api } from "@/utils";
import type { AiChatbotRequest } from "@/utils/api/ai/interfaces";
import { ApiError } from "@/utils/api/errors/ApiError";
import { notify } from "@/components/feedback";

const SUGGESTIONS = [
  "What needs my attention today?",
  "Draft a welcome message for new visitors",
  "Summarise this week's visitors",
  "Generate the October executive report",
];

const createIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// Shown only when the model is unavailable or returns nothing. We never
// fabricate an answer: say what happened and where to look.
const UNAVAILABLE_REPLY =
  "I couldn't get a response just now. The assistant may be unavailable — check the provider setup in AI Console, then try again.";

export const AskTab = () => {
  const { msgs, draft, busy, conversationId, setDraft, pushMsg, setBusy, setConversationId } =
    useAssistantStore();
  const bodyEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bodyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, busy]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;

    pushMsg({ role: "user", text: message });
    setDraft("");
    setBusy(true);

    // Open-ended chat: no module/page context is sent. The model decides which
    // data to fetch via its tools, and conversation history is threaded
    // server-side from conversation_id. We only pass the access scope.
    const payload: AiChatbotRequest = {
      message,
      conversation_id: conversationId,
      context: { scope: "admin" },
    };

    try {
      const res = await api.post.sendAiChatbotMessage(payload, {
        idempotencyKey: createIdempotencyKey(),
      });
      const data = res.data;
      if (data.conversation_id) setConversationId(data.conversation_id);
      const reply = (data.reply || "").trim();
      pushMsg({
        role: "ai",
        text: reply || UNAVAILABLE_REPLY,
        display: reply ? data.display : undefined,
      });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 429) {
        notify.warning({
          title: "AI quota reached",
          message: "You've hit the monthly assistant limit. Try again after it resets.",
        });
        pushMsg({
          role: "ai",
          text: "You've reached the monthly assistant limit. Try again after it resets.",
        });
      } else {
        pushMsg({ role: "ai", text: UNAVAILABLE_REPLY });
      }
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(draft);
  };

  const empty = msgs.length === 0 && !busy;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {empty ? (
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-[#080D2D]">Ask about your work</p>
              <p className="text-sm text-gray-600">
                I can see what your role can see. I’ll always ask before sending anything.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => void send(label)}
                  className="rounded-lg border border-[#D8DAE5] bg-white px-3.5 py-2.5 text-left text-sm text-[#080D2D] transition hover:border-[#080D2D] hover:bg-[#F8F9FC]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {msgs.map((message, index) =>
          message.role === "user" ? (
            <div
              key={index}
              className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-[12px] rounded-br-[4px] bg-[#080D2D] px-3.5 py-2.5 text-sm text-white"
            >
              {message.text}
            </div>
          ) : (
            <div key={index} className="flex max-w-[92%] gap-2">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#080D2D] text-white">
                <BotMark />
              </span>
              <div className="min-w-0 rounded-[12px] rounded-bl-[4px] border border-gray-200 bg-[#F8F9FC] px-3.5 py-2.5 text-sm text-[#080D2D]">
                <AiStructuredMessage display={message.display} fallbackText={message.text} />
              </div>
            </div>
          )
        )}

        {busy ? <p className="pl-9 text-sm text-gray-500">Thinking…</p> : null}
        <div ref={bodyEndRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-shrink-0 flex-col gap-2 border-t border-gray-200 bg-white px-5 pb-4 pt-3"
      >
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask anything about your tasks…"
            aria-label="Message the assistant"
            className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-[#080D2D] outline-none focus:border-[#080D2D] focus:shadow-[0_0_0_4px_rgba(8,13,45,0.08)]"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || busy}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#080D2D] text-white transition hover:bg-[#080D2D]/90 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12l16-8-6 16-2-7z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500">Answers can be wrong. Check figures before you act on them.</p>
      </form>
    </div>
  );
};

const BotMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
  </svg>
);
