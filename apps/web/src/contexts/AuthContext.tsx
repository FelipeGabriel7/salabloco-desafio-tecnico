import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { createApi, loginRequest, type Api, type Session } from "@/services";

const SESSION_KEY = "salabloco:session";
const FLASH_KEY = "salabloco:flash";

type AuthValue = {
  session: Session | null;
  api: Api;
  login: (companyId: string, token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Aviso mostrado no login depois que a API respondeu 401. */
export const peekFlash = (): string | null => {
  try {
    return sessionStorage.getItem(FLASH_KEY);
  } catch {
    return null;
  }
};
export const clearFlash = () => {
  try {
    sessionStorage.removeItem(FLASH_KEY);
  } catch {
    /* ignora */
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // O token fica em sessionStorage: some ao fechar a aba.
  const [session, setSession] = useState<Session | null>(readSession);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignora */
    }
    setSession(null);
  }, []);

  const expire = useCallback(() => {
    try {
      sessionStorage.setItem(FLASH_KEY, "Sessão inválida. Entre novamente.");
    } catch {
      /* ignora */
    }
    logout();
  }, [logout]);

  const login = useCallback(async (companyId: string, token: string) => {
    await loginRequest(companyId, token);
    const next = { companyId, token };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      /* ignora */
    }
    setSession(next);
  }, []);

  const api = useMemo(() => createApi(session, expire), [session, expire]);
  const value = useMemo(() => ({ session, api, login, logout }), [session, api, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
