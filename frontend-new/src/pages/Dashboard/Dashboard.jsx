import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Single Player",
      description: "Practice your skills solo",
      path: "/single-player",
      color: "#10b981"
    },
     {
    title: "Practice Sudoku",
    description: "Solve Sudoku puzzles without competition",
    path: "/practice",
    color: "#ef4444"
  },
    {
      title: "Public Match",
      description: "Play with random opponents",
      path: "/multiplayer/public",
      color: "#3b82f6"
    },
    {
      title: "Create Private Room",
      description: "Invite friends to play",
      path: "/multiplayer/private/create",
      color: "#8b5cf6"
    },
    {
      title: "Join Private Room",
      description: "Enter a room code",
      path: "/multiplayer/private/join",
      color: "#f59e0b"
    },
    { title: "Leaderboard", description: "See top ranking players", path: "/leaderboard", color: "#ec4899" }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sudoku Solver</h1>
          <p style={styles.welcome}>Hello, {user?.username || user?.email}!</p>
        </div>
        <button onClick={logoutUser} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.grid}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            style={{
              ...styles.card,
              borderColor: item.color,
            }}
            onClick={() => navigate(item.path)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.2)";
            }}
          >
            <h3 style={styles.cardTitle}>{item.title}</h3>
            <p style={styles.cardDesc}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eaecf1ff 0%, #764ba2 100%)",
    padding: "40px 20px",
  },
  header: {
    maxWidth: "1200px",
    margin: "0 auto 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#ffffff",
    margin: "0 0 8px 0",
    textShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
  },
  welcome: {
    fontSize: "18px",
    color: "rgba(255, 255, 255, 0.9)",
    margin: 0,
  },
  logoutBtn: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  grid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
    border: "3px solid",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  cardDesc: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
};