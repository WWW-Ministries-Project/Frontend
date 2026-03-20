import React, { useState, useRef, useEffect, useMemo } from "react";
import clsx from "clsx";

interface Option {
  label: string;
  value: string;
}

interface MultiselectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;

  placeholder?: string;
  emptyMsg?: string;
  disabled?: boolean;
  className?: string;
}

const Multiselect: React.FC<MultiselectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  emptyMsg = "No selection",
  disabled,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const sortedOptions = useMemo(
    () =>
      [...options].sort((a, b) =>
        a.label.localeCompare(b.label, undefined, {
          sensitivity: "base",
          numeric: true,
        })
      ),
    [options]
  );

  const shouldSearch = sortedOptions.length > 5;
  const filteredOptions = useMemo(() => {
    if (!shouldSearch || !searchTerm.trim()) {
      return sortedOptions;
    }

    const q = searchTerm.toLowerCase();
    return sortedOptions.filter((option) =>
      option.label.toLowerCase().includes(q)
    );
  }, [searchTerm, shouldSearch, sortedOptions]);

  const selectedChips = useMemo(
    () =>
      selectedValues
        .map((value) => {
          const option = sortedOptions.find((item) => item.value === value);
          return option ?? { value, label: value };
        })
        .sort((a, b) =>
          a.label.localeCompare(b.label, undefined, {
            sensitivity: "base",
            numeric: true,
          })
        ),
    [selectedValues, sortedOptions]
  );

  /* ------------------------ handlers ------------------------ */

  const toggleValue = (value: string) => {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value]
    );
  };

  const removeValue = (value: string) => {
    onChange(selectedValues.filter(v => v !== value));
  };

  /* ------------------------ outside click ------------------------ */

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && shouldSearch) {
      searchRef.current?.focus();
    }
  }, [isOpen, shouldSearch]);

  /* ------------------------ styles ------------------------ */

  const triggerStyles =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm " +
    "flex items-center justify-between cursor-pointer transition-colors";

  return (
    <div ref={ref} className={clsx("relative w-full", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
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
          triggerStyles,
          "border-gray-300",
          disabled && "bg-gray-100 text-gray-500 cursor-not-allowed"
        )}
      >
        <span className={selectedValues.length ? "text-gray-900" : "text-gray-500"}>
          {selectedValues.length
            ? `${selectedValues.length} selected`
            : placeholder}
        </span>

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
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
          {shouldSearch && (
            <div className="border-b px-2 py-2">
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="app-input"
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                  />
                  {option.label}
                </label>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            )}
          </div>
        </div>
      )}

      {/* Selected chips */}
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedValues.length > 0 ? (
          selectedChips.map((option) => {
            const value = option.value;
            return (
              <span
                key={value}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {option?.label}
                <button
                  type="button"
                  onClick={() => removeValue(value)}
                  className="text-primary/60 hover:text-primary"
                >
                  ×
                </button>
              </span>
            );
          })
        ) : (
          <span className="text-sm text-gray-500 py-1">{emptyMsg}</span>
        )}
      </div>
    </div>
  );
};

export default Multiselect;
