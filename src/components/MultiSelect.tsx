import React, { useState } from 'react';

interface Option {
  label: string;
  value: string;
}

interface MultiselectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
}

const Multiselect: React.FC<MultiselectProps> = ({ options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelectedValues);
  };

  const removeSelectedValue = (value: string) => {
    const newSelectedValues = selectedValues.filter(v => v !== value);
    onChange(newSelectedValues);
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      <div
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 cursor-pointer"
        onClick={toggleDropdown}
      >
        {selectedValues.length > 0 ? `${selectedValues.length} selected program(s)` : 'Select options'}
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
          {options.map(option => (
            <label key={option.value} className="flex items-center p-2 hover:bg-gray-100">
              <input
                type="checkbox"
                value={option.value}
                checked={selectedValues.includes(option.value)}
                onChange={() => handleChange(option.value)}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
          {selectedValues.length > 0 ? (
            selectedValues.map((value) => {
              const selectedOption = options.find(option => option.value === value);
              return (
                <div
                  key={value}
                  className="flex items-center my-2 bg-primary/10 text-dark900 text-sm font-medium px-2 py-1 rounded-full"
                >
                  <span>{selectedOption?.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent dropdown from closing
                      removeSelectedValue(value);
                    }}
                    className="ml-2 text-dark900/60 hover:text-dark900"
                  >
                    ×
                  </button>
                </div>
              );
            })
          ) : (
            <span className='py-2 text-sm'>No prerequired program selected</span>
          )}
        </div>
      
    </div>
  );
};

export default Multiselect;