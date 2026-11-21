import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "salabloco:theme";

type ThemeValue = { theme: Theme; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeValue>({ theme: "light", setTheme: () => undefined });

/** Tema salvo; na primeira visita, o do sistema operacional. */
function readInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* sem localStorage: segue para a preferência do sistema */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Dono do tema. O estado vive aqui (Context) e a classe `dark` no <html> é só o reflexo dele.
 * useLayoutEffect aplica a classe antes do primeiro quadro desenhado pelo React, então não há script no index.html.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* o tema vale só nesta sessão */
    }
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
