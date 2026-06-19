import { createContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ On mount, verify user with backend using cookie
  useEffect(() => {
  const verifyUser = async () => {
    try {
      const response = await axiosClient.get("/auth/me");
      setUser(response.data.user);
    } catch {
      // /auth/me failed → try refresh manually before giving up
      try {
        await axiosClient.post("/auth/refresh");
        const response = await axiosClient.get("/auth/me");
        setUser(response.data.user);
      } catch {
        setUser(null); // Both failed → genuinely logged out
      }
    } finally {
      setLoading(false);
    }
  };

  verifyUser();
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
