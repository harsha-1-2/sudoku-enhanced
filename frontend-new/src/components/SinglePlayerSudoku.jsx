import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ---------- PUZZLES ---------- */
const easyPuzzle = [
  [5,3,0,0,7,0,0,0,0],
  [6,0,0,1,9,5,0,0,0],
  [0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],
  [4,0,0,8,0,3,0,0,1],
  [7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],
  [0,0,0,4,1,9,0,0,5],
  [0,0,0,0,8,0,0,7,9]
];

const mediumPuzzle = [
  [0,0,0,0,6,0,7,0,0],
  [0,0,0,1,0,9,0,0,0],
  [3,0,9,0,0,0,0,6,0],
  [0,5,0,0,0,0,0,0,8],
  [0,0,6,0,0,0,5,0,0],
  [7,0,0,0,0,0,0,4,0],
  [0,2,0,0,0,0,6,0,3],
  [0,0,0,4,0,3,0,0,0],
  [0,0,8,0,7,0,0,0,0]
];

const hardPuzzle = [
  [0,0,0,6,0,0,4,0,0],
  [7,0,0,0,0,3,6,0,0],
  [0,0,0,0,9,1,0,8,0],
  [0,0,0,0,0,0,0,0,0],
  [0,5,0,1,8,0,0,0,3],
  [0,0,0,3,0,6,0,4,5],
  [0,4,0,2,0,0,0,6,0],
  [9,0,3,0,0,0,0,0,0],
  [0,2,0,0,0,0,1,0,0]
];

function clone(g){return g.map(r=>r.slice())}

/* ---------- VALIDATION ---------- */
function isValid(grid,row,col,num){
  for(let x=0;x<9;x++){
    if(grid[row][x]===num||grid[x][col]===num)return false;
  }
  const r=Math.floor(row/3)*3,c=Math.floor(col/3)*3;
  for(let i=r;i<r+3;i++){
    for(let j=c;j<c+3;j++){
      if(grid[i][j]===num)return false;
    }
  }
  return true;
}

/* ---------- SOLVER ---------- */
function solveSudoku(grid){
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(grid[r][c]===0){
        for(let n=1;n<=9;n++){
          if(isValid(grid,r,c,n)){
            grid[r][c]=n;
            if(solveSudoku(grid))return true;
            grid[r][c]=0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/* ---------- CHECK SOLUTION ---------- */
function checkSolution(board){
  // Check if board is complete
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(board[r][c]===0)return "incomplete";
    }
  }
  
  // Check if solution is valid
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      const num=board[r][c];
      board[r][c]=0; // temporarily remove
      if(!isValid(board,r,c,num)){
        board[r][c]=num; // restore
        return "incorrect";
      }
      board[r][c]=num; // restore
    }
  }
  return "correct";
}

