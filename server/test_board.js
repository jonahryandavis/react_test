const { Board, PLAYER, SIDE } = require("./board")

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exit(1)
  } else {
    console.log(`PASS: ${message}`)
  }
}

console.log("--- Starting Board Tests ---")

// Test 1: Initialization
const board = new Board()
assert(board.rows === 7 && board.cols === 7, "Board initialized with 7x7 grid")
assert(board.currentPlayer === PLAYER.X, "Initial player is X")

// Test 2: Basic Moves (Left and Right)
let success = board.makeMove(0, SIDE.LEFT) // X at (0, 0)
assert(success, "Move (0, L) successful")
assert(board.grid[0][0] === PLAYER.X, "Piece placed at (0, 0)")
assert(board.currentPlayer === PLAYER.O, "Player switched to O")

success = board.makeMove(0, SIDE.RIGHT) // O at (0, 6)
assert(success, "Move (0, R) successful")
assert(board.grid[0][6] === PLAYER.O, "Piece placed at (0, 6)")

// Test 3: Stacking
board.makeMove(0, SIDE.LEFT) // X at (0, 1)
assert(board.grid[0][1] === PLAYER.X, "Piece stacked from Left at (0, 1)")

board.makeMove(0, SIDE.RIGHT) // O at (0, 5)
assert(board.grid[0][5] === PLAYER.O, "Piece stacked from Right at (0, 5)")

// Test 4: Meeting in the middle
// Row 0 currently: [X, X, null, null, null, O, O]
// Fill remaining: 2, 3, 4
board.makeMove(0, SIDE.LEFT) // X at (0, 2)
board.makeMove(0, SIDE.RIGHT) // O at (0, 4)
board.makeMove(0, SIDE.LEFT) // X at (0, 3) - Middle
assert(board.grid[0][3] === PLAYER.X, "Pieces met in the middle")

// Test 5: Row Full
success = board.makeMove(0, SIDE.LEFT)
assert(!success, "Cannot move in full row")

// Test 6: Win Detection (Horizontal)
const board2 = new Board()
board2.makeMove(1, SIDE.LEFT) // X
board2.makeMove(2, SIDE.LEFT) // O
board2.makeMove(1, SIDE.LEFT) // X
board2.makeMove(2, SIDE.LEFT) // O
board2.makeMove(1, SIDE.LEFT) // X
board2.makeMove(2, SIDE.LEFT) // O
board2.makeMove(1, SIDE.LEFT) // X - Wins horizontal (1,0), (1,1), (1,2), (1,3)
assert(board2.winner === PLAYER.X, "Horizontal win detected")
assert(board2.gameOver === true, "Game over set")

// Test 7: Win Detection (Vertical)
const board3 = new Board()
// X at (0,0), (1,0), (2,0), (3,0)
board3.makeMove(0, SIDE.LEFT) // X
board3.makeMove(0, SIDE.RIGHT) // O
board3.makeMove(1, SIDE.LEFT) // X
board3.makeMove(1, SIDE.RIGHT) // O
board3.makeMove(2, SIDE.LEFT) // X
board3.makeMove(2, SIDE.RIGHT) // O
board3.makeMove(3, SIDE.LEFT) // X
assert(board3.winner === PLAYER.X, "Vertical win detected")

console.log("--- All Tests Passed ---")
