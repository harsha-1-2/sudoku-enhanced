import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await axiosClient.get("/leaderboard");
        setLeaders(res.data);
      } catch (err) {
        console.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
            ← Dashboard
          </button>
        </div>

        <h2 style={styles.title}>🏆 Global Leaderboard</h2>
        <p style={styles.subtitle}>Top Sudoku Masters</p>

        {loading ? (
          <div className="spinner" style={{fontSize: "40px", marginTop: "20px"}}>⏳</div>
        ) : (
          <div style={styles.listContainer}>
            {/* Header Row */}
            <div style={styles.rowHeader}>
              <span style={{width: "15%"}}>Rank</span>
              <span style={{width: "45%", textAlign: "left"}}>Player</span>
              <span style={{width: "20%"}}>Wins</span>
              <span style={{width: "20%"}}>Rate</span>
            </div>

            {/* List Rows */}
            {leaders.map((player, index) => {
              // Styling for Top 3
              let rankIcon = `${index + 1}`;
              let rowColor = "#ffffff";
              
              if (index === 0) { rankIcon = "🥇"; rowColor = "#fffbeb"; } // Gold
              if (index === 1) { rankIcon = "🥈"; rowColor = "#f9fafb"; } // Silver
              if (index === 2) { rankIcon = "🥉"; rowColor = "#fff7ed"; } // Bronze

              return (
                <div key={index} style={{...styles.row, backgroundColor: rowColor}}>
                  <span style={{width: "15%", fontSize: "20px"}}>{rankIcon}</span>
                  <span style={{width: "45%", textAlign: "left", fontWeight: "bold", color: "#1f2937"}}>
                    {player.username}
                  </span>
                  <span style={{width: "20%", color: "#10b981", fontWeight: "bold"}}>
                    {player.wins}
                  </span>
                  <span style={{width: "20%", color: "#6b7280"}}>
                    {player.winRate}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
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
    maxWidth: "600px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    border: "3px solid #10b981",
    textAlign: "center",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: "10px",
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
    margin: "0 0 5px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: "0 0 20px 0",
  },
  listContainer: {
    overflowY: "auto",
    paddingRight: "5px",
    flex: 1, // Allow list to scroll inside card
  },
  rowHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 15px",
    borderBottom: "2px solid #e5e7eb",
    fontWeight: "bold",
    color: "#6b7280",
    fontSize: "14px",
    textTransform: "uppercase",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    borderBottom: "1px solid #f3f4f6",
    transition: "transform 0.2s",
  },
};