/* ================ COMPONENT =================== */
export default function SinglePlayerSudoku(){
  const navigate = useNavigate();

  /* GAME TAB STATE */
  const [tab,setTab]=useState("play");

  const [board,setBoard]=useState(clone(easyPuzzle));
  const [original,setOriginal]=useState(clone(easyPuzzle));
  const [difficulty,setDifficulty]=useState("easy");

  const [timer,setTimer]=useState(0);
  const [running,setRunning]=useState(false);
  const [msg,setMsg]=useState("");

  /* CUSTOM TAB STATE */
  const [custom,setCustom]=useState(
    Array.from({length:9},()=>Array(9).fill(""))
  );

  const timerRef=useRef(null);

  /* TIMER */
  useEffect(()=>{
    if(running){
      timerRef.current=setInterval(()=>setTimer(t=>t+1),1000);
    }else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[running]);

  function format(sec){
    const m=String(Math.floor(sec/60)).padStart(2,"0");
    const s=String(sec%60).padStart(2,"0");
    return`${m}:${s}`;
  }

  /* LOAD PUZZLE */
  function load(level){
    let p=level==="easy"?easyPuzzle:level==="medium"?mediumPuzzle:hardPuzzle;
    setBoard(clone(p));
    setOriginal(clone(p));
    setDifficulty(level);
    setTimer(0);
    setMsg("");
    setRunning(true);
  }

  function change(r,c,e){
    if(original[r][c]!==0)return;
    const v=e.target.value;
    if(v===""||/^[1-9]$/.test(v)){
      setBoard(prev=>{
        const copy=clone(prev);
        copy[r][c]=v===""?0:Number(v);
        return copy;
      });
    }
  }

  function solve(){
    const copy=clone(board);
    if(solveSudoku(copy)){
      setBoard(copy);
      setMsg("Solved 🎉");
      setRunning(false);
    }else setMsg("❌ No Solution");
  }

  function restart(){
    setBoard(clone(original));
    setTimer(0);
    setMsg("");
    setRunning(true);
  }

  function toggleTimer(){
    setRunning(!running);
  }

  function checkMyAnswer(){
    const result = checkSolution(clone(board));
    
    if(result === "incomplete"){
      setMsg("⚠️ Puzzle is not complete yet! Keep going!");
    } else if(result === "incorrect"){
      setMsg("❌ Oops! There are some mistakes. Try again!");
    } else {
      setRunning(false);
      const timeStr = format(timer);
      if(timer < 300){ // less than 5 minutes
        setMsg(`🎉 Perfect! You solved it in ${timeStr}! Amazing speed! 🚀`);
      } else if(timer < 600){ // less than 10 minutes
        setMsg(`✨ Excellent! You solved it in ${timeStr}! Great job! 👏`);
      } else {
        setMsg(`🎊 Congratulations! You solved it in ${timeStr}! Keep it up! 💪`);
      }
    }
  }

  /* CUSTOM CHANGES */
  function customChange(r,c,e){
    const v=e.target.value;
    if(v===""||/^[1-9]$/.test(v)){
      setCustom(prev=>{
        const copy=prev.map(r=>r.slice());
        copy[r][c]=v;
        return copy;
      });
    }
  }

  function solveCustom(){
    const grid=custom.map(row=>row.map(v=>v===""?0:Number(v)));
    const c=clone(grid);
    if(solveSudoku(c)){
      setCustom(c.map(r=>r.map(n=>String(n))));
      setMsg("Custom puzzle solved! 🎉");
    }else{
      setMsg("❌ No solution exists for this puzzle");
    }
  }

  function clearCustom(){
    setCustom(Array.from({length:9},()=>Array(9).fill("")));
    setMsg("");
  }

  return(
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
          ← Back
        </button>
      </div>

      {/* TABS */}
      <div style={styles.tabContainer}>
        <button 
          onClick={()=>{setTab("play"); setMsg("");}}
          style={{...styles.tab, ...(tab==="play" ? styles.tabActive : {})}}
        >
          Play Sudoku
        </button>
        <button 
          onClick={()=>{setTab("custom"); setMsg("");}}
          style={{...styles.tab, ...(tab==="custom" ? styles.tabActive : {})}}
        >
          Custom Sudoku
        </button>
      </div>

      {/* ================= PLAY MODE ================= */}
      {tab==="play"&&(
        <div style={styles.content}>
          <h1 style={styles.title}>Single Player Sudoku</h1>
          <div style={styles.timerContainer}>
            <p style={styles.timer}>Time: <span style={styles.timerValue}>{format(timer)}</span></p>
            <button onClick={toggleTimer} style={styles.pauseButton}>
              {running ? " Pause" : " Resume"}
            </button>
          </div>

          <div style={styles.controls}>
            <select value={difficulty} onChange={e=>load(e.target.value)} style={styles.select}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <button onClick={restart} style={styles.button}>Restart</button>
            <button onClick={checkMyAnswer} style={styles.checkButton}>Check</button>
            <button onClick={solve} style={styles.solveButton}>Solve</button>
          </div>

          {msg&&<p style={styles.message}>{msg}</p>}

          <div style={styles.boardContainer}>
            <div style={styles.board}>
              {board.map((row,r)=>
                row.map((val,c)=>{
                  const isThickRight = (c === 2 || c === 5);
                  const isThickBottom = (r === 2 || r === 5);
                  
                  return (
                    <input
                      key={`${r}-${c}`}
                      value={val===0?"":val}
                      onChange={e=>change(r,c,e)}
                      maxLength={1}
                      style={{
                        ...styles.cell,
                        ...(original[r][c]!==0 ? styles.prefilled : {}),
                        borderRight: isThickRight ? "2px solid #10b981" : "1px solid #999696ff",
                        borderBottom: isThickBottom ? "2px solid #10b981" : "1px solid #999696ff",
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= CUSTOM MODE ================= */}
      {tab==="custom"&&(
        <div style={styles.content}>
          <h2 style={styles.title}>Build Your Own Sudoku</h2>
          <p style={styles.subtitle}>Enter numbers 1-9 or leave blank</p>

          <div style={styles.boardContainer}>
            <div style={styles.board}>
              {custom.map((row,r)=>
                row.map((val,c)=>{
                  const isThickRight = (c === 2 || c === 5);
                  const isThickBottom = (r === 2 || r === 5);
                  
                  return (
                    <input
                      key={`${r}-${c}`}
                      value={val}
                      maxLength={1}
                      onChange={e=>customChange(r,c,e)}
                      style={{
                        ...styles.cell,
                        borderRight: isThickRight ? "2px solid #10b981" : "1px solid #d1d5db",
                        borderBottom: isThickBottom ? "2px solid #10b981" : "1px solid #d1d5db",
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>

          {msg&&<p style={styles.message}>{msg}</p>}

          <div style={styles.controls}>
            <button onClick={solveCustom} style={styles.solveButton}>Solve</button>
            <button onClick={clearCustom} style={styles.clearButton}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f1f8f3ff 0%, #91f8abff 100%)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    width: "100%",
    maxWidth: "600px",
    marginBottom: "15px",
  },
  backBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#12f137ff",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "8px",
    cursor: "pointer",
    backdropFilter: "blur(10px)",
  },
  tabContainer: {
    width: "100%",
    maxWidth: "600px",
    display: "flex",
    gap: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: "5px",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    marginBottom: "20px",
  },
  tab: {
    flex: 1,
    padding: "10px",
    fontSize: "15px",
    fontWeight: "600",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "rgba(22, 22, 22, 0.7)",
  },
  tabActive: {
    backgroundColor: "#10b981",
    color: "#ffffff",
  },
  content: {
    width: "100%",
    maxWidth: "600px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "25px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    border: "3px solid #10b981",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#161616ff",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    textAlign: "center",
    color: "#0f0f0fff",
    margin: "0 0 20px 0",
  },
  timerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },
  timer: {
    fontSize: "16px",
    color: "#6b7280",
    margin: 0,
  },
  timerValue: {
    fontWeight: "bold",
    color: "#10b981",
    fontSize: "18px",
  },
  pauseButton: {
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#53818dff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  controls: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  select: {
    padding: "8px 14px",
    fontSize: "14px",
    border: "2px solid #10b981",
    borderRadius: "8px",
    backgroundColor: "#ebeef3ff",
    color: "#1f2937",
    cursor: "pointer",
    fontWeight: "600",
  },
  button: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#d3cdcdff",
    backgroundColor: "#6b7280",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  checkButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  solveButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  clearButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#ef4444",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  message: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    color: "#10b981",
    margin: "0 0 15px 0",
  },
  boardContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(9, 1fr)",
    gap: "0",
    border: "3px solid #10b981",
    borderRadius: "8px",
    overflow: "hidden",
  },
  cell: {
    width: "40px",
    height: "40px",
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "600",
    backgroundColor: "#ffffff",
    color: "#1f2937",
    outline: "none",
    border: "none",
    borderRight: "1px solid #d1d5db",
    borderBottom: "1px solid #d1d5db",
  },
  prefilled: {
    backgroundColor: "#dcfce7",
    color: "#059669",
    fontWeight: "bold",
  },
};