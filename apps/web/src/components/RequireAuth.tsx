import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/utils/paths";

/** Rota protegida: sem sessão, vai para o login e guarda a página de origem. */
export function RequireAuth() {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
