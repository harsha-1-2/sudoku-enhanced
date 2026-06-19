import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function JoinPrivateRoom() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (code.trim()) {
      // Just navigate to the URL. The MultiplayerGame component handles the socket join.
      navigate(`/game/${code.toUpperCase()}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
            ← Dashboard
          </button>
        </div>

        <h2 style={styles.title}>Join Private Room</h2>
        <p style={styles.subtitle}>Enter the room code to join your friend.</p>

        <div style={styles.inputContainer}>
          <div style={styles.icon}>🔑</div>
          <input 
            style={styles.input}
            placeholder="ROOM CODE" 
            value={code} 
            onChange={(e) => setCode(e.target.value)}
            maxLength={10}
          />
        </div>

        <button onClick={handleJoin} style={styles.joinButton}>
          Join Game
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f1f8f3ff 0%, #91f8abff 100%)",
    padding: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "450px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    border: "3px solid #10b981",
    textAlign: "center",
  },
  header: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: "20px",
  },
  backBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#10b981",
    backgroundColor: "transparent",
    border: "2px solid #10b981",
    borderRadius: "8px",
    cursor: "pointer",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 10px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: "0 0 30px 0",
  },
  inputContainer: {
    position: "relative",
    marginBottom: "20px",
  },
  icon: {
    fontSize: "24px",
    position: "absolute",
    left: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "16px 16px 16px 50px", // Padding left for the icon
    fontSize: "20px",
    fontWeight: "bold",
    letterSpacing: "2px",
    border: "2px solid #d1d5db",
    borderRadius: "12px",
    outline: "none",
    backgroundColor: "#f9fafb",
    textTransform: "uppercase",
    boxSizing: "border-box",
  },
  joinButton: {
    width: "100%",
    padding: "16px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#3b82f6", // Blue button for joining
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
  },
};