const { Board, PLAYER, SIDE } = require("../board")

/**
 * Medium AI - Strategic move selection with lookahead
 * Priorities:
 * 1. Win immediately if possible
 * 2. Block opponent from winning
 * 3. Create multiple winning threats
 * 4. Make moves that set up future wins
 */

/**
 * Clone a board to simulate moves
 */
function cloneBoard(board) {
  const newBoard = new Board()
  newBoard.grid = board.grid.map((row) => [...row])
  newBoard.currentPlayer = board.currentPlayer
  newBoard.winner = board.winner
  newBoard.gameOver = board.gameOver
  newBoard.winningCells = [...board.winningCells]
  newBoard.latestCell = { ...board.latestCell }
  return newBoard
}

/**
 * Check if a move would result in a win
 */
function isWinningMove(board, move, player) {
  const testBoard = cloneBoard(board)
  testBoard.currentPlayer = player
  testBoard.makeMove(move.row, move.side)
  return testBoard.winner === player
}

/**
 * Count how many 3-in-a-row threats a player has (one move away from winning)
 */
function countThreats(board, player) {
  let threats = 0
  const grid = board.grid

  // Check all possible 4-in-a-row positions
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      // Horizontal
      if (c + 3 < board.cols) {
        const cells = [
          grid[r][c],
          grid[r][c + 1],
          grid[r][c + 2],
          grid[r][c + 3],
        ]
        if (countPlayerCells(cells, player) === 3 && cells.includes(null)) {
          threats++
        }
      }

      // Vertical
      if (r + 3 < board.rows) {
        const cells = [
          grid[r][c],
          grid[r + 1][c],
          grid[r + 2][c],
          grid[r + 3][c],
        ]
        if (countPlayerCells(cells, player) === 3 && cells.includes(null)) {
          threats++
        }
      }

      // Diagonal Down-Right
      if (r + 3 < board.rows && c + 3 < board.cols) {
        const cells = [
          grid[r][c],
          grid[r + 1][c + 1],
          grid[r + 2][c + 2],
          grid[r + 3][c + 3],
        ]
        if (countPlayerCells(cells, player) === 3 && cells.includes(null)) {
          threats++
        }
      }

      // Diagonal Down-Left
      if (r + 3 < board.rows && c - 3 >= 0) {
        const cells = [
          grid[r][c],
          grid[r + 1][c - 1],
          grid[r + 2][c - 2],
          grid[r + 3][c - 3],
        ]
        if (countPlayerCells(cells, player) === 3 && cells.includes(null)) {
          threats++
        }
      }
    }
  }

  return threats
}

/**
 * Count how many cells belong to a player in an array
 */
function countPlayerCells(cells, player) {
  return cells.filter((cell) => cell === player).length
}

/**
 * Detect if opponent will have an unblockable threat after this move
 * An unblockable threat is when opponent has 2+ in a row with open spaces
 * that can be filled from both sides, creating a guaranteed win scenario
 */
function hasUnblockableThreat(board, player) {
  const grid = board.grid
  let unblockableThreats = 0

  // Check horizontal rows for patterns like: null-X-X-null or null-null-X-X-null-null
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c <= board.cols - 4; c++) {
      const cells = [grid[r][c], grid[r][c + 1], grid[r][c + 2], grid[r][c + 3]]
      const playerCount = countPlayerCells(cells, player)
      const nullCount = cells.filter((cell) => cell === null).length

      // Pattern: 2 player pieces and 2 empty in a 4-cell window
      if (playerCount === 2 && nullCount === 2) {
        // Check if the pattern allows filling from both sides
        // This is dangerous because opponent can create 3-in-a-row with 2 ways to win
        const opponentCells = cells.filter(
          (cell) => cell !== null && cell !== player
        )
        if (opponentCells.length === 0) {
          unblockableThreats++
        }
      }

      // Even more dangerous: 3 in a row with space on both ends
      if (playerCount === 3 && nullCount === 1) {
        // Check if there's space on both sides (in the same row)
        const leftSpace = c > 0 && grid[r][c - 1] === null
        const rightSpace = c + 4 < board.cols && grid[r][c + 4] === null

        // If the empty cell is in the middle and there's space on both ends
        const emptyIndex = cells.indexOf(null)
        if (emptyIndex !== -1 && leftSpace && rightSpace) {
          unblockableThreats += 2 // Very dangerous
        }
      }
    }
  }

  // Check for vertical and diagonal patterns (similar logic)
  // For now, focus on horizontal as it's most common in side-stacker

  return unblockableThreats
}

