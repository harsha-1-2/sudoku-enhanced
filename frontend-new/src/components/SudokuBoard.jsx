import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

export default function SudokuBoard() {
  const navigate = useNavigate();
  const [grid, setGrid] = useState([]);
  const [original, setOriginal] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selected, setSelected] = useState({ r: null, c: null });
  const [message, setMessage] = useState("");
  const [time, setTime] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. FETCH FROM BACKEND
  useEffect(() => {
    fetchNewPuzzle();
  }, []);

  async function fetchNewPuzzle() {
    setLoading(true);
    try {
      const res = await axiosClient.get("/sudoku/generate");
      
      const newPuzzle = res.data.puzzle;
      const newSolution = res.data.solution;

      // Deep copy to ensure they are distinct arrays in memory
      setGrid(JSON.parse(JSON.stringify(newPuzzle)));
      setOriginal(JSON.parse(JSON.stringify(newPuzzle)));
      setSolution(newSolution);
      
      setMessage("");
      setTime(0);
    } catch (err) {
      console.error(err);
      setMessage("Error loading puzzle ❌");
    } finally {
      setLoading(false);
    }
  }

  // Timer
  useEffect(() => {
    const i = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  // ⭐ STRICT INPUT HANDLING
  function handleInput(r, c, value) {
    // 1. STRICT SECURITY CHECK
    // If the value in the 'original' grid is NOT 0, it means it's a starter number.
    // We strictly RETURN and do nothing.
    if (original[r][c] !== 0) {
        return; 
    }

    // 2. VALIDATION & UPDATE
    const newGrid = grid.map(row => [...row]); // Deep copy row
    
    if (value === "") {
      newGrid[r][c] = 0; // Allow clearing
    } else {
      const num = Number(value);
      // Only allow 1-9
      if (!isNaN(num) && num >= 1 && num <= 9) {
        newGrid[r][c] = num;
      } else {
        return; // Reject non-numbers
      }
    }
    setGrid(newGrid);
  }

  function restart() {
    setGrid(JSON.parse(JSON.stringify(original)));
    setMessage("");
    setTime(0);
  }

  function checkSolution() {
    // Simple JSON string comparison for checking
    if (JSON.stringify(grid) === JSON.stringify(solution)) {
      setMessage("🎉 Correct! You Win!");
    } else {
      setMessage("❌ Incorrect. Keep trying!");
    }
  }

  function format(sec){
    const m=String(Math.floor(sec/60)).padStart(2,"0");
    const s=String(sec%60).padStart(2,"0");
    return`${m}:${s}`;
  }

  if (loading) return <div style={styles.container}><h2 style={styles.title}>Generating Puzzle...</h2></div>;

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navLogo}>Sudoku Practice</div>
        <div style={styles.navLinks}>
          <button onClick={() => navigate("/dashboard")} style={styles.navButton}>
            Dashboard
          </button>
        </div>
      </nav>

      <div style={styles.content}>
        <h2 style={styles.title}>Practice Board</h2>
        <p style={styles.timer}>Time: <span style={styles.timerValue}>{format(time)}</span></p>

        <div style={styles.controls}>
          <button onClick={restart} style={styles.button}>Restart</button>
          <button onClick={fetchNewPuzzle} style={styles.button}>New Game</button>
          <button onClick={checkSolution} style={styles.solveButton}>Check</button>
        </div>

        {message && <p style={styles.message}>{message}</p>}

        <div style={styles.boardContainer}>
          <div style={styles.board}>
            {grid.map((row, r) =>
              row.map((val, c) => {
                const isThickRight = (c === 2 || c === 5);
                const isThickBottom = (r === 2 || r === 5);
                
                // Determine if this cell is part of the original puzzle
                const isOriginal = original[r][c] !== 0;

                return (
                  <input
                    key={`${r}-${c}`}
                    
                    // ⭐ OPTION A: READONLY (Best for UX, allows selection but no typing)
                    readOnly={isOriginal}
                    
                    // ⭐ OPTION B: DISABLED (Uncomment if ReadOnly fails. Blocks everything)
                    // disabled={isOriginal}

                    value={val === 0 ? "" : val}
                    onClick={() => setSelected({ r, c })}
                    onChange={(e) => handleInput(r, c, e.target.value)}
                    maxLength={1}
                    style={{
                      ...styles.cell,
                      ...(isOriginal ? styles.prefilled : {}),
                      ...(selected.r === r && selected.c === c ? styles.selected : {}),
                      borderRight: isThickRight ? "2px solid #10b981" : "1px solid #d1d5db",
                      borderBottom: isThickBottom ? "2px solid #10b981" : "1px solid #d1d5db",
                      // Visual cue that it's not editable
                      cursor: isOriginal ? "default" : "text" 
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "linear-gradient(135deg, #f1f8f3ff 0%, #91f8abff 100%)", display: "flex", flexDirection: "column", alignItems: "center" },
  navbar: { width: "100%", backgroundColor: "#ffffff", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", borderBottom: "3px solid #10b981", marginBottom: "30px" },
  navLogo: { fontSize: "24px", fontWeight: "bold", color: "#1f2937" },
  navButton: { padding: "8px 16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  content: { width: "100%", maxWidth: "600px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "25px", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)", border: "3px solid #10b981" },
  title: { fontSize: "28px", fontWeight: "bold", textAlign: "center", color: "#1f2937", margin: "0 0 10px 0" },
  timer: { fontSize: "16px", textAlign: "center", color: "#6b7280", margin: "0 0 20px 0" },
  timerValue: { fontWeight: "bold", color: "#10b981", fontSize: "18px" },
  controls: { display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" },
  button: { padding: "8px 16px", fontSize: "14px", fontWeight: "600", color: "#ffffff", backgroundColor: "#6b7280", border: "none", borderRadius: "8px", cursor: "pointer" },
  solveButton: { padding: "8px 16px", fontSize: "14px", fontWeight: "600", color: "#ffffff", backgroundColor: "#10b981", border: "none", borderRadius: "8px", cursor: "pointer" },
  message: { textAlign: "center", fontSize: "16px", fontWeight: "600", color: "#10b981", margin: "0 0 15px 0" },
  boardContainer: { display: "flex", justifyContent: "center", marginBottom: "10px" },
  board: { display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "0", border: "3px solid #10b981", borderRadius: "8px", overflow: "hidden" },
  cell: { width: "40px", height: "40px", textAlign: "center", fontSize: "18px", fontWeight: "600", backgroundColor: "#ffffff", color: "#1f2937", outline: "none", border: "none" },
  prefilled: { backgroundColor: "#dcfce7", color: "#059669", fontWeight: "bold" },
  selected: { backgroundColor: "#e0f2fe" }
};