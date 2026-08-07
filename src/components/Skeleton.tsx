import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
}

/**
 * Generic pulsing placeholder block. Compose multiple instances to build
 * loading states for cards, lists, and detail pages instead of hand-rolling
 * `animate-pulse` divs inline in each screen.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      aria-hidden="true"
    />
  );
}
