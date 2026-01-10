import { ArrowDownTrayIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export const FileCard: React.FC<{
  name: string;
  size: string;
  removeItem?: () => void;
}> = ({ name, size, removeItem }) => (
  <div className="flex items-center justify-between p-3 mb-3 border border-dashed border-gray-300 rounded-md bg-gray-50">
    <div className="flex items-center gap-3">
      <DocumentTextIcon className="h-6 w-6 text-gray-800" />

      <div>
        <div className="font-semibold text-gray-800">{name}</div>
        <div className="text-xs text-gray-500">{size}</div>
      </div>
    </div>

    <button
      aria-label="remove"
      onClick={removeItem}
      className="text-gray-400 hover:text-gray-600 transition-colors"
    >
      ✕
    </button>
  </div>
);
