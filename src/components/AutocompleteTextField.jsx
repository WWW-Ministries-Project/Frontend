import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

const toSafeString = (value) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

/**
 * AutocompleteTextField
 *
 * A text input with a live-filtered suggestion dropdown.
 * When `allowCreate` is true and the typed value doesn't match any suggestion,
 * a "Create …" option is appended so the user can add a new record inline.
 *
 * Props
 * ─────
 * suggestions          string[]   – list of option labels to search
 * value                string     – controlled value
 * onChange             fn(string) – called on every keystroke
 * onSelect             fn(string) – called when an existing suggestion is picked
 * onCreate             fn(string) – called when the "Create" option is picked
 * allowCreate          boolean    – show the create option (default false)
 * createOptionLabelPrefix string  – prefix for the create label (default "Create")
 * createOptionDescription string  – secondary text under the create option
 * noSuggestionsText    string     – text shown when nothing matches
 * placeholder, id, name, disabled, className, inputClassName, error
 */
const AutocompleteTextField = forwardRef(function AutocompleteTextField(
  {
    suggestions = [],
    placeholder = "Type to search…",
    onSelect,
    onChange,
    value = "",
    id,
    name,
    disabled = false,
    className = "",
    inputClassName = "",
    error,
    allowCreate = false,
    createOptionLabelPrefix = "Create",
    createOptionDescription = "",
    onCreate,
    noSuggestionsText = "No suggestions found",
  },
  ref
) {
  const [inputValue, setInputValue] = useState(() => toSafeString(value));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const wrapperRef = useRef(null);

  // Keep local input in sync with controlled value
  useEffect(() => {
    setInputValue(toSafeString(value));
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedSuggestions = useMemo(
    () =>
      (suggestions || [])
        .map((s) => toSafeString(s).trim())
        .filter(Boolean),
    [suggestions]
  );

  const normalizedInput = inputValue.trim().toLowerCase();

  const filteredSuggestions = useMemo(
    () =>
      normalizedSuggestions.filter((s) =>
        s.toLowerCase().includes(inputValue.toLowerCase())
      ),
    [inputValue, normalizedSuggestions]
  );

  const exactMatchExists = useMemo(
    () =>
      normalizedSuggestions.some(
        (s) => s.trim().toLowerCase() === normalizedInput
      ),
    [normalizedInput, normalizedSuggestions]
  );

  const optionList = useMemo(() => {
    const options = filteredSuggestions.map((s) => ({
      type: "suggestion",
      value: s,
      label: s,
    }));

    if (allowCreate && normalizedInput && !exactMatchExists) {
      options.push({
        type: "create",
        value: inputValue.trim(),
        label: `${createOptionLabelPrefix} "${inputValue.trim()}"`,
        description: createOptionDescription,
      });
    }

    return options;
  }, [
    allowCreate,
    createOptionDescription,
    createOptionLabelPrefix,
    exactMatchExists,
    filteredSuggestions,
    inputValue,
    normalizedInput,
  ]);

  // Clamp active index when list shrinks
  useEffect(() => {
    if (activeSuggestion >= optionList.length) {
      setActiveSuggestion(Math.max(optionList.length - 1, 0));
    }
  }, [activeSuggestion, optionList.length]);

  const handleInputChange = (e) => {
    const userInput = e.target.value;
    setInputValue(userInput);
    onChange?.(userInput);
    setShowSuggestions(true);
    setActiveSuggestion(0);
  };

  const handleOptionSelect = (option) => {
    const nextValue = option?.value ?? "";
    setInputValue(nextValue);
    setShowSuggestions(false);

    if (option?.type === "create") {
      onCreate?.(nextValue);
    } else {
      onSelect?.(nextValue);
    }

    onChange?.(nextValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (optionList.length > 0) {
        e.preventDefault();
        handleOptionSelect(optionList[activeSuggestion] ?? optionList[0]);
      } else if (allowCreate && inputValue.trim()) {
        e.preventDefault();
        const nextValue = inputValue.trim();
        setInputValue(nextValue);
        setShowSuggestions(false);
        onCreate?.(nextValue);
        onChange?.(nextValue);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeSuggestion > 0) setActiveSuggestion(activeSuggestion - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeSuggestion < optionList.length - 1)
        setActiveSuggestion(activeSuggestion + 1);
    }
  };

  return (
    <div className={clsx("relative w-full", className)} ref={wrapperRef}>
      <input
        ref={ref}
        id={id}
        name={name}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        disabled={disabled}
        className={clsx(
          "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400",
          error
            ? "border-error focus:border-error focus:ring-1 focus:ring-error/30"
            : "border-lightGray focus:border-primary focus:ring-1 focus:ring-primary/20",
          disabled && "cursor-not-allowed bg-gray-50 opacity-60",
          inputClassName
        )}
      />

      {showSuggestions && inputValue && optionList.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <ul className="max-h-60 overflow-auto rounded-lg py-1 text-sm focus:outline-none">
            {optionList.map((option, index) => (
              <li
                key={`${option.type}-${option.value}`}
                className={clsx(
                  "cursor-pointer px-4 py-2 hover:bg-primary/5",
                  index === activeSuggestion && "bg-primary/5"
                )}
                onMouseDown={(e) => {
                  // Use mousedown so the input blur fires after selection
                  e.preventDefault();
                  handleOptionSelect(option);
                }}
              >
                <div className="flex flex-col">
                  <span
                    className={clsx(
                      option.type === "create"
                        ? "font-medium text-primary"
                        : "text-gray-700"
                    )}
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-xs text-gray-500">
                      {option.description}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && inputValue && optionList.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          <div className="px-4 py-2 text-gray-500">{noSuggestionsText}</div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-error">{error}</p>
      )}
    </div>
  );
});

export default AutocompleteTextField;
