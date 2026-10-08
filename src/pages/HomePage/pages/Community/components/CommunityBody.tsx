import { useMemo } from "react";
import { cn } from "@/utils/cn";
import { communityBodyToHtml, isCommunityHtml } from "../utils/communityBody";

const LINE_CLAMP = {
  2: "line-clamp-2",
  3: "line-clamp-3",
  5: "line-clamp-5",
} as const;

/** Element styles for rich-text bodies, scoped to this container. */
const RICH_TEXT_CLASSES = cn(
  "[&_p]:my-0 [&_p+p]:mt-2",
  "[&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold",
  "[&_h3]:font-semibold [&_h4]:font-semibold [&_h5]:font-semibold [&_h6]:font-semibold",
  "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_blockquote]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-lightGray [&_blockquote]:pl-3 [&_blockquote]:text-primaryGray",
  "[&_code]:rounded [&_code]:bg-lightGray/50 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em]",
  "[&_pre]:my-1 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:rounded-lg [&_pre]:bg-lightGray/50 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[0.9em]",
  "[&_a]:text-blue-600 [&_a]:underline"
);

interface CommunityBodyProps {
  body: string | null | undefined;
  /** Clamp to this many lines (list previews). */
  lines?: keyof typeof LINE_CLAMP;
  /** Render links as text — use when the body sits inside a clickable card. */
  inertLinks?: boolean;
  className?: string;
}

/**
 * Renders a community post/comment body: sanitized rich text from the mobile
 * editor, or legacy plain text with newlines preserved.
 */
export const CommunityBody = ({
  body,
  lines,
  inertLinks = false,
  className,
}: CommunityBodyProps) => {
  const html = useMemo(
    () => communityBodyToHtml(body, { inertLinks }),
    [body, inertLinks]
  );
  const clamp = lines ? LINE_CLAMP[lines] : undefined;

  if (body && isCommunityHtml(body)) {
    return (
      <div
        className={cn("break-words", RICH_TEXT_CLASSES, clamp, className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className={cn("whitespace-pre-line break-words", clamp, className)}>
      {body ?? ""}
    </div>
  );
};
