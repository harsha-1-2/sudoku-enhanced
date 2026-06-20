import { createContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null); // ✅ added
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await axiosClient.get("/auth/me");
        setUser(response.data.user);
      } catch {
        try {
          const refreshRes = await axiosClient.post("/auth/refresh");
          setAccessToken(refreshRes.data.accessToken); // ✅ added
          const response = await axiosClient.get("/auth/me");
          setUser(response.data.user);
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, []);

  async function loginUser(userData, token) { // ✅ accepts token now
    setUser(userData);
    setAccessToken(token);
  }

  async function logoutUser() {
    try {
      await axiosClient.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    }
    setUser(null);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
