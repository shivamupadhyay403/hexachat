import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/Authcontext";

import GuestRoute from "./routes/GuestRoute";
import ProtectedRoute from "./routes/ProtectedRoute";

import LoginForm from "./pages/UnAuth/LoginForm";
import RegisterForm from "./pages/UnAuth/RegisterForm";
import Dashboard from "./pages/Auth/Dashboard";
import { useEffect } from "react";
import { useSocket } from "./hooks/useSocket";
import useUser from "./hooks/useUser";
import { initSocket } from "./socket/socketClient";
export default function App() {
  const { getUserId, getUserName } = useUser();
  useEffect(() => {
    if (getUserId() && getUserName()) {
      initSocket(getUserId(), getUserName());
    }
  }, [getUserId(), getUserName()]);
  useSocket();
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Guest Routes */}
          <Route element={<GuestRoute />}>
            <Route path="/" element={<LoginForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
