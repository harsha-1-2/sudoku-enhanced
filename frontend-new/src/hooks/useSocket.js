import { io } from "socket.io-client";

const backendURL = process.env.NODE_ENV === "development"
  ? "http://localhost:5000"
  : process.env.REACT_APP_BACKEND_URL; // ✅ Render backend URL

const socket = io(backendURL, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket", "polling"], // ✅ important for Render
});

socket.on("connect", () => {
  console.log(`[SOCKET] Connected | id: ${socket.id}`);
});

socket.on("connect_error", (err) => {
  console.error(`[SOCKET] Connection error:`, err.message);
});

socket.on("disconnect", (reason) => {
  console.log(`[SOCKET] Disconnected | reason: ${reason}`);
});

export default socket;