import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const HINT_PENALTIES = { 1: 0, 2: 5, 3: 10, 4: 15, 5: 30 };
const HINT_COLORS = {
  conflict:    "#fee2e2", // red
  elimination: "#fef9c3", // yellow
  technique:   "#e0f2fe", // blue
  candidate:   "#f3e8ff", // purple
  reveal:      "#ffedd5", // orange
};

export default function SinglePlayerSudoku() {
  const navigate = useNavigate();
  const [board, setBoard]           = useState([]);
  const [initial, setInitial]       = useState([]);
  const [solution, setSolution]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [status, setStatus]         = useState("playing"); // playing | won
  const [timer, setTimer]           = useState(0);
  const [hintsUsed, setHintsUsed]   = useState(0);
  const [hintPenalty, setHintPenalty] = useState(0);
  const [hint, setHint]             = useState(null);   // current hint object
  const [hintCells, setHintCells]   = useState([]);     // [{r,c}] to highlight
  const [msg, setMsg]               = useState("");
  const [loading, setLoading]       = useState(true);
  const [stats, setStats]           = useState(null);
  const timerRef = useRef(null);

  useEffect(() => { fetchPuzzle(); fetchStats(); }, []);

  useEffect(() => {
    if (status === "playing") {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  async function fetchPuzzle() {
    setLoading(true);
    setHint(null);
    setHintCells([]);
    setMsg("");
    setTimer(0);
    setHintsUsed(0);
    setHintPenalty(0);
    setStatus("playing");
    try {
      const res = await axiosClient.get("/sudoku/generate");
      setBoard(JSON.parse(JSON.stringify(res.data.puzzle)));
      setInitial(JSON.parse(JSON.stringify(res.data.puzzle)));
      setSolution(res.data.solution);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await axiosClient.get("/sudoku/stats");
      setStats(res.data.stats?.practiceStats);
    } catch {}
  }

  function handleInput(r, c, value) {
    if (status !== "playing") return;
    if (initial[r]?.[c] !== 0) return;
    const newBoard = board.map(row => [...row]);
    if (value === "") { newBoard[r][c] = 0; }
    else {
      const num = Number(value);
      if (!isNaN(num) && num >= 1 && num <= 9) newBoard[r][c] = num;
      else return;
    }
    setBoard(newBoard);
    setHint(null);
    setHintCells([]);
  }

  async function handleHint() {
    if (status !== "playing") return;
    try {
      const res = await axiosClient.post("/sudoku/hint", { board, solution });
      const h = res.data;
      if (!h.type) { setMsg(h.msg); return; }

      const penalty = HINT_PENALTIES[h.layer] || 0;
      setHintsUsed(n => n + 1);
      setHintPenalty(p => p + penalty);
      setHint(h);
      setHintCells(h.cells || []);

      // If it's a reveal hint, auto-fill the cell
      if (h.type === "reveal" && h.reveal) {
        const newBoard = board.map(row => [...row]);
        newBoard[h.reveal.r][h.reveal.c] = h.reveal.value;
        setBoard(newBoard);
      }

      setMsg(`💡 ${h.message} ${penalty > 0 ? `(+${penalty}s penalty)` : ""}`);
      setTimeout(() => { setMsg(""); setHintCells([]); }, 5000);
    } catch {
      setMsg("Could not get hint");
    }
  }

  async function handleCheck() {
    const isCorrect = JSON.stringify(board) === JSON.stringify(solution);
    if (isCorrect) {
      setStatus("won");
      clearInterval(timerRef.current);
      const totalTime = timer + hintPenalty;
      try {
        await axiosClient.post("/sudoku/complete", {
          timeTaken: totalTime,
          hintsUsed,
          difficulty: "medium"
        });
        await fetchStats(); // refresh stats panel
      } catch {}
    } else {
      setMsg("❌ Not correct yet — keep going!");
      setTimeout(() => setMsg(""), 3000);
    }
  }

  function restart() {
    setBoard(JSON.parse(JSON.stringify(initial)));
    setHint(null);
    setHintCells([]);
    setMsg("");
    setTimer(0);
    setHintsUsed(0);
    setHintPenalty(0);
    setStatus("playing");
  }

  function format(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function isHintCell(r, c) {
    return hintCells.some(h => h.r === r && h.c === c);
  }

  if (loading) return (
    <div style={s.container}>
      <h2 style={{ color: "#1f2937" }}>Generating Puzzle...</h2>
    </div>
  );

  return (
    <div style={s.container}>
      {/* NAV */}
      <nav style={s.nav}>
        <span style={s.navLogo}>🧩 Practice Arena</span>
        <button onClick={() => navigate("/dashboard")} style={s.navBtn}>Dashboard</button>
      </nav>

      <div style={s.layout}>

        {/* LEFT: BOARD */}
        <div style={s.card}>
          {/* Timer + controls */}
          <div style={s.topRow}>
            <div style={s.timerBox}>
              ⏱ {format(timer)}
              {hintPenalty > 0 && (
                <span style={s.penalty}> +{hintPenalty}s penalty</span>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={restart} style={s.btnGray}>Restart</button>
              <button onClick={fetchPuzzle} style={s.btnGray}>New Game</button>
            </div>
          </div>

          {msg && <div style={s.msgBox}>{msg}</div>}

          {/* Hint badge */}
          {hint && (
            <div style={{ ...s.hintBadge, backgroundColor: HINT_COLORS[hint.type] || "#f3f4f6" }}>
              <span style={s.hintLayer}>Layer {hint.layer}</span>
              {hint.technique && <span style={s.hintTech}>{hint.technique}</span>}
              <span style={s.hintMsg}>{hint.message}</span>
              {hint.candidates && (
                <div style={s.candidateRow}>
                  {hint.candidates.map(n => (
                    <span key={n} style={s.candidateBubble}>{n}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Board */}
          <div style={s.boardWrap}>
            <div style={s.board}>
              {board.map((row, r) =>
                row.map((val, c) => {
                  const isPrefilled = initial[r]?.[c] !== 0;
                  const isSelected  = selected?.r === r && selected?.c === c;
                  const isHighlighted = isHintCell(r, c);
                  const thickR = c === 2 || c === 5;
                  const thickB = r === 2 || r === 5;

                  let bg = "#ffffff";
                  if (isPrefilled) bg = "#dcfce7";
                  if (isHighlighted) bg = hint ? (HINT_COLORS[hint.type] || "#fef08a") : "#fef08a";
                  if (isSelected && !isPrefilled) bg = "#dbeafe";
                  if (status === "won") bg = "#dcfce7";

                  return (
                    <input
                      key={`${r}-${c}`}
                      readOnly={isPrefilled || status !== "playing"}
                      value={val === 0 ? "" : val}
                      maxLength={1}
                      onClick={() => setSelected({ r, c })}
                      onChange={e => handleInput(r, c, e.target.value)}
                      style={{
                        ...s.cell,
                        backgroundColor: bg,
                        color: isPrefilled ? "#059669" : "#1f2937",
                        fontWeight: isPrefilled ? "bold" : "600",
                        borderRight: thickR ? "2px solid #10b981" : "1px solid #d1d5db",
                        borderBottom: thickB ? "2px solid #10b981" : "1px solid #d1d5db",
                        cursor: isPrefilled ? "default" : "text",
                        outline: isSelected ? "2px solid #3b82f6" : "none",
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Action buttons */}
          {status === "playing" && (
            <div style={s.actionRow}>
              <button onClick={handleHint} style={s.btnHint}>
                💡 Hint ({hintsUsed} used)
              </button>
              <button onClick={handleCheck} style={s.btnCheck}>
                ✅ Check Solution
              </button>
            </div>
          )}

          {status === "won" && (
            <div style={s.winBanner}>
              <h2 style={{ color: "#10b981", margin: 0 }}>🎉 Puzzle Solved!</h2>
              <p>Time: {format(timer + hintPenalty)} · Hints: {hintsUsed}</p>
              <button onClick={fetchPuzzle} style={s.btnCheck}>Next Puzzle</button>
            </div>
          )}
        </div>

        {/* RIGHT: STATS PANEL */}
        <div style={s.statsCard}>
          <h3 style={s.statsTitle}>Your Practice Stats</h3>

          {stats ? (
            <>
              <div style={s.statRow}>
                <span>🧩 Puzzles Solved</span>
                <strong>{stats.puzzlesSolved}</strong>
              </div>
              <div style={s.statRow}>
                <span>💡 Total Hints Used</span>
                <strong>{stats.totalHintsUsed}</strong>
              </div>
              <div style={s.statRow}>
                <span>⏱ Total Time</span>
                <strong>{format(stats.totalTimeTaken)}</strong>
              </div>
              <div style={s.statRow}>
                <span>📊 Avg Time</span>
                <strong>
                  {stats.puzzlesSolved > 0
                    ? format(Math.floor(stats.totalTimeTaken / stats.puzzlesSolved))
                    : "--"}
                </strong>
              </div>

              {/* Recent history */}
              {stats.history?.length > 0 && (
                <>
                  <h4 style={s.histTitle}>Recent Games</h4>
                  <div style={s.histList}>
                    {[...stats.history].reverse().slice(0, 5).map((h, i) => (
                      <div key={i} style={s.histItem}>
                        <span>#{stats.history.length - i}</span>
                        <span>{format(h.timeTaken)}</span>
                        <span style={s.hintCount}>💡{h.hintsUsed}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading stats...</p>
          )}

          {/* Hint legend */}
          <h4 style={s.histTitle}>Hint Layers</h4>
          {[
            { layer: 1, label: "Conflict",    penalty: 0,  color: HINT_COLORS.conflict },
            { layer: 2, label: "Candidates",  penalty: 5,  color: HINT_COLORS.candidate },
            { layer: 3, label: "Elimination", penalty: 10, color: HINT_COLORS.elimination },
            { layer: 4, label: "Technique",   penalty: 15, color: HINT_COLORS.technique },
            { layer: 5, label: "Reveal",      penalty: 30, color: HINT_COLORS.reveal },
          ].map(({ layer, label, penalty, color }) => (
            <div key={layer} style={{ ...s.legendRow, backgroundColor: color }}>
              <span>L{layer} — {label}</span>
              <span>{penalty > 0 ? `+${penalty}s` : "Free"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  container:    { minHeight: "100vh", background: "linear-gradient(135deg, #f1f8f3 0%, #91f8ab 100%)", display: "flex", flexDirection: "column", alignItems: "center" },
  nav:          { width: "100%", backgroundColor: "#fff", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", borderBottom: "3px solid #10b981", marginBottom: "24px" },
  navLogo:      { fontSize: "22px", fontWeight: "bold", color: "#1f2937" },
  navBtn:       { padding: "8px 16px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  layout:       { display: "flex", gap: "24px", width: "100%", maxWidth: "960px", padding: "0 20px 40px", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" },
  card:         { backgroundColor: "#fff", borderRadius: "16px", padding: "24px", border: "3px solid #10b981", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", flex: "0 0 auto" },
  topRow:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  timerBox:     { fontSize: "20px", fontWeight: "bold", color: "#10b981", background: "#ecfdf5", padding: "6px 12px", borderRadius: "8px" },
  penalty:      { fontSize: "13px", color: "#ef4444", marginLeft: "8px" },
  btnGray:      { padding: "6px 14px", backgroundColor: "#6b7280", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  msgBox:       { backgroundColor: "#fef9c3", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", fontSize: "14px", color: "#92400e" },
  hintBadge:    { borderRadius: "10px", padding: "12px 16px", marginBottom: "14px", border: "1px solid rgba(0,0,0,0.08)" },
  hintLayer:    { fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#6b7280", marginRight: "8px" },
  hintTech:     { fontSize: "12px", fontWeight: "bold", color: "#7c3aed", background: "#ede9fe", borderRadius: "4px", padding: "2px 6px", marginRight: "8px" },
  hintMsg:      { fontSize: "14px", color: "#1f2937" },
  candidateRow: { display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" },
  candidateBubble: { backgroundColor: "#fff", border: "1px solid #d1d5db", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" },
  boardWrap:    { display: "flex", justifyContent: "center", marginBottom: "16px" },
  board:        { display: "grid", gridTemplateColumns: "repeat(9, 1fr)", border: "3px solid #10b981", borderRadius: "8px", overflow: "hidden" },
  cell:         { width: "42px", height: "42px", textAlign: "center", fontSize: "18px", border: "none", transition: "background 0.2s" },
  actionRow:    { display: "flex", gap: "10px" },
  btnHint:      { flex: 1, padding: "12px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" },
  btnCheck:     { flex: 1, padding: "12px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" },
  winBanner:    { textAlign: "center", padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "10px", marginTop: "8px" },
  statsCard:    { backgroundColor: "#fff", borderRadius: "16px", padding: "24px", border: "3px solid #10b981", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", width: "240px", minWidth: "220px" },
  statsTitle:   { fontSize: "18px", fontWeight: "bold", color: "#1f2937", marginTop: 0, marginBottom: "16px" },
  statRow:      { display: "flex", justifyContent: "space-between", fontSize: "14px", padding: "8px 0", borderBottom: "1px solid #f3f4f6", color: "#374151" },
  histTitle:    { fontSize: "14px", fontWeight: "bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "16px 0 8px" },
  histList:     { display: "flex", flexDirection: "column", gap: "6px" },
  histItem:     { display: "flex", justifyContent: "space-between", fontSize: "13px", backgroundColor: "#f9fafb", borderRadius: "6px", padding: "6px 10px" },
  hintCount:    { color: "#f59e0b" },
  legendRow:    { display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "6px 10px", borderRadius: "6px", marginBottom: "4px" },
};