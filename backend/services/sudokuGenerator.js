// backend/services/sudokuGenerator.js

function getEmptyBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

// Check if placing a number is valid
function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    // Check Row & Column
    if (board[row][i] === num && i !== col) return false;
    if (board[i][col] === num && i !== row) return false;
    
    // Check 3x3 Block
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + i % 3;
    if (board[boxRow][boxCol] === num && (boxRow !== row || boxCol !== col)) return false;
  }
  return true;
}

// Backtracking Solver to fill the board
function fillBoard(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (let num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

exports.generateSudoku = () => {
  // 1. Create a full, valid solution
  const solution = getEmptyBoard();
  fillBoard(solution);

  // 2. Create the playable puzzle (remove 40 numbers)
  const puzzle = solution.map(row => [...row]); 
  let attempts = 40;
  while (attempts > 0) {
    let r = Math.floor(Math.random() * 9);
    let c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      attempts--;
    }
  }

  return { puzzle, solution };
};