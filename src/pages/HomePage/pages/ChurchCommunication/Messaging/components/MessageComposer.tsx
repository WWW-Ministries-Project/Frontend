import { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type {
  MessagePreview,
  PlaceholderInfo,
  PlaceholderKind,
} from "@/utils/api/messaging/interfaces";

interface MessageComposerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind: PlaceholderKind;
  preview: MessagePreview | null;
  /** Show the SMS counter (only when SMS is a chosen channel). */
  showSmsCounter: boolean;
  disabled?: boolean;
  rows?: number;
}

/** Message textarea with click-to-insert placeholder chips, a live SMS
 *  counter and inline errors for placeholders the server does not know. */
export const MessageComposer = ({
  id,
  label,
  value,
  onChange,
  kind,
  preview,
  showSmsCounter,
  disabled,
  rows = 5,
}: MessageComposerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);

  // Plain fetch (not useFetch): useFetch toggles the full-screen loader.
  useEffect(() => {
    let cancelled = false;
    api.fetch
      .fetchMessagePlaceholders({ kind })
      .then((response) => {
        if (!cancelled) setPlaceholders(response.data ?? []);
      })
      .catch(() => {
        // Chips are optional; typing still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const insert = (token: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const unknown = preview?.unknownPlaceholders ?? [];

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-primary">
        {label}
      </label>
      {!disabled && placeholders.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Insert placeholder">
          {placeholders.map((p) => (
            <button
              key={p.token}
              type="button"
              title={p.description}
              onClick={() => insert(p.token)}
              className="rounded-full border border-lightGray px-3 py-1 text-xs text-primary hover:bg-lightGray"
            >
              {p.token}
            </button>
          ))}
        </div>
      )}
      <textarea
        id={id}
        ref={textareaRef}
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-lightGray p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-lightGray/40"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-red-600" role="alert">
          {unknown.length > 0 &&
            `Unknown placeholder${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}`}
        </span>
        {showSmsCounter && preview && (
          <span className="text-gray-500">
            {preview.sms.length} chars · {preview.sms.segments} SMS
            {preview.sms.unicode ? " (special characters)" : ""}
          </span>
        )}
      </div>
    </div>
  );
};
