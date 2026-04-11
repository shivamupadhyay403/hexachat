import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import Spinner from "../assets/Spinner";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner/>

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" state={{ from: location }} replace />;
}