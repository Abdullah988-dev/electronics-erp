import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth`;

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("erp_token");
    const email = localStorage.getItem("erp_admin_email");
    const role = localStorage.getItem("erp_admin_role");

    if (token && email) {
      setAdmin({ email, role });
    }
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, message: data.message || "Login failed" };
      }

      localStorage.setItem("erp_token", data.token);
      localStorage.setItem("erp_admin_email", data.user.email);
      localStorage.setItem("erp_admin_role", data.user.role);

      setAdmin({ email: data.user.email, role: data.user.role });

      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: "Cannot reach server. Is the backend running?" };
    }
  };

  const logout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_admin_email");
    localStorage.removeItem("erp_admin_role");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}