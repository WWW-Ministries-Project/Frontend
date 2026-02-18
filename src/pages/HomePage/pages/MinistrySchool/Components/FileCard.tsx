import { DocumentTextIcon } from "@heroicons/react/24/outline";

export const FileCard: React.FC<{
  name: string;
  size: string;
  removeItem?: () => void;
}> = ({ name, size, removeItem }) => (
  <div className="mb-3 flex items-center justify-between rounded-md border border-dashed border-lightGray bg-lightGray/20 p-3">
    <div className="flex items-center gap-3">
      <DocumentTextIcon className="h-6 w-6 text-primary" />

      <div>
        <div className="font-semibold text-primary">{name}</div>
        <div className="text-xs text-primaryGray">{size}</div>
      </div>
    </div>

    <button
      aria-label="remove"
      onClick={removeItem}
      className="text-primaryGray transition-colors hover:text-primary"
    >
      ✕
    </button>
  </div>
);
