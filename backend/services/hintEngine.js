// backend/services/hintEngine.js

// -------------------------------------------------------
// LAYER 1: Conflict Hint
// Finds cells where the player placed a wrong number
// that conflicts with row/col/box rules
// -------------------------------------------------------
function getConflictHint(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val === 0) continue;

      // Check row
      for (let i = 0; i < 9; i++) {
        if (i !== c && board[r][i] === val) {
          return {
            layer: 1,
            type: "conflict",
            message: `Conflict found! Row ${r + 1} has duplicate ${val}.`,
            cells: [{ r, c }, { r, c: i }]
          };
        }
      }
      // Check col
      for (let i = 0; i < 9; i++) {
        if (i !== r && board[i][c] === val) {
          return {
            layer: 1,
            type: "conflict",
            message: `Conflict found! Column ${c + 1} has duplicate ${val}.`,
            cells: [{ r, c }, { r: i, c }]
          };
        }
      }
      // Check 3x3 box
      const boxR = Math.floor(r / 3) * 3;
      const boxC = Math.floor(c / 3) * 3;
      for (let i = boxR; i < boxR + 3; i++) {
        for (let j = boxC; j < boxC + 3; j++) {
          if ((i !== r || j !== c) && board[i][j] === val) {
            return {
              layer: 1,
              type: "conflict",
              message: `Conflict found! The 3×3 box has duplicate ${val}.`,
              cells: [{ r, c }, { r: i, c: j }]
            };
          }
        }
      }
    }
  }
  return null;
}

// -------------------------------------------------------
// LAYER 2: Candidate Hint
// Shows possible values for the most constrained empty cell
// -------------------------------------------------------
function getCandidates(board, r, c) {
  const used = new Set();
  for (let i = 0; i < 9; i++) {
    if (board[r][i] !== 0) used.add(board[r][i]);
    if (board[i][c] !== 0) used.add(board[i][c]);
  }
  const boxR = Math.floor(r / 3) * 3;
  const boxC = Math.floor(c / 3) * 3;
  for (let i = boxR; i < boxR + 3; i++) {
    for (let j = boxC; j < boxC + 3; j++) {
      if (board[i][j] !== 0) used.add(board[i][j]);
    }
  }
  return [1,2,3,4,5,6,7,8,9].filter(n => !used.has(n));
}

function getCandidateHint(board) {
  let best = null;
  let minCandidates = 10;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;
      const candidates = getCandidates(board, r, c);
      if (candidates.length < minCandidates) {
        minCandidates = candidates.length;
        best = { r, c, candidates };
      }
    }
  }

  if (!best) return null;
  return {
    layer: 2,
    type: "candidate",
    message: `Cell (Row ${best.r + 1}, Col ${best.c + 1}) can only be: ${best.candidates.join(", ")}`,
    cells: [{ r: best.r, c: best.c }],
    candidates: best.candidates
  };
}

// -------------------------------------------------------
// LAYER 3: Elimination Hint
// Naked Single — a cell with only ONE possible candidate
// -------------------------------------------------------
function getEliminationHint(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;
      const candidates = getCandidates(board, r, c);
      if (candidates.length === 1) {
        return {
          layer: 3,
          type: "elimination",
          message: `Cell (Row ${r + 1}, Col ${c + 1}) — all other numbers are eliminated. Only ${candidates[0]} fits here.`,
          cells: [{ r, c }],
          candidates
        };
      }
    }
  }
  return null;
}

// -------------------------------------------------------
// LAYER 4: Technique Hint
// Hidden Single — only one cell in a row/col/box can hold a value
// -------------------------------------------------------
function getTechniqueHint(board) {
  // Check rows
  for (let r = 0; r < 9; r++) {
    for (let num = 1; num <= 9; num++) {
      const possibleCols = [];
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0 && getCandidates(board, r, c).includes(num)) {
          possibleCols.push(c);
        }
      }
      if (possibleCols.length === 1) {
        const c = possibleCols[0];
        return {
          layer: 4,
          type: "technique",
          technique: "Hidden Single",
          message: `Hidden Single in Row ${r + 1}: ${num} can only go in column ${c + 1}.`,
          cells: [{ r, c }],
          candidates: [num]
        };
      }
    }
  }
  // Check columns
  for (let c = 0; c < 9; c++) {
    for (let num = 1; num <= 9; num++) {
      const possibleRows = [];
      for (let r = 0; r < 9; r++) {
        if (board[r][c] === 0 && getCandidates(board, r, c).includes(num)) {
          possibleRows.push(r);
        }
      }
      if (possibleRows.length === 1) {
        const r = possibleRows[0];
        return {
          layer: 4,
          type: "technique",
          technique: "Hidden Single",
          message: `Hidden Single in Column ${c + 1}: ${num} can only go in row ${r + 1}.`,
          cells: [{ r, c }],
          candidates: [num]
        };
      }
    }
  }
  // Check 3x3 boxes
  for (let boxR = 0; boxR < 3; boxR++) {
    for (let boxC = 0; boxC < 3; boxC++) {
      for (let num = 1; num <= 9; num++) {
        const possible = [];
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = boxR * 3 + i;
            const c = boxC * 3 + j;
            if (board[r][c] === 0 && getCandidates(board, r, c).includes(num)) {
              possible.push({ r, c });
            }
          }
        }
        if (possible.length === 1) {
          const { r, c } = possible[0];
          return {
            layer: 4,
            type: "technique",
            technique: "Hidden Single",
            message: `Hidden Single in Box (${boxR + 1},${boxC + 1}): ${num} can only go in one cell.`,
            cells: [{ r, c }],
            candidates: [num]
          };
        }
      }
    }
  }
  return null;
}

// -------------------------------------------------------
// LAYER 5: Reveal Hint — show correct value, max penalty
// -------------------------------------------------------
function getRevealHint(board, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        return {
          layer: 5,
          type: "reveal",
          message: `Cell (Row ${r + 1}, Col ${c + 1}) = ${solution[r][c]}. (Max penalty applied)`,
          cells: [{ r, c }],
          reveal: { r, c, value: solution[r][c] }
        };
      }
    }
  }
  return null;
}

// -------------------------------------------------------
// MAIN: getHint — tries each layer in order
// -------------------------------------------------------
exports.getHint = function(board, solution) {
  return (
    getConflictHint(board) ||
    getEliminationHint(board) ||
    getTechniqueHint(board) ||
    getCandidateHint(board) ||
    getRevealHint(board, solution)
  );
};