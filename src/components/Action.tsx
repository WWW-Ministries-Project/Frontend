import { cn } from "@/utils/cn";
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { memo } from "react";

interface IAction {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  hideDelete?: boolean;
  className?: string;
  isEditable?: boolean;
}

const Action = ({ onEdit, onDelete, onView, className }: IAction) => {
  return (
    <div
      className={cn(
        "z-50 bg-white divide-gray-100 rounded-lg shadow w-32 border border-[#D8DAE5]",
        className
      )}
    >
      <ul className="!divide-lightGray py-2 text-sm text-primary flex flex-col gap-y-1">
        {onEdit && <ActionButton onClick={onEdit} text="Edit" />}
        {onView && <ActionButton onClick={onView} text="View" />}
        {onDelete && (
          <>
            <hr className="border-[#D8DAE5]" />
            <ActionButton onClick={onDelete} text="Delete" />
          </>
        )}
      </ul>
    </div>
  );
};

interface IActionButton {
  text: "Edit" | "View" | "Delete";
  onClick: () => void;
}

const ActionButton = memo(({ text, onClick }: IActionButton) => {
  return (
    <li
      onClick={onClick}
      className="cursor-pointer flex items-center gap-2 px-4 py-2 w-full text-sm hover:bg-lightGray/30 hover:text-primary"
    >
      {text === "Edit" ? (
        <PencilSquareIcon width={20} />
      ) : text === "View" ? (
        <EyeIcon width={20} />
      ) : (
        <TrashIcon width={20} className="text-red-500" />
      )}
      <span className={text === "Delete" ? "text-red-500" : ""}>{text}</span>
    </li>
  );
});

ActionButton.displayName = "ActionButton";

export default Action;
