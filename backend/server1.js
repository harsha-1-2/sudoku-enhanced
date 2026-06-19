const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

// ✅ CORS setup - support frontend dev servers on localhost
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3002",
  "http://127.0.0.1:3003",
  "http://localhost:5000" // Allow proxy requests
];

app.use(cors({
  origin: (origin, callback) => {
    // Remove trailing slash for comparison
    const normalizedOrigin = origin?.replace(/\/$/, '');
    const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
    
    if (!origin || normalizedAllowed.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      console.error(`CORS rejected origin: ${origin}`);
      callback(new Error("CORS origin denied"));
    }
  },
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
    return cookies;
  }, {});
}

io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  
  // ✅ Use refresh token (7 days) instead of access token (15min)
  const token = cookies.refreshToken;

  if (!token) return next(new Error("Authentication error"));

  try {
    const verified = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    socket.data.user = verified;
    next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
});

connectDB();
app.use(express.json());
app.use(cookieParser()); // ✅ NEW: Parse cookies from requests

// Routes
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/sudoku", require("./routes/sudokuRoutes"));

require("./sockets/gameSocket")(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
