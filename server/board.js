const { PLAYER, SIDE } = require("../shared/enums.js")

class Board {
  constructor() {
    this.rows = 7
    this.cols = 7
    this.grid = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols).fill(null))
    this.currentPlayer = PLAYER.X
    this.winner = null
    this.gameOver = false
    this.winningCells = []
    this.latestCell = { row: null, column: null }
  }

  reset() {
    this.grid = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols).fill(null))
    this.currentPlayer = PLAYER.X
    this.winner = null
    this.gameOver = false
    this.winningCells = []
    this.latestCell = { row: null, column: null }
  }

  // Helper to deep copy the board for state retrieval
  getBoardState() {
    return {
      grid: this.grid.map((row) => [...row]),
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      gameOver: this.gameOver,
      moves: this.getValidMoves(),
      winningCells: this.winningCells,
      latestCell: this.latestCell,
    }
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === PLAYER.X ? PLAYER.O : PLAYER.X
  }

  // Move: { row: number, side: SIDE.LEFT | SIDE.RIGHT }
  makeMove(row, side) {
    if (this.gameOver) return false
    if (row < 0 || row >= this.rows) return false
    if (side !== SIDE.LEFT && side !== SIDE.RIGHT) return false

    const rowArr = this.grid[row]
    let placed = false

    if (side === SIDE.LEFT) {
      // Find the first empty spot from the left
      for (let c = 0; c < this.cols; c++) {
        if (rowArr[c] === null) {
          rowArr[c] = this.currentPlayer
          placed = true
          this.latestCell = { row: row, column: c, side: SIDE.LEFT }
          break
        } else if (c === this.cols - 1) {
          // Row is full
          return false
        }
      }
    } else {
      // Same logic, but from the right
      for (let c = this.cols - 1; c >= 0; c--) {
        if (rowArr[c] === null) {
          rowArr[c] = this.currentPlayer
          placed = true
          this.latestCell = { row: row, column: c, side: SIDE.RIGHT }
          break
        }
      }
    }

    if (!placed) return false

    if (this.checkWin()) {
      this.winner = this.currentPlayer
      this.gameOver = true
    } else if (this.checkDraw()) {
      this.gameOver = true
    } else {
      this.switchPlayer()
    }

    return true
  }

  checkDraw() {
    return this.grid.every((row) => row.every((cell) => cell !== null))
  }

  getValidMoves() {
    const validMoves = []

    for (let row = 0; row < this.rows; row++) {
      const rowArr = this.grid[row]
      const hasEmptyCell = rowArr.some((cell) => cell === null)

      if (hasEmptyCell) {
        validMoves.push({ row, side: SIDE.LEFT })
        validMoves.push({ row, side: SIDE.RIGHT })
      }
    }

    return validMoves
  }

  checkWin() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const player = this.grid[r][c]
        if (!player) continue

        // Horizontal
        if (
          c + 3 < this.cols &&
          this.grid[r][c + 1] === player &&
          this.grid[r][c + 2] === player &&
          this.grid[r][c + 3] === player
        ) {
          this.winningCells = [
            { row: r, column: c },
            { row: r, column: c + 1 },
            { row: r, column: c + 2 },
            { row: r, column: c + 3 },
          ]
          return true
        }

        // Vertical
        if (
          r + 3 < this.rows &&
          this.grid[r + 1][c] === player &&
          this.grid[r + 2][c] === player &&
          this.grid[r + 3][c] === player
        ) {
          this.winningCells = [
            { row: r, column: c },
            { row: r + 1, column: c },
            { row: r + 2, column: c },
            { row: r + 3, column: c },
          ]
          return true
        }

        // Diagonal Down-Right
        if (
          r + 3 < this.rows &&
          c + 3 < this.cols &&
          this.grid[r + 1][c + 1] === player &&
          this.grid[r + 2][c + 2] === player &&
          this.grid[r + 3][c + 3] === player
        ) {
          this.winningCells = [
            { row: r, column: c },
            { row: r + 1, column: c + 1 },
            { row: r + 2, column: c + 2 },
            { row: r + 3, column: c + 3 },
          ]
          return true
        }

        // Diagonal Down-Left
        if (
          r + 3 < this.rows &&
          c - 3 >= 0 &&
          this.grid[r + 1][c - 1] === player &&
          this.grid[r + 2][c - 2] === player &&
          this.grid[r + 3][c - 3] === player
        ) {
          this.winningCells = [
            { row: r, column: c },
            { row: r + 1, column: c - 1 },
            { row: r + 2, column: c - 2 },
            { row: r + 3, column: c - 3 },
          ]
          return true
        }
      }
    }
    return false
  }
}

module.exports = { Board, PLAYER, SIDE }
