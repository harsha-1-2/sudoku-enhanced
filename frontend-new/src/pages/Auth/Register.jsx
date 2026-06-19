import { useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [username,setUsername] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [msg,setMsg] = useState("");

  async function handleRegister(e){
    e.preventDefault();
    try {
      await axiosClient.post("/auth/register", { username,email,password });
      navigate("/login");
    } catch(err){
      setMsg(err.response?.data?.msg || "Registration failed");
    }
  }

  return (
    <div>
      <h2>Register</h2>

      <form onSubmit={handleRegister}>
        <input
          id="register-username"
          name="username"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />

        <input
          id="register-email"
          name="email"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          id="register-password"
          name="password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button type="submit">Create Account</button>
      </form>

      {msg && <p style={{color:"red"}}>{msg}</p>}
    </div>
  );
}
