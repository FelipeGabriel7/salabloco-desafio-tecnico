import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = import.meta.env.VITE_THEME_STORAGE_KEY;

type ThemeValue = { theme: Theme; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeValue>({ theme: "light", setTheme: () => undefined });

function readInitialTheme(): Theme {
  try {
    const saved = STORAGE_KEY ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    return "light";
  }

  return "light";
}


export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeState(next);

    if (STORAGE_KEY) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        return;
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}


export const useTheme = () => useContext(ThemeContext);
