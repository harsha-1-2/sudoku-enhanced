import { io } from "socket.io-client";

const backendURL = process.env.NODE_ENV === "development"
  ? "http://localhost:5000"
  : window.location.origin;

const socket = io(backendURL, {
  withCredentials: true,
  autoConnect: false, // ✅ Only connect when explicitly called
});

export default socket;