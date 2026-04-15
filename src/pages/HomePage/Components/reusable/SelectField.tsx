import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import clsx from "clsx";

interface Option {
  value: string | number;
  label?: string;
  name?: string;
}

interface SelectFieldProps {
  id: string;
  label?: string;
  placeholder?: string;
  value?: string | number | null;
  options: Option[];
  onChange: (name: string, value: string | number | null) => void;

  disabled?: boolean;
  error?: string;
  helperText?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  sortOptions?: boolean;

  className?: string;
  inputClassName?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  placeholder = "Select option",
  value,
  options,
  onChange,
  disabled,
  error,
  searchable,
  searchPlaceholder = "Search...",
  clearable = false,
  sortOptions = true,
  className,
  inputClassName,
  helperText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const getOptionLabel = useCallback((option: Option) => {
    const text = option.label ?? option.name;
    if (typeof text === "string" && text.trim()) {
      return text;
    }
    return String(option.value ?? "");
  }, []);

  const sortedOptions = useMemo(
    () => {
      if (!sortOptions) {
        return options;
      }

      return [...options].sort((a, b) =>
        getOptionLabel(a).localeCompare(getOptionLabel(b), undefined, {
          sensitivity: "base",
          numeric: true,
        })
      );
    },
    [options, getOptionLabel, sortOptions]
  );

  const areOptionValuesEqual = useCallback(
    (left: string | number | null | undefined, right: string | number | null | undefined) =>
      String(left ?? "") === String(right ?? ""),
    []
  );

  const shouldSearch =
    searchable === undefined ? sortedOptions.length > 5 : searchable;
  const selectedOption = sortedOptions.find((option) =>
    areOptionValuesEqual(option.value, value)
  );

  /* ---------------------------- styles ---------------------------- */

  const baseControl =
    "app-input text-left flex items-center justify-between";

  const stateStyles = clsx(
    error && "border-error focus:border-error focus:ring-error/20",
    disabled && "bg-gray-100 text-gray-500 cursor-not-allowed"
  );

  /* ---------------------------- logic ---------------------------- */

  const filteredOptions = useMemo(() => {
    if (!shouldSearch || !searchTerm.trim()) return sortedOptions;

    const q = searchTerm.toLowerCase();
    return sortedOptions.filter((o) =>
      getOptionLabel(o).toLowerCase().includes(q)
    );
  }, [sortedOptions, searchTerm, shouldSearch, getOptionLabel]);

  const handleSelect = (option: Option) => {
    onChange(id, option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  const clearSelection = () => {
    onChange(id, null);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    clearSelection();
  };

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
      setSearchTerm("");
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (isOpen && shouldSearch) {
      searchRef.current?.focus();
    }
  }, [isOpen, shouldSearch]);

  /* ---------------------------- native select (non-searchable) ---------------------------- */

  if (!shouldSearch) {
    return (
      <div className={clsx("flex flex-col gap-1", className)}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-primary">
            {label}
          </label>
        )}

        <select
          id={id}
          name={id}
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(id, e.target.value)}
          className={clsx(
            baseControl,
            stateStyles,
            inputClassName
          )}
        >
          <option value="" className="text-gray-400">
            {placeholder}
          </option>

          {sortedOptions.map(option => (
            <option key={option.value} value={option.value}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>
          {(!error&&helperText) && <span className="text-xs text-gray-600">{helperText}</span>}
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  }

  /* ---------------------------- searchable dropdown ---------------------------- */

  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-primary">
          {label}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        {/* Trigger */}
        <button
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={() =>
            !disabled &&
            setIsOpen((prev) => {
              if (prev) {
                setSearchTerm("");
              }
              return !prev;
            })
          }
          className={clsx(
            baseControl,
            stateStyles,
            inputClassName
          )}
          >
          <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
            {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          </span>

          <span className="ml-3 flex items-center gap-2">
            {clearable && selectedOption ? (
              <span
                aria-hidden="true"
                onMouseDown={handleClear}
                onClick={handleClear}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </span>
            ) : null}

            <svg
              className={clsx(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-180"
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-lightGray bg-white shadow-lg">
            {/* Search */}
            <div className="border-b px-2 py-2">
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="app-input"
              />
            </div>

            {/* Options */}
            <div className="max-h-52 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No results
                </div>
              ) : (
                filteredOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={clsx(
                      "w-full px-3 py-2 text-sm text-left hover:bg-gray-100",
                      areOptionValuesEqual(option.value, value) &&
                        "bg-gray-50 text-primary"
                    )}
                  >
                    {getOptionLabel(option)}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {(!error&&helperText) && <span className="text-xs text-gray-600">{helperText}</span>}
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
};
