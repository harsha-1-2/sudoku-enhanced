import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../hooks/useSocket";

export default function MultiplayerGame() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState([]);
  const [initialBoard, setInitialBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [timer, setTimer] = useState(0);
  const [msg, setMsg] = useState("");

  // 1. SOCKET CONNECTION LOGIC
  useEffect(() => {
    // ✅ Ensure socket is connected before joining room
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join_room", roomId);

    socket.on("joined_room", (grid) => {
      setBoard(grid);
      setInitialBoard(JSON.parse(JSON.stringify(grid)));
    });

    socket.on("player_joined", ({ count }) => {
      if (count === 2) setMsg("Opponent connected! Starting soon...");
    });

    socket.on("start_game", () => {
      setGameStatus("playing");
      setMsg("");
    });

    socket.on("game_over", ({ winnerId }) => {
      if (winnerId === socket.id) {
        setGameStatus("won");
        setMsg("");
      } else {
        setGameStatus("lost");
        setMsg("");
      }
    });

    socket.on("wrong_solution", () => {
      setMsg("❌ Incorrect solution! Keep trying.");
      setTimeout(() => setMsg(""), 3000);
    });

    socket.on("opponent_disconnected", () => {
      setMsg("Opponent disconnected. You win!");
      setGameStatus("won");
    });

    socket.on("room_error", (err) => {
      alert(err);
      navigate("/dashboard");
    });

    return () => {
      socket.off("joined_room");
      socket.off("player_joined");
      socket.off("start_game");
      socket.off("game_over");
      socket.off("wrong_solution");
      socket.off("opponent_disconnected");
      socket.off("room_error");
    };
  }, [roomId, navigate]);

  // 2. TIMER LOGIC
  useEffect(() => {
    let interval;
    if (gameStatus === "playing") {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  // 3. INPUT HANDLER
  function handleInput(r, c, value) {
    if (gameStatus !== "playing") return;
    if (initialBoard[r] && initialBoard[r][c] !== 0) return;

    const newBoard = board.map(row => [...row]);
    if (value === "") {
      newBoard[r][c] = 0;
    } else {
      const num = Number(value);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        newBoard[r][c] = num;
      } else {
        return;
      }
    }
    setBoard(newBoard);
  }

  function handleSubmit() {
    socket.emit("submit_board", { roomId, board });
  }

  function format(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.roomBadge}>Room: {roomId}</div>
        <button onClick={() => navigate("/dashboard")} style={styles.quitBtn}>
          Quit Game
        </button>
      </div>

      {/* WAITING SCREEN */}
      {gameStatus === "waiting" && (
        <div style={styles.waitingCard}>
          <h2 style={styles.title}>Waiting for Opponent...</h2>
          <p style={styles.subtitle}>Share this Room ID:</p>
          <div style={styles.codeDisplay}>{roomId}</div>
          <div style={{fontSize: "40px", marginTop: "20px"}}>⏳</div>
          {msg && <p style={{color: "#10b981", marginTop: "15px", fontWeight: "bold"}}>{msg}</p>}
        </div>
      )}

      {/* GAME SCREEN */}
      {(gameStatus === "playing" || gameStatus === "won" || gameStatus === "lost") && (
        <div style={styles.gameCard}>
          <div style={styles.gameHeader}>
            <h2 style={styles.title}>Multiplayer Match</h2>
            <div style={styles.timerBadge}>⏱ {format(timer)}</div>
          </div>

          {msg && <p style={styles.errorMsg}>{msg}</p>}

          <div style={styles.boardContainer}>
            <div style={styles.board}>
              {board.map((row, r) =>
                row.map((val, c) => {
                  const isThickRight = (c === 2 || c === 5);
                  const isThickBottom = (r === 2 || r === 5);
                  const isPrefilled = initialBoard[r] && initialBoard[r][c] !== 0;

                  return (
                    <input
                      key={`${r}-${c}`}
                      readOnly={isPrefilled}
                      value={val === 0 ? "" : val}
                      onChange={(e) => handleInput(r, c, e.target.value)}
                      maxLength={1}
                      disabled={gameStatus !== "playing"}
                      style={{
                        ...styles.cell,
                        ...(isPrefilled ? styles.prefilled : {}),
                        borderRight: isThickRight ? "2px solid #10b981" : "1px solid #d1d5db",
                        borderBottom: isThickBottom ? "2px solid #10b981" : "1px solid #d1d5db",
                        backgroundColor:
                          gameStatus === "won" ? "#dcfce7" :
                          gameStatus === "lost" ? "#fee2e2" :
                          isPrefilled ? "#dcfce7" : "#ffffff",
                        cursor: isPrefilled ? "default" : "text"
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>

          {gameStatus === "playing" && (
            <button onClick={handleSubmit} style={styles.submitBtn}>
              Submit Solution 🚀
            </button>
          )}

          {gameStatus === "won" && (
            <div style={styles.resultBanner}>
              <h2 style={{color: "#10b981", margin: 0}}>🎉 VICTORY! 🎉</h2>
              <p>You solved it first!</p>
              <button onClick={() => navigate("/dashboard")} style={styles.quitBtn}>
                Back to Dashboard
              </button>
            </div>
          )}

          {gameStatus === "lost" && (
            <div style={styles.resultBanner}>
              <h2 style={{color: "#ef4444", margin: 0}}>😞 DEFEAT</h2>
              <p>Opponent finished first.</p>
              <button onClick={() => navigate("/dashboard")} style={styles.quitBtn}>
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "linear-gradient(135deg, #f1f8f3ff 0%, #91f8abff 100%)", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" },
  header: { width: "100%", maxWidth: "600px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  roomBadge: { backgroundColor: "#ffffff", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", color: "#10b981", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
  quitBtn: { backgroundColor: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  waitingCard: { backgroundColor: "#ffffff", padding: "40px", borderRadius: "16px", border: "3px solid #10b981", textAlign: "center", maxWidth: "500px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  codeDisplay: { fontSize: "36px", fontWeight: "bold", color: "#1f2937", letterSpacing: "4px", background: "#f3f4f6", padding: "10px", borderRadius: "8px", margin: "20px 0", border: "2px dashed #10b981" },
  gameCard: { backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "3px solid #10b981", maxWidth: "600px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  gameHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title: { margin: 0, color: "#1f2937", fontSize: "24px" },
  subtitle: { color: "#6b7280", marginTop: "5px" },
  timerBadge: { fontSize: "20px", fontWeight: "bold", color: "#10b981", background: "#ecfdf5", padding: "5px 10px", borderRadius: "6px" },
  errorMsg: { color: "#ef4444", textAlign: "center", fontWeight: "bold", marginBottom: "10px" },
  boardContainer: { display: "flex", justifyContent: "center", marginBottom: "20px" },
  board: { display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "0", border: "3px solid #10b981", borderRadius: "8px", overflow: "hidden" },
  cell: { width: "40px", height: "40px", textAlign: "center", fontSize: "18px", fontWeight: "600", outline: "none", border: "none" },
  prefilled: { fontWeight: "bold", color: "#059669" },
  submitBtn: { width: "100%", padding: "15px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontSize: "18px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)" },
  resultBanner: { textAlign: "center", marginTop: "20px", padding: "20px", backgroundColor: "#f9fafb", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" },
};