import { createContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import socket, { connectSocket } from "../hooks/useSocket"; // ✅ adjust path if needed

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await axiosClient.get("/auth/me");
        setUser(response.data.user);
        // ✅ reconnect socket on page refresh if already logged in
        if (accessToken) {
          connectSocket(accessToken);
        }
      } catch {
        try {
          const refreshRes = await axiosClient.post("/auth/refresh");
          const newToken = refreshRes.data.accessToken;
          setAccessToken(newToken);
          const response = await axiosClient.get("/auth/me");
          setUser(response.data.user);
          // ✅ connect socket after successful refresh
          if (newToken) connectSocket(newToken);
        } catch {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, []);

  async function loginUser(userData, token) {
    setUser(userData);
    setAccessToken(token);
    // ✅ connect socket on login
    if (token) connectSocket(token);
  }

  async function logoutUser() {
    try {
      await axiosClient.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    }
    setUser(null);
    setAccessToken(null);
    // ✅ disconnect socket on logout
    socket.disconnect();
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
