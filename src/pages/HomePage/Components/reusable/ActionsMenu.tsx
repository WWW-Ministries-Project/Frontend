import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface IActionsMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  variant?: "default" | "danger";
}

interface IProps {
  actions: IActionsMenuItem[];
}

/**
 * Generic "..." row-actions dropdown. Portals the menu into document.body
 * (same trick as ColorSelectField) so it isn't clipped by a table's
 * overflow-x wrapper, and positions itself against the trigger button's
 * own bounding rect on open.
 */
export const ActionsMenu = ({ actions }: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const rect = triggerRef.current?.getBoundingClientRect();

  return (
    <div className="inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Row actions"
        className="rounded p-1.5 text-gray-500 hover:bg-lightGray/40 hover:text-primary"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
      >
        <EllipsisVerticalIcon className="size-5" />
      </button>

      {isOpen &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 w-40 rounded-lg border border-lightGray bg-white py-1 shadow-lg"
            style={{
              top: rect.bottom + 4,
              // Right-align the menu to the trigger so it doesn't spill
              // past the table's right edge for the last column.
              left: Math.max(8, rect.right - 160),
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                title={action.disabled ? action.disabledReason : undefined}
                className={`block w-full px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                  action.variant === "danger"
                    ? "text-red-600 hover:bg-red-50"
                    : "text-primary hover:bg-lightGray/40"
                }`}
                onClick={() => {
                  setIsOpen(false);
                  action.onClick();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};
