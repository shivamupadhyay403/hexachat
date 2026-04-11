import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { Spinner } from "@/components/ui/spinner";

export default function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Spinner/>

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : <Outlet />;
}