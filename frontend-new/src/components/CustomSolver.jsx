import { useState } from "react";

export default function CustomSolver() {
  const [board, setBoard] = useState(
    Array.from({ length: 9 }, () => Array(9).fill(0))
  );
  const [message, setMessage] = useState("");

  function handleInput(r, c, value) {
    const newBoard = [...board];
    newBoard[r][c] = Number(value) || 0;
    setBoard(newBoard);
  }

  function isValid(board, r, c, num) {
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === num) return false;
      if (board[i][c] === num) return false;
      const boxRow = 3 * Math.floor(r / 3) + Math.floor(i / 3);
      const boxCol = 3 * Math.floor(c / 3) + (i % 3);
      if (board[boxRow][boxCol] === num) return false;
    }
    return true;
  }

  function solveSudoku(b) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(b, r, c, n)) {
              b[r][c] = n;
              if (solveSudoku(b)) return true;
              b[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function solve() {
    const copy = JSON.parse(JSON.stringify(board));
    if (solveSudoku(copy)) {
      setBoard(copy);
      setMessage("Solution Found 🎉");
    } else {
      setMessage("No Solution ❌");
    }
  }

  return (
    <div>
      <h2>Custom Sudoku Solver</h2>

      {message && <p><b>{message}</b></p>}

      {board.map((row, r) => (
        <div key={r} style={{ display: "flex" }}>
          {row.map((val, c) => (
            <input
              key={c}
              value={val || ""}
              maxLength={1}
              onChange={e => handleInput(r, c, e.target.value)}
              style={{
                width: 40,
                height: 40,
                textAlign: "center",
                margin: 1,
                fontSize: 18,
                border: "1px solid black"
              }}
            />
          ))}
        </div>
      ))}

      <br />
      <button onClick={solve}>Solve</button>
    </div>
  );
}
