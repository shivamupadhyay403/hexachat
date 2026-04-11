import api from "@/assets/api";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext(null);

const decodeToken = (jwt) => {
  try {
    return JSON.parse(atob(jwt.split(".")[1]));
  } catch {
    return null;
  }
};

const verifyToken = async (token) => {
  try {
    const responseData = await api.post("/user/verifyToken", { token });
    if (responseData?.data?.data === "Token is valid") {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  const login = useCallback(
    async (jwt, email, firstname, lastname, gender, user_id,username) => {
      if (!jwt) return false;

      const isValid = await verifyToken(jwt);
      if (!isValid) return false;
      localStorage.setItem("hexachat_token", jwt);
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("user_gender", gender);
      localStorage.setItem("firstname", firstname);
      localStorage.setItem("lastname", lastname);
      localStorage.setItem("user_name", username);
      setUser(decodeToken(jwt));
      return true;
    },
    [],
  );

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("hexachat_token");

      if (token) {
        const isValid = await verifyToken(token);

        if (isValid) {
          setUser(decodeToken(token));
        } else {
          localStorage.removeItem("hexachat_token");
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    const handleStorageChange = async () => {
      const token = localStorage.getItem("hexachat_token");

      if (!token) {
        setUser(null);
        return;
      }

      const isValid = await verifyToken(token);

      if (!isValid) {
        setUser(null);
      } else {
        setUser(decodeToken(token));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("hexachat_token");

      if (!token) {
        logout();
        return;
      }

      const isValid = await verifyToken(token);

      if (!isValid) {
        logout();
      } else {
        setUser(decodeToken(token));
      }
    };

    window.addEventListener("focus", checkAuth);
    return () => window.removeEventListener("focus", checkAuth);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
