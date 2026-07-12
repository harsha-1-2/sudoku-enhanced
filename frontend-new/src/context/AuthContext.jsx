import { createContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verifyUser = async () => {
      try {
        const response = await axiosClient.get("/auth/me");
        if (!cancelled) {
          setUser(response.data.user || null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    verifyUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loginUser(userData) {
    setUser(userData);
  }

  async function logoutUser() {
    try {
      await axiosClient.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
