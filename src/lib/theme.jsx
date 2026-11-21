import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "dunnkayce-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const VALID_THEMES = ["light", "dark", "system"];

const ThemeContext = createContext(null);

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function prefersDark() {
  if (!isBrowser() || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia(DARK_QUERY).matches;
  } catch {
    return false;
  }
}

function getStoredTheme() {
  if (!isBrowser()) return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(stored) ? stored : "light";
  } catch {
    return "light";
  }
}

function resolveTheme(theme) {
  if (theme === "system") return prefersDark() ? "dark" : "light";
  return theme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [systemPrefersDark, setSystemPrefersDark] = useState(prefersDark);

  useEffect(() => {
    if (!isBrowser() || typeof window.matchMedia !== "function") return undefined;

    let mediaQuery;
    try {
      mediaQuery = window.matchMedia(DARK_QUERY);
    } catch {
      return undefined;
    }

    const handleChange = (event) => setSystemPrefersDark(Boolean(event.matches));
    setSystemPrefersDark(Boolean(mediaQuery.matches));

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private browsing / blocked storage — theme still works for this session.
    }
  }, [theme]);

  const resolvedTheme = theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;

  useEffect(() => {
    if (!isBrowser()) return;
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback((nextTheme) => {
    if (!VALID_THEMES.includes(nextTheme)) return;
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) =>
      resolveTheme(currentTheme) === "dark" ? "light" : "dark",
    );
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, resolvedTheme }),
    [theme, setTheme, toggleTheme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