/**
 * Count opponent winning moves after a board state
 */
function countOpponentWinningMoves(board, opponent) {
  let winningMoves = 0
  const validMoves = board.getValidMoves()

  for (const move of validMoves) {
    if (isWinningMove(board, move, opponent)) {
      winningMoves++
    }
  }

  return winningMoves
}

/**
 * Simulate opponent's best move and check if they can create multiple threats
 */
function canOpponentCreateMultipleThreats(board, opponent) {
  const opponentMoves = board.getValidMoves()

  for (const oppMove of opponentMoves) {
    const testBoard = cloneBoard(board)
    testBoard.currentPlayer = opponent
    testBoard.makeMove(oppMove.row, oppMove.side)

    // After opponent's move, count how many ways they can win
    const winningMoves = countOpponentWinningMoves(testBoard, opponent)
    if (winningMoves >= 2) {
      // Opponent can create an unblockable position (2+ ways to win)
      return true
    }
  }

  return false
}

/**
 * Evaluate a move's strategic value
 */
function evaluateMove(board, move) {
  const aiPlayer = board.currentPlayer
  const opponent = aiPlayer === PLAYER.X ? PLAYER.O : PLAYER.X

  // Simulate the move
  const testBoard = cloneBoard(board)
  testBoard.makeMove(move.row, move.side)

  let score = 0

  // Priority 1: Immediate win (highest priority)
  if (testBoard.winner === aiPlayer) {
    return 10000
  }

  // Priority 2: Check if opponent can win on their next move (must block)
  const opponentWinningMoves = countOpponentWinningMoves(testBoard, opponent)
  if (opponentWinningMoves > 0) {
    // If opponent has multiple ways to win, this move is terrible
    score -= 5000 * opponentWinningMoves
  }

  // Priority 2.5: 2-move lookahead - Can opponent create multiple threats?
  if (canOpponentCreateMultipleThreats(testBoard, opponent)) {
    // This move allows opponent to set up an unblockable position next turn
    score -= 4000
  }

  // Priority 2.75: Detect unblockable threats (opponent can set up guaranteed win)
  const unblockableThreats = hasUnblockableThreat(testBoard, opponent)
  if (unblockableThreats > 0) {
    // Heavily penalize moves that allow opponent to create unblockable positions
    score -= 3000 * unblockableThreats
  }

  // Priority 3: Count threats created for AI (multiple winning angles)
  const aiThreats = countThreats(testBoard, aiPlayer)
  score += aiThreats * 100

  // Priority 4: Reduce opponent's threats
  const opponentThreats = countThreats(testBoard, opponent)
  score -= opponentThreats * 50

  // Prefer center rows for better positioning
  const centerRow = Math.floor(board.rows / 2)
  const distanceFromCenter = Math.abs(move.row - centerRow)
  score -= distanceFromCenter * 5

  return score
}

function selectMove(board) {
  const validMoves = board.getValidMoves()

  if (validMoves.length === 0) {
    return null
  }

  const aiPlayer = board.currentPlayer
  const opponent = aiPlayer === PLAYER.X ? PLAYER.O : PLAYER.X

  // Priority 1: Check for immediate winning moves
  for (const move of validMoves) {
    if (isWinningMove(board, move, aiPlayer)) {
      return move
    }
  }

  // Priority 2: Block opponent's winning moves
  for (const move of validMoves) {
    if (isWinningMove(board, move, opponent)) {
      return move
    }
  }

  // Priority 3: Evaluate all moves strategically
  let bestMove = validMoves[0]
  let bestScore = -Infinity

  for (const move of validMoves) {
    const score = evaluateMove(board, move)
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}

module.exports = {
  selectMove,
}
