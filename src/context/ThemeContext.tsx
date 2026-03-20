import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "wwm-ui-theme";
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (nextThemeMode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

const readStoredThemeMode = (): ThemeMode | null => {
  try {
    const storedThemeMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(storedThemeMode) ? storedThemeMode : null;
  } catch {
    return null;
  }
};

const persistThemeMode = (themeMode: ThemeMode) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  } catch {
    // Ignore storage errors (private mode, restricted storage, etc.)
  }
};

const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia(SYSTEM_THEME_QUERY).matches ? "dark" : "light";

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") return "system";

  return readStoredThemeMode() ?? "system";
};

const resolveTheme = (themeMode: ThemeMode): ResolvedTheme =>
  themeMode === "system" ? getSystemTheme() : themeMode;

const syncThemeToDom = (themeMode: ThemeMode, resolvedTheme: ResolvedTheme) => {
  const root = document.documentElement;
  root.setAttribute("data-theme-mode", themeMode);
  root.setAttribute("data-theme", resolvedTheme);
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute("content", resolvedTheme === "dark" ? "#0B1220" : "#F3F5FA");
  }
};

const getMediaQueryList = () => window.matchMedia(SYSTEM_THEME_QUERY);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialThemeMode());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getInitialThemeMode())
  );

  useEffect(() => {
    const nextResolvedTheme = resolveTheme(themeMode);
    setResolvedTheme(nextResolvedTheme);
    syncThemeToDom(themeMode, nextResolvedTheme);
    persistThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== "system") return;

    const mediaQuery = getMediaQueryList();
    const handleThemeChange = () => {
      const nextResolvedTheme = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(nextResolvedTheme);
      syncThemeToDom("system", nextResolvedTheme);
    };

    handleThemeChange();
    mediaQuery.addEventListener("change", handleThemeChange);
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode,
    }),
    [themeMode, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
};
