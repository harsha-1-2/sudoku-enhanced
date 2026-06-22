import { createContext, useState, useEffect, useRef } from "react";
import axiosClient from "../api/axiosClient";
import socket, { connectSocket } from "../hooks/useSocket";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef(null); // ✅ added

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await axiosClient.get("/auth/me");
        setUser(response.data.user);
        if (accessTokenRef.current) {
          connectSocket(accessTokenRef.current);
        }
      } catch {
        try {
          const refreshRes = await axiosClient.post("/auth/refresh");
          const newToken = refreshRes.data.accessToken;
          accessTokenRef.current = newToken; // ✅ use ref
          setAccessToken(newToken);
          const response = await axiosClient.get("/auth/me");
          setUser(response.data.user);
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
  }, []); // ✅ no eslint warning now

  async function loginUser(userData, token) {
    setUser(userData);
    setAccessToken(token);
    accessTokenRef.current = token; // ✅ keep ref in sync
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
    accessTokenRef.current = null; // ✅ clear ref
    socket.disconnect();
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
