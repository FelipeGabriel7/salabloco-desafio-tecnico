import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { checkLogin, getConfig } from "@/services/httpApi";
import type { Session } from "@/services/types";

const OLD_SESSION_KEY = "salabloco:session";
const AuthContext = createContext<{
  session: Session | null;
  login: (companyId: string, token: string, companyName: string) => Promise<void>;
  logout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    sessionStorage.removeItem(OLD_SESSION_KEY);
  }, []);

  async function login(companyId: string, token: string, companyName: string) {
    await checkLogin(companyId, token);
    const config = await getConfig(token);

    setSession({ companyId, companyName, token, timezone: config.timezone });
  }

  function logout() {
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return context;
}
