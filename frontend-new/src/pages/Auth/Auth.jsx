import { useState, useContext } from "react";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Auth() {
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await axiosClient.post("/auth/login", { email, password });
      loginUser(res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setMsg(err.response?.data?.msg || "Login failed");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");
    try {
      await axiosClient.post("/auth/register", { username, email, password });
      setMsg("Account created successfully! Please login.");
      setIsLogin(true);
      setPassword("");
    } catch (err) {
      setMsg(err.response?.data?.msg || "Registration failed");
    }
  }

  function switchMode() {
    setIsLogin(!isLogin);
    setMsg("");
    setUsername("");
    setEmail("");
    setPassword("");
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">SUDOKU IT IZZ </h1>
        
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => switchMode()}
            type="button"
          >
            Login
          </button>
          <button
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => switchMode()}
            type="button"
          >
            Register
          </button>
        </div>

        <h2 className="auth-subtitle">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="auth-form">
          {!isLogin && (
            <input
              id="username"
              name="username"
              className="auth-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <input
            id="email"
            name="email"
            className="auth-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            id="password"
            name="password"
            className="auth-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-button">
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>

        {msg && (
          <p className={`auth-message ${msg.includes("success") ? "success" : "error"}`}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}