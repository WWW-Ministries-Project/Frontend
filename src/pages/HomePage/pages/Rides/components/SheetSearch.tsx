import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { XCircleIcon } from "@heroicons/react/24/solid";

interface SheetSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

/** The search field at the top of the area / pickup point sheets. */
export const SheetSearch = ({
  value,
  onChange,
  placeholder,
}: SheetSearchProps) => (
  <div className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-lightGray bg-lightGray/10 px-3 focus-within:border-amber-400">
    <MagnifyingGlassIcon
      className="h-5 w-5 flex-none text-primaryGray"
      aria-hidden="true"
    />
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm text-primary placeholder:text-primaryGray focus:outline-none focus:ring-0"
    />
    {value ? (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="flex-none rounded-full text-primaryGray hover:text-primary"
      >
        <XCircleIcon className="h-5 w-5" />
      </button>
    ) : null}
  </div>
);
