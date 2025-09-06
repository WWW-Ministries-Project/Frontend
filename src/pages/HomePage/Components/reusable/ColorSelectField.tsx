import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { createPortal } from "react-dom";

interface IColorProps {
  colors: string[];
  id: string;
  name: string;
  onChange: (name: string, value: string) => void;
  value: string;
  showAll?: boolean;
  label?: string;
}

export const ColorSelectField = ({
  colors,
  id,
  name,
  onChange,
  value,
  showAll = true,
  label,
}: IColorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedColor, setSelectedColor] = useState(value);

  const handleSelect = (color: string) => {
    onChange(name, color);
    setIsOpen(false);
    setSelectedColor(color);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      <p className="text-sm">{label}</p>
      <div
        ref={dropdownRef}
        className="relative min-w-32 h-10 border rounded-lg"
      >
        {/* Selected Color Display */}
        <div
          id={id}
          className="h-full w-full flex items-center justify-between cursor-pointer rounded-lg px-2"
          style={{ backgroundColor: selectedColor || "#fff" }}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="text-sm text-gray-500">Select color</span>
          <ChevronDownIcon
            className={`transition-transform  text-gray-500 size-4 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>

        {/* Dropdown */}

        {isOpen &&
          createPortal(
            <div
              className="absolute bg-white border rounded-lg shadow-lg p-2 h-fit max-h-36  overflow-auto flex flex-wrap gap-2 z-50"
              style={{
                top: dropdownRef.current
                  ? dropdownRef.current.getBoundingClientRect().bottom +
                    window.scrollY
                  : 0,
                left: dropdownRef.current
                  ? dropdownRef.current.getBoundingClientRect().left +
                    window.scrollX
                  : 0,
                width: dropdownRef.current?.offsetWidth || 0,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {showAll && (
                <p
                  className="w-full h-8 rounded-sm cursor-pointer hover:bg-slate-100 p-1"
                  onClick={() => handleSelect("")}
                >
                  All
                </p>
              )}
              {colors.map((color) => (
                <div
                  key={color}
                  className="w-full h-8 rounded-sm cursor-pointer border border-gray-300"
                  style={{ backgroundColor: color }}
                  onClick={() => handleSelect(color)}
                  title={color}
                />
              ))}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
};
