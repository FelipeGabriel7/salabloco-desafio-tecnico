import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/routes";


export function RequireAuth() {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
