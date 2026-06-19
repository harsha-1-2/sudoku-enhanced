import { useState, useContext } from "react";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await axiosClient.post("/auth/login", { email, password });
      // ✅ SECURE: Token is now in HTTP-Only cookie, just pass user data
      await loginUser(res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setMsg(err.response?.data?.msg || "Login failed");
    }
  }

  return (
    <div>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)} />

        <input placeholder="Password" type="password"
          value={password} onChange={e=>setPassword(e.target.value)} />

        <button type="submit">Login</button>
      </form>

      {msg && <p style={{color:"red"}}>{msg}</p>}
    </div>
  );
}
