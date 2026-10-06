import {
  EllipsisHorizontalIcon,
  EyeSlashIcon,
  FlagIcon,
  NoSymbolIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

interface ContentOptionsMenuProps {
  noun: "post" | "comment";
  /** Own content: only Delete is offered. */
  isMine: boolean;
  /** Community managers may delete anyone's content as well. */
  canDelete: boolean;
  /** "Sarah" or "this author". */
  blockName: string;
  onDelete: () => void;
  onReport: () => void;
  onHide: () => void;
  onBlock: () => void;
  size?: "sm" | "md";
}

interface Option {
  key: string;
  label: string;
  sub: string;
  icon: typeof TrashIcon;
  danger?: boolean;
  onSelect: () => void;
}

export const ContentOptionsMenu = ({
  noun,
  isMine,
  canDelete,
  blockName,
  onDelete,
  onReport,
  onHide,
  onBlock,
  size = "md",
}: ContentOptionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const deleteOption: Option = {
    key: "delete",
    label: `Delete ${noun}`,
    sub: "Removes it for everyone",
    icon: TrashIcon,
    danger: true,
    onSelect: onDelete,
  };

  const options: Option[] = isMine
    ? [deleteOption]
    : [
        {
          key: "report",
          label: `Report ${noun}`,
          sub: "Sent confidentially to moderators",
          icon: FlagIcon,
          danger: true,
          onSelect: onReport,
        },
        {
          key: "hide",
          label: `Hide ${noun}`,
          sub: "You won't see it again",
          icon: EyeSlashIcon,
          onSelect: onHide,
        },
        {
          key: "block",
          label: `Block ${blockName}`,
          sub: "Hide everything they share",
          icon: NoSymbolIcon,
          onSelect: onBlock,
        },
        ...(canDelete ? [deleteOption] : []),
      ];

  return (
    <div ref={rootRef} className="relative flex-none">
      <button
        type="button"
        aria-label={`More options for this ${noun}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-primaryGray hover:bg-lightGray/50",
          size === "sm" ? "h-7 w-7" : "h-9 w-9"
        )}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-64 overflow-hidden rounded-xl border border-lightGray bg-white py-1 shadow-xl"
        >
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                option.onSelect();
              }}
              className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-lightGray/30"
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg",
                  option.danger
                    ? "bg-rose-50 text-rose-600"
                    : "bg-lightGray/50 text-primary"
                )}
              >
                <option.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    option.danger ? "text-rose-700" : "text-primary"
                  )}
                >
                  {option.label}
                </span>
                <span className="block text-xs text-primaryGray">
                  {option.sub}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
