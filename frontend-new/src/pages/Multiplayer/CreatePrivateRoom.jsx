import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../hooks/useSocket";

// 👇 IMPORT FROM SAME FOLDER (./)
import gameNightImg from "./game_night.jpg"; 

export default function CreatePrivateRoom() {
  const navigate = useNavigate();


  useEffect(() => {
    socket.on("room_created", ({ roomId }) => {
      navigate(`/game/${roomId}`);
    });

    return () => socket.off("room_created");
  }, [navigate]);

  const handleCreate = () => {
    socket.emit("create_room");
  };


  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
            ← Dashboard
          </button>
        </div>

        <h2 style={styles.title}>Private Room</h2>
        <p style={styles.subtitle}>Generate a unique room code to play with a friend.</p>
        
        {/* ⭐ IMAGE CONTAINER */}
        <div style={styles.iconContainer}>
          <img 
            src={gameNightImg} 
            alt="Game Night Sticker" 
            style={styles.stickerImage} 
          />
        </div>

        <button onClick={handleCreate} style={styles.createButton}>
          Start New Game
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
    transition: "all 0.2s",
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
  
  // ⭐ CIRCULAR CONTAINER STYLES
  iconContainer: {
    width: "180px",       // Increased size to show off the detailed sticker
    height: "180px",
    margin: "0 auto 30px auto",
    borderRadius: "50%",  // Makes it a perfect circle
    border: "4px solid #10b981", // Green border ring
    overflow: "hidden",   // Crops the square image into a circle
    backgroundColor: "#f0fdf4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
  },

  // ⭐ IMAGE STYLES
  stickerImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover", // Ensures image covers the circle without stretching
  },

  createButton: {
    width: "100%",
    padding: "16px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
    transition: "transform 0.2s",
  },
};