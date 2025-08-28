import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface IProps {
  type?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  inputClass?: string;
  id: string;
  value?: string | number;
  onChange: (name: string, value: string | number) => void;
  options: Option[];
  disabled?: boolean;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const SelectField = (props: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get the selected option's label for display
  const selectedOption = props.options.find(option => option.value === props.value);
  const displayValue = selectedOption ? selectedOption.label : '';

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();
    const name = e.target.name;
    props.onChange(name, e.target.value);
  }

  // Memoized filtered options with debouncing effect
  const filteredOptions = useMemo(() => {
    if (!props.searchable || !searchTerm.trim()) {
      return props.options;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return props.options.filter(option =>
      option.label.toLowerCase().includes(searchLower)
    );
  }, [searchTerm, props.options, props.searchable]);

  // Debounced search handler
  const debouncedSetSearchTerm = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Handle search input with immediate UI update but debounced filtering
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSetSearchTerm(value);
  }, [debouncedSetSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && props.searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, props.searchable]);

  const handleOptionSelect = useCallback((option: Option) => {
    props.onChange(props.id, option.value);
    setIsOpen(false);
    setSearchTerm('');
  }, [props]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (props.disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  }, [props.disabled, isOpen]);

  // If not searchable, render the original select
  if (!props.searchable) {

    return (
      <div>
        <div className={"flex text-primary flex-col gap-1 " + props.className}>
          <label className="font-semibold" htmlFor={props.id}>
            {props.label}
          </label>
          <select
            name={props.id}
            id={props.id}
            className={`p-2.5 rounded-lg border ${
              props.inputClass
            } ${props.error ? " !border-error !outline-error" : " "} ${
              props.disabled
                ? "bg-gray-100 border-none text-gray-500 cursor-not-allowed"
                : ""
            }`}
            onChange={handleChange}
            value={props.value}
            disabled={props.disabled}
          >
            <option className='text-gray-400' value="">{props.placeholder}</option>
            {props.options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {props.error && <p className="text-error text-sm">{props.error}</p>}
        </div>
      </div>
    );
  }

  // Render searchable dropdown
  return (
    <div>
      <div className={"flex text-primary flex-col gap-1 " + props.className}>
        <label className="font-semibold" htmlFor={props.id}>
          {props.label}
        </label>
        
        <div className="relative" ref={dropdownRef}>
          {/* Main trigger button */}
          <button
            type="button"
            id={props.id}
            className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between ${
              props.inputClass
            } ${props.error ? " !border-error !outline-error" : " "} ${
              props.disabled
                ? "bg-gray-100 border-none text-gray-500 cursor-not-allowed"
                : "bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            }`}
            onClick={() => !props.disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={props.disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={displayValue ? "text-gray-900" : "text-gray-500"}>
              {displayValue || props.placeholder}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
              {/* Search input */}
              <div className="p-2 border-b border-gray-200">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder={props.searchPlaceholder || "Search options..."}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Options list */}
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                        option.value === props.value ? 'bg-gray-50 text-gray-600' : 'text-gray-900'
                      }`}
                      onClick={() => handleOptionSelect(option)}
                    >
                      {option.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {props.error && <p className="text-error text-sm">{props.error}</p>}
      </div>
    </div>
  );
};