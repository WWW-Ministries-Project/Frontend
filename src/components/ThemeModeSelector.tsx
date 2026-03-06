import { useId } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { ThemeMode, useTheme } from "@/context/ThemeContext";
import { cn } from "@/utils/cn";

interface ThemeModeSelectorProps {
  className?: string;
  id?: string;
}

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const ThemeModeSelector = ({ className, id }: ThemeModeSelectorProps) => {
  const generatedId = useId();
  const selectId = id ?? `theme-mode-${generatedId}`;
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={selectId} className="sr-only">
        Theme mode
      </label>
      <select
        id={selectId}
        value={themeMode}
        onChange={(event) => setThemeMode(event.target.value as ThemeMode)}
        className="h-9 w-full appearance-none rounded-lg border border-lightGray bg-white px-3 pr-9 text-sm text-primary shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {themeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primaryGray"
        aria-hidden="true"
      />
    </div>
  );
};

