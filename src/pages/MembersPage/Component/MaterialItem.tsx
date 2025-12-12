import { DocumentTextIcon, XMarkIcon } from "@heroicons/react/24/outline";


interface MaterialItemProps {
  name: string;
  size: string;
}

const MaterialItem = ({ name, size }: MaterialItemProps) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3 transition-colors hover:bg-primary/15">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{size}</p>
        </div>
      </div>
      <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MaterialItem;
