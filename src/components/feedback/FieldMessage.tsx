import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

interface FieldMessageProps {
  id?: string;
  /** "error" pairs an icon with the text so it doesn't rely on red alone. */
  tone?: "error" | "hint";
  children: ReactNode;
  className?: string;
}

/** A message under one input: how to fix it, or a hint. */
export const FieldMessage = ({
  id,
  tone = "error",
  children,
  className,
}: FieldMessageProps) => {
  if (tone === "hint") {
    return (
      <p id={id} className={cn("text-xs text-mainGray", className)}>
        {children}
      </p>
    );
  }

  return (
    <p
      id={id}
      className={cn("flex items-center gap-1 text-xs text-error", className)}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16v.5" />
      </svg>
      <span>{children}</span>
    </p>
  );
};
