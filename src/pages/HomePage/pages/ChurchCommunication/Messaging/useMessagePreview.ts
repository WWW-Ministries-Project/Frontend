import { useEffect, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import type {
  MessagePreview,
  PlaceholderKind,
} from "@/utils/api/messaging/interfaces";

const DEBOUNCE_MS = 400;

/** Server-rendered preview of a message: text with placeholders filled for a
 *  sample person, SMS length/segments, and unknown placeholders. The server
 *  owns the rules so the dashboard never drifts from what is actually sent. */
export const useMessagePreview = (args: {
  body: string;
  subject?: string | null;
  kind: PlaceholderKind;
  includeAppLink?: boolean;
}) => {
  const [preview, setPreview] = useState<MessagePreview | null>(null);
  const { body, subject, kind, includeAppLink } = args;

  useEffect(() => {
    if (!body.trim()) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await api.post.previewMessage({
          body,
          subject: subject ?? null,
          kind,
          includeAppLink,
        });
        if (!cancelled) setPreview(response.data);
      } catch {
        // Preview is best-effort; save-time validation is authoritative.
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [body, subject, kind, includeAppLink]);

  return preview;
};
