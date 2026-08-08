import { ArrowDownTrayIcon, DocumentTextIcon, XMarkIcon } from "@heroicons/react/24/outline";


interface MaterialItemProps {
  name: string;
  size: string;
}

const MaterialItem = ({ name, size }: MaterialItemProps) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-lightGray bg-white px-4 py-3 transition-colors hover:bg-primary/15">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-200">
          <DocumentTextIcon className="h-4 w-4 text-primaryGray" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-primary">{name}</p>
          <p className="text-xs text-primaryGray">{size}</p>
        </div>
      </div>
      <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primaryGray transition-colors hover:bg-lightGray/40 hover:text-primary">
        <ArrowDownTrayIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MaterialItem;